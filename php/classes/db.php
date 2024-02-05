<?php

// Filename: php/classes/db.php
// Purpose: Handles all DB access

namespace frakturmedia\movedata;

//use Datetime;
use PDO;

date_default_timezone_set(TIMEZONE);

class DataBaseConnection
{
    # define private variables here
    private $conn;

    # constructor
    public function __construct()
    {
        // create connection, MySQL setup
        try {
            $this->conn = new PDO(
                'mysql:host=' . DB_SERVER . ';dbname=' . DB_NAME . ';charset=utf8',
                DB_USER,
                DB_PASS,
                [PDO::MYSQL_ATTR_INIT_COMMAND =>"SET NAMES utf8;SET time_zone = '" . TIMEZONE . "'"]
            );

            if (DEBUG_MODE) {
                echo "MySQL driver name:<br>";
                echo $this->conn->getAttribute(PDO::ATTR_DRIVER_NAME);
                echo ' (' . $this->conn->getAttribute(PDO::ATTR_CLIENT_VERSION) . ')<br>';
            }
        } catch (PDOException $e) {
            // Database connection failed
            echo "Database connection failed" and die;
        }
    }

    public function __destruct()
    {
        # php will close the db connection automatically when the process ends
        $this->conn = null;
        //mysqli_close($this->conn);
    }

    public function checkTZ()
    {
        //$this->conn->exec("SET time_zone = '" . date('P') . "'");
        $sql = "SELECT @@global.time_zone, @@session.time_zone";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    public function getDates()
    {
        $sql = "SELECT DATE(dt) AS dates FROM " . TABLE_MOVE_DATA . " GROUP BY DATE(dt)";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        $dates = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($dates, $row['dates']);
        }
        return $dates;
    }

    public function getDateBusDir($thedate, $busnum, $busdir)
    {
        $sql = "SELECT * FROM " . TABLE_MOVE_DATA . " WHERE DATE(dt) = ? " .
            " AND visible IS TRUE " .
            " AND busnum " .   (is_null($busnum) ? "IS NULL" : "= ?") .
            " AND tripcode " . (is_null($busdir) ? "IS NULL" : "= ?");
        $stmt = $this->conn->prepare($sql);

        if (is_null($busnum)) {
            if (is_null($busdir)) {
                $stmt->execute([$thedate]);
            } else {
                $stmt->execute([$thedate, $busdir]);
            }
        } else {
            if (is_null($busdir)) {
                $stmt->execute([$thedate, $busnum]);
            } else {
                $stmt->execute([$thedate, $busnum, $busdir]);
            }
        }

        $points = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($points, $row);
        }
        return $points;
    }

    public function getDateGroups($thedate)
    {
        $sql = "SELECT busnum, tripcode, segment, COUNT(*) as count FROM " . TABLE_MOVE_DATA .
            " WHERE DATE(dt) = ? AND visible IS TRUE GROUP BY busnum, tripcode, segment";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$thedate]);

        $groups = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($groups, $row);
        }
        return $groups;
    }

    public function resetVisibility($date, $bnum, $bdir)
    {
        $sql = "UPDATE " . TABLE_MOVE_DATA . " SET visible=1 WHERE " .
            "DATE(dt) = ? AND busnum = ? AND tripcode = ? AND visible = 0";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$date, $bnum, $bdir]);
    }

    public function setAttribute($field_name, $field_value, $dt)
    {
        // devide the processing into sets
        $setnum = count($dt)/5000;

        $sql = "UPDATE " . TABLE_MOVE_DATA . " SET " . $field_name . "=? WHERE ";

        $lastindex = count($dt) - 1;

        for ($i = 0; $i < count($dt); $i += 1) {
            if ($i === $lastindex) {
                $sql .= "dt = ?";
            } else {
                $sql .= "dt = ? OR ";
            }
        }

        $stmt = $this->conn->prepare($sql);
        // add the array field as the first '?' value
        array_unshift($dt, $field_value);

        return $stmt->execute($dt);
    }

    public function deleteDay($datadate)
    {
        $sql = "DELETE FROM " . TABLE_MOVE_DATA . " WHERE DATE(dt)=?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$datadate]);
    }
}

// EOF
