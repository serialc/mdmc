<?php
// Filename: api.php
// Purpose: direct requests to the appropriate code

namespace frakturmedia\movedata;

require_once('../php/constants.php');
require_once('../php/functions.php');
require_once('../php/classes/db.php');

$db = new DataBaseConnection();

// need to retrieve POST
$pdata = json_decode(file_get_contents("php://input"), true);

switch ($pdata['req'])
{
case "dates":
    echo buildResponse( $db->getDates() );
    break;

case "data":
    echo buildResponse( $db->getDateBusDir($pdata['value'], $pdata['bus_num'], $pdata['bus_dir']) );
    break;

case "date_groups":
    echo buildResponse( $db->getDateGroups($pdata['value']) );
    break;

case "write_bus_number":
    if ($db->setAttribute('busnum', $pdata['bus'], $pdata['value'])) {
        echo buildResponse( $db->getDateGroups($pdata['date']) );
    } else {
        echo buildResponse("Unable to update bus number", 500);
    }
    break;

case "write_bus_direction":
    if ($db->setAttribute('tripcode', $pdata['direction'], $pdata['value'])) {
        echo buildResponse( $db->getDateGroups($pdata['date']) );
    } else {
        echo buildResponse("Unable to update bus number", 500);
    }
    break;

case "hide_points":
    // set visible to 0/FALSE
    if ($db->setAttribute('visible', 0, $pdata['dt_list'])) {
        echo buildResponse( $db->getDateGroups($pdata['date']) );
    } else {
        echo buildResponse("Unable to update bus number", 500);
    }
    break;

case "reset_set_points":
    // set points with specific date, bus num, dir, and visible=0 as visible=1
    if ($db->resetVisibility($pdata['date'], $pdata['busnum'], $pdata['busdir'])) {
        echo buildResponse( $db->getDateGroups($pdata['date']) );
    } else {
        echo buildResponse("Unable to update bus number", 500);
    }
    break;

case "delete_day":
    if ($db->deleteDay($pdata['date'])) {
        echo buildResponse( $db->getDates() );
    } else {
        echo buildResponse("Unable to update bus number", 500);
    }
    break;

default:
    echo buildResponse( "Didn't find request type", 500);
}


// EOF
