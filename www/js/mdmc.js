MD = {
    data: {},
    selection: []
    };

MD.dbRequest = function(data, callbackFunc)
{
    fetch('/api.php', {
        method: 'POST',
        timeout: 15,
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then((response) => response.json())
    .then((data) => { callbackFunc(data); })
    .catch(() => { console.log("Failed request"); });
};

MD.updateDatesList = function(list)
{
    let sel_date = document.getElementById('select_date');

    // insert each date into select element
    for (let i = 0; i < list.length; i+=1) {
        let opt = document.createElement('option');
        opt.value = list[i];
        opt.innerHTML = list[i];
        sel_date.appendChild(opt);
    }
};

MD.processDate = function(points)
{
    // save the points
    MD.data.points = points;
    let circles = [];

    for (let i = 0; i < points.length; i+=1) {
        p = points[i];
        circles.push(L.circle([p['lat'], p['lng']], {
            color: 'black',
            fillColor: 'red',
            fillOpacity: 0.5,
            radius: 1 + parseInt(p['spdms'], 10)
        }).addTo(MD.map));
    }

    MD.data.circles = circles;
    return true;
};

MD.initSimpleSelect = function()
{


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

            console.log(bounds);


            for (let i = 0; i < MD.data.points.length; i += 1) {
                // Note L.LatLng() and L.latLng() exist
                let ll = L.latLng(MD.data.points[i].lat, MD.data.points[i].lng);
                if (bounds.contains(ll) === true) {
                    MD.selection.push(i);
                }
            }
        }
    });

    L.Map.addInitHook('addHandler', 'rectselect', L.RectSelect);
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

    // setup the selection tool
    MD.initSimpleSelect();

    // get list of dates
    MD.dbRequest({'req': 'dates'}, MD.updateDatesList);

    // add event listener
    let sel_date = document.getElementById('select_date');
    sel_date.addEventListener("change", function() {
        MD.dbRequest({'req': 'date', 'value': sel_date.value}, MD.processDate);
    });

}();
