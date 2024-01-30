MD = {
    data: {
        points: [],
        llpoints: [],
        circles: [],
        selection: []
    },
    codes: {
        country: {
            1: "Luxembourg",
            2: "Germany"
        }
    }
};

MD.dbRequest = function(data, callbackFunc)
{
    // clear selection
    MD.select('none');

    MD.setStatus('Completing request ' + data.req);

    fetch('/api.php', {
        method: 'POST',
        timeout: 15,
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then((response) => response.json())
    .then((data) => {
        MD.setStatus('');
        callbackFunc(data);
    })
    .catch((err) => {
        throw err;
        console.log(data);
        MD.setStatus('Failed loading ' + data.req);
        console.log("Failed request " + data.req);
    });
};

MD.updateDatesList = function(list)
{
    let sel_date = document.getElementById('select_date');

    MD.data.dates_list = list;

    // insert each date into select element
    for (let i = 0; i < list.length; i+=1) {
        let opt = document.createElement('option');
        opt.value = list[i];
        opt.innerHTML = list[i];
        sel_date.appendChild(opt);
    }

    // select first item from dates
    if (localStorage.getItem('last_date') === null) {
        MD.focus_date = list[0];
    } else {
        MD.focus_date = localStorage.getItem('last_date');
    }

    // load the selected date
    let selectDate = document.getElementById('select_date');
    selectDate.value = MD.focus_date;

    // fire a change event on the selection element
    selectDate.dispatchEvent(new Event('change'));
};

MD.parseDateGroups = function(groups)
{
    // delete SVG elem if it already exists
    if ( document.getElementById("svggraph") ) { svggraph.remove(); }

    // build an array of bus numbers, with directions in sub array
    let day_data = {};
    for (let i = 0; i < groups.length; i += 1) {
        let row = groups[i];

        if (!day_data.hasOwnProperty(row.busnum)) {
            day_data[row.busnum] = [];
        }

        day_data[row.busnum].push({"dir": row.tripcode === null ? "none" : row.tripcode, "count": row.count});
    }

    // save the day data 
    MD.data.day_groups = day_data;

    MD.displayDateBusDirections(day_data, true);

    // remove all pre-existing circles on the map and clear points data
    MD.clearMapAndData();
};

MD.displayDateBusDirections = function(day_data, auto_load)
{
    MD.deleteBusOrDirectionButtons('both');
    MD.displayDataDescription();

    // get the elements holding the bus numbers and directions
    let bnum_el = document.getElementById('filter_bus_number');
    let bdir_el = document.getElementById('filter_bus_direction');

    // now display each bus number
    for (bus in day_data) {
        let busnum = bus;
        let btn = document.createElement("input");
        let lbl = document.createElement("label");

        btn.classList.add("btn-check");
        btn.type = "radio";
        btn.name = "bus_num_radio";
        btn.id = "bus_num_" + busnum;
        lbl.classList.add("btn", "btn-outline-primary");
        lbl.setAttribute("for", "bus_num_" + busnum);
        lbl.appendChild( document.createTextNode(bus) );

        // determine if selected
        //if (MD.bus_number === busnum) { btn.checked = true; }

        btn.addEventListener('click', function(e) {
            // save selection
            MD.bus_number = busnum;

            // clear the direction buttons
            MD.deleteBusOrDirectionButtons('busdir');

            let dirs = day_data[busnum];

            // display the directions for this bus
            for (d in dirs) {
                let direction = day_data[busnum][d].dir;

                let dbtn = document.createElement("input");
                let dlbl = document.createElement("label");

                dbtn.classList.add("btn-check");
                dbtn.type = "radio";
                dbtn.name = "bus_dir_radio";
                dbtn.id = "bus_dir_" + direction;
                dlbl.classList.add("btn", "btn-outline-primary");
                dlbl.setAttribute("for", "bus_dir_" + direction);
                dlbl.appendChild( document.createTextNode(MD.codes.country[direction]) );
                dlbl.title = dirs[d].count;

                dbtn.addEventListener('click', function(e) {
                    // save selection
                    MD.bus_direction = direction;

                    // load the data for this date, bus, trip direction
                    MD.dbRequest({
                        'req': 'data',
                        'value': MD.focus_date,
                        'bus_num': busnum === "null" ? null : busnum,
                        'bus_dir': direction === "none" ? null : direction
                    }, MD.displayData);
                });
                bdir_el.append(dbtn);
                bdir_el.append(dlbl);

                // if only one dir 
                if (dirs.length === 1 || MD.bus_direction === direction) {
                    dbtn.dispatchEvent(new Event('click'));
                    dbtn.checked = true;
                }
            }
        });
        bnum_el.append(btn);
        bnum_el.append(lbl);

        // get the number of objects in day_data
        // if only one bus number, select it
        if (Object.keys(day_data).length === 1 || MD.bus_number === busnum) {
            btn.dispatchEvent(new Event('click'));
            btn.checked = true;
        }
    }
};

MD.deleteBusOrDirectionButtons = function(delete_button_class)
{

    if (delete_button_class === 'busnum' || delete_button_class === 'both') {
        let bnum_el = document.getElementById('filter_bus_number');

        let nbtninp = bnum_el.getElementsByTagName('input');
        let nbtnlbl = bnum_el.getElementsByTagName('label');

        // delete all the bus number buttons - a live list - delete smartly
        while (nbtninp.length > 0) { nbtninp[0].remove(); }
        while (nbtnlbl.length > 0) { nbtnlbl[0].remove(); }
    }

    if (delete_button_class === 'busdir' || delete_button_class === 'both') {
        let bdir_el = document.getElementById('filter_bus_direction');

        let dbtninp = bdir_el.getElementsByTagName('input');
        let dbtnlbl = bdir_el.getElementsByTagName('label');

        // delete all the bus number buttons - a live list - delete smartly
        while (dbtninp.length > 0) { dbtninp[0].remove(); }
        while (dbtnlbl.length > 0) { dbtnlbl[0].remove(); }
    }

};

MD.clearMapAndData = function()
{
    // remove all pre-existing circles from the map
    MD.data.circles.map((c) => c.remove());
    MD.data.circles = [];

    // clear points data
    MD.data.points = [];

    // clear description
    MD.displayDataDescription();
};

MD.displayData = function(points)
{
    // remove all pre-existing circles on the map and clear points data
    MD.clearMapAndData();

    // save the points
    MD.data.points = points;

    // get lat/lng and save as separate
    MD.data.llpoints = points.map(function(o) { return {"lat": parseFloat(o.lat), "lng": parseFloat(o.lng)}});

    let circles = [];
    for (let i = 0; i < points.length; i+=1) {
        p = points[i];
        circles.push(L.circle([p['lat'], p['lng']], {
            color: 'black',
            fillColor: 'blue',
            fillOpacity: 0.5,
            radius: Math.sqrt((parseInt(p['spdknts'], 10) * 0.51444)/Math.PI)
        }).addTo(MD.map));
    }

    // make svg graph
    MD.generateTimeGraph(points);

    // update the bus numbers and directions buttons
    //MD.displayDateBusDirections(MD.data.day_groups, false);

    // display information about the current selection
    MD.displayDataDescription();

    // save to global object
    MD.data.circles = circles;
    return true;
};

MD.displayDataDescription = function()
{
    let dd = document.getElementById("data_description");
    let dtext;
    if (MD.bus_number && MD.bus_direction) {
        dtext = "Bus " + MD.bus_number + ' - Direction ' + MD.codes.country[MD.bus_direction] + '<br>' +
        MD.data.points.length + ' data points<br>' +
        MD.data.selection.length + ' points selected';
    } else {
        dtext = "Select a bus and direction";
    }

    dd.innerHTML = dtext;
};

MD.generateTimeGraph = function(pdata)
{
    let el = document.getElementById('graphbox');
    const fullwidth = el.offsetWidth;
    const fullheight = el.offsetHeight;
    const margin = {top: 10, right: 10, bottom: 50, left: 40};
    const width  = fullwidth - margin.left - margin.right;
    const height = fullheight - margin.top  - margin.bottom;

    // clean the data
    let data = d3.map(pdata,
        function (d) {
            return { 
                dt : d3.timeParse("%Y-%m-%d %H:%M:%S")(d.dt),
                time: d.dt.split(' ')[1],
                // convert knots to spd in m/s then km/h
                spdkmh: parseFloat(d.spdknts, 10) * 0.51444 * 3.6,
                satnum: parseInt(d.satnum, 10)
            };
        }
    );

    // set domain(extent of values) and range(extent on canvas)
    const x = d3.scaleTime()
        .domain(d3.extent(data, (d) => d.dt))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.spdkmh).reverse())
        .range([0, height]);

    // delete SVG elem if it already exists
    if ( document.getElementById("svggraph") ) { svggraph.remove(); }

    // create the SVG elem and layout
    let svg = d3.select(el)
        .append('svg')
        .attr('id', 'svggraph')
        .attr("viewBox", "0 0 " + el.offsetWidth + " " + el.offsetHeight)
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr('id', 'graphbox');
    // All of the following elements appended to 'svg' will be appended to the graphbox

    // add the data to the SVG
    svg.append("g")
        .selectAll("dot")
        .data(data)
        .join("circle")
        .attr("cx", (d) => x(d.dt))
        .attr("cy", (d) => y(d.spdkmh))
        .attr('opacity', 0.5)
        .style("fill", "steelblue")
        .attr("r", (d) => d.satnum/5);

    // add the x axis line
    let xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%H:%M:%S"));
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // x-axis label
    svg.append("text")
        .attr("x", fullwidth/2)
        .attr("y", fullheight - margin.bottom/3)
        .attr("text-anchor", "middle") // [start, middle, end]
        .text("Time of day");

    // add the y axis line
    svg.append("g")
        .call(d3.axisLeft(y));

    // y-axis label
    svg.append("text")
        .attr("transform", "translate(" + -25 + " " + height + ") " + "rotate(-90)")
        .attr("text-anchor", "start") // [start, middle, end]
        .text("Speed (km/h)");

    // create drag box
    svg.append("rect")
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', height)
        .attr('opacity', 0.3)
        .style("fill", "pink")
        .attr('id', 'selbox');

    let selbox = svg.select('#selbox');

    // allow interaction
    let startx = false;
    svg.append("rect")
        .attr('x', -margin.left)
        .attr('y', -margin.top)
        .attr('width', fullwidth)
        .attr('height', fullheight)
        .attr('opacity', 0.01)
        .on("mousemove", function(d) {

            // only show selection if dragging
            if (startx !== false) {

                // rects can't have negative width
                let curx = d3.pointer(d)[0];
                if ( curx - startx < 0 ) {
                    selbox.attr('x', curx);
                    selbox.attr('width', startx - curx);
                } else {
                    selbox.attr('x', startx);
                    selbox.attr('width', curx - startx);
                }

                // force selection end
                if ( curx > width || curx < 0) {
                    if ( curx > startx ) {
                        MD.graphSelect(x.invert(startx), x.invert(curx));
                    } else {
                        MD.graphSelect(x.invert(curx), x.invert(startx));
                    }
                    startx = false;
                }
            }
        })
        .on("mousedown", function(d) {
            startx = d3.pointer(d)[0];
            selbox.attr('x', startx);
            selbox.attr('width', 0);
            selbox.style('display', '');
        })
        .on("mouseup", function(d) {
            // only perform select if we started select
            if (startx === false) { return; };

            let curx = d3.pointer(d)[0];
            if ( curx > startx ) {
                MD.graphSelect(x.invert(startx), x.invert(curx));
            } else {
                MD.graphSelect(x.invert(curx), x.invert(startx));
            }

            // end drag detection
            startx = false;
        });
};

MD.select = function(instruction)
{
    // select all indices
    if (instruction === 'all') {
        MD.data.selection = MD.data.points.map( (x,i) => i);
    }

    // clear selection
    if (instruction === 'none') {
        MD.data.selection = [];
    }

    // update map
    MD.resetMapSelection();

};

MD.graphSelect = function(sdt, edt)
{
    // reset the selection
    MD.data.selection = [];

    // clean the data
    let data = d3.map(MD.data.points,
        function (d) {
            return { 
                dt : d3.timeParse("%Y-%m-%d %H:%M:%S")(d.dt)
            };
        }
    );

    // get the indices of the selected items
    let dirty_data = data.map( (v, i) => {return (v.dt >= sdt && v.dt <= edt) ? i : false});

    // then filter out all undefined values
    MD.data.selection = dirty_data.filter( (v) => v !== false );

    // update map display
    MD.resetMapSelection();
};

// show points selection
MD.resetMapSelection = function()
{
    // go through each point
    for (let i = 0; i < MD.data.points.length; i += 1) {

        // change circle styling
        if (MD.data.selection.includes(i) === true) {
            MD.data.circles[i].setStyle({'fillColor': 'red', 'color': 'white'});
        } else {
            MD.data.circles[i].setStyle({'fillColor': 'blue', 'color': 'black'});
        }
    }

    // display information about the current selection
    MD.displayDataDescription();
};

MD.setStatus = function(status)
{
    let s = document.getElementById('status');
    s.innerHTML = status;

    // hide the status if message is empty
    if (status === '') {
        s.style.display = 'none';
    } else {
        s.style.display = '';
    }
};

MD.createMapFunctionality = function()
{
    // See event types: https://leafletjs.com/reference.html#map-event
    // Adding event Handlers: https://leafletjs.com/examples/extending/extending-3-controls.html
    
    L.RectSelect = L.Handler.extend({
        _startPoint: false,

        addHooks: function() {
            L.DomEvent.on(window, 'mouseup', this._onMouseUp, this);
            L.DomEvent.on(window, 'mousedown', this._onMouseDown, this);
        },

        removeHooks: function() {
            L.DomEvent.off(window, 'mouseup', this._onMouseUp, this);
            L.DomEvent.off(window, 'mousedown', this._onMouseDown, this);
        },

        _onMouseDown: function(e) {
            if (!e.shiftKey) { return; }

            // gets the map x,y grid location, not latlng
            this._startPoint = this._map.mouseEventToLayerPoint(e);
        },

        _onMouseUp: function(e) {
            if (!e.shiftKey) { return; }

            // gets the map x,y grid location, not latlng
            let endPoint = this._map.mouseEventToLayerPoint(e);

            // if the start and end coordinates are the same, return nothing
            if (endPoint.equals(this._startPoint)) { return; }

            // convert the map coordinates to latlng
            startLl = this._map.layerPointToLatLng(this._startPoint);
            endLl   = this._map.layerPointToLatLng(endPoint);

            // define the bounds
            // Note alternative usages:
            // new L.LatLngBounds()
            // - Note the 'new' and capital 'L.L...', or
            // L.latLngBounds()
            // - with no 'new' and than     'L.l...'
            let bounds = L.latLngBounds(startLl, endLl);

            // only process data points if there are any
            if (!MD.data.points || MD.data.points.length === 0) {
                return;
            }

            // reset the data selection
            MD.data.selection = [];

            // determine which points fall within selection bounds
            // and update the data model
            // go through each point
            for (let i = 0; i < MD.data.points.length; i += 1) {

                // Note both L.LatLng() and L.latLng() exist
                let ll = L.latLng(MD.data.points[i].lat, MD.data.points[i].lng);

                if (bounds.contains(ll) === true) {
                    // add to data model list
                    MD.data.selection.push(i);
                }
            }

            // goes through list of points and updates map view/symbology
            MD.resetMapSelection();

            // hide graph selection box (id=selbox)
            document.getElementById('selbox').style.display = 'none';
        }
    });

    L.Map.addInitHook('addHandler', 'rectselect', L.RectSelect);
};

MD.retrieveDtSelection = function()
{
    return MD.data.selection.map( i => MD.data.points[i].dt);
};

// Executes on load - keep at the end
MD.init = function()
{
    // create special map functions
    MD.createMapFunctionality();

    // Leaflet map
	MD.map = L.map('map', {rectselect: true}).setView([49.63, 6.26], 10);

	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(MD.map);

    // get list of dates
    MD.dbRequest({'req': 'dates'}, MD.updateDatesList);

    // add event listeners
    let sel_date = document.getElementById('select_date');

    sel_date.addEventListener("change", function() {
        // save in global and localStorage the selected date
        MD.focus_date = sel_date.value;
        localStorage.setItem('last_date', MD.focus_date);

        // get the data for the selected date
        MD.dbRequest({'req': 'date_groups', 'value': sel_date.value}, MD.parseDateGroups);
    });

    let ndate = document.getElementById('select_ndate');
    ndate.addEventListener('click', function() {
        let cdi = MD.data.dates_list.indexOf(sel_date.value);

        // make sure we're not at the last date
        if (cdi < MD.data.dates_list.length - 1) {
            // set date of html select as well as data model
            MD.focus_date = sel_date.value = MD.data.dates_list[cdi+1];
            sel_date.dispatchEvent(new Event('change'));
        }
    });

    let pdate = document.getElementById('select_pdate');
    pdate.addEventListener('click', function() {
        let cdi = MD.data.dates_list.indexOf(sel_date.value);

        // make sure we're not at the first date
        if (cdi > 0) {
            // set date of html select as well as data model
            MD.focus_date = sel_date.value = MD.data.dates_list[cdi-1];
            sel_date.dispatchEvent(new Event('change'));
        }
    });

    // change attributes of selected points

    let wbn = document.getElementById('submit_bus_number');
    wbn.addEventListener('click', function() {
        if ( MD.data.selection.length > 0 ) {
            let bus_num = document.getElementById('select_bus_number').value;
            MD.dbRequest({
                'req': 'write_bus_number',
                'date': MD.focus_date,
                'value': MD.retrieveDtSelection(),
                'bus': bus_num
            }, MD.parseDateGroups);
        } else {
            console.log("No selection");
        }
    });

    let wbd = document.getElementById('submit_bus_direction');
    wbd.addEventListener('click', function() {
        if ( MD.data.selection.length > 0 ) {
            let bus_dir = document.getElementById('select_bus_direction').value;
            MD.dbRequest({
                'req': 'write_bus_direction',
                'date': MD.focus_date,
                'value': MD.retrieveDtSelection(),
                'direction': bus_dir
            }, MD.parseDateGroups);
        } else {
            console.log("No selection");
        }
    });

    document.getElementById('select_all_btn').addEventListener('click', function() {
        MD.select('all');
    });
    document.getElementById('select_none_btn').addEventListener('click', function() {
        MD.select('none');
    });
    document.getElementById('hide_selection_btn').addEventListener('click', function() {
        // make it not visible
        if ( MD.data.selection.length > 0 ) {
            MD.dbRequest({
                'req': 'hide_points',
                'dt_list': MD.retrieveDtSelection(),
                'date': MD.focus_date
            }, MD.parseDateGroups);
        }
    });
    document.getElementById('delete_day').addEventListener('click', function() {
        if (window.confirm("Are you sure you want to delete the whole day?")) {
            MD.dbRequest({
                'req': 'delete_day',
                'date': MD.focus_date
            }, MD.updateDatesList);

            // update the localStorage to the next day as this day will no longer exist
            localStorage.setItem('last_date', MD.data.dates_list[MD.data.dates_list.indexOf(MD.focus_date) + 1]);
        }
    });
    document.getElementById('vbtn_belval').addEventListener('click', function() {
        MD.map.setView({ "lat": 49.5039, "lng": 5.94732}, 19);
    });
    document.getElementById('vbtn_trier').addEventListener('click', function() {
        MD.map.setView({ "lat": 49.76154, "lng": 6.63798}, 19);
    });
    document.getElementById('vbtn_data').addEventListener('click', function() {
        
        // get the points
        const p = MD.data.llpoints;

        if ( p.length === 0 ) { return; }

        let north = p[0].lat;
        let east = p[0].lng;
        let south = p[0].lat; 
        let west = p[0].lng;

        // find the max for each
        for (let i = 1; i < p.length; i += 1) {
            if (p[i].lat > north) { north = p[i].lat };
            if (p[i].lng > east ) { east = p[i].lng };
            if (p[i].lat < south) { south = p[i].lat };
            if (p[i].lng < west ) { west = p[i].lng };
        }

        // bounds are based on south-west and north-east corners 
        MD.map.fitBounds([[south, west],[north, east]]);
    });
    document.getElementById('vbtn_selection').addEventListener('click', function() {
        // get the points based on selection
        const p = MD.data.selection.map(s => MD.data.llpoints[s]);

        if ( p.length === 0 ) { return; }

        let north = p[0].lat;
        let east = p[0].lng;
        let south = p[0].lat; 
        let west = p[0].lng;

        // find the max for each
        for (let i = 1; i < p.length; i += 1) {
            if (p[i].lat > north) { north = p[i].lat };
            if (p[i].lng > east ) { east = p[i].lng };
            if (p[i].lat < south) { south = p[i].lat };
            if (p[i].lng < west ) { west = p[i].lng };
        }

        // bounds are based on south-west and north-east corners 
        MD.map.fitBounds([[south, west],[north, east]]);
    });
}();
