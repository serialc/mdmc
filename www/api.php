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
case "date":
    echo buildResponse( $db->getDate($pdata['value']) );
    break;
}


// EOF
