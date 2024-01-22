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

    public function getDate($thedate)
    {
        $sql = "SELECT * FROM " . TABLE_MOVE_DATA . " WHERE DATE(dt) = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$thedate]);

        $points = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($points, $row);
        }
        return $points;
    }

    public function userExists($uname)
    {
        $sql = "SELECT COUNT(*) as number FROM " . TABLE_USERS .
           " WHERE username=?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$uname]);
        if ($stmt->fetchAll(PDO::FETCH_ASSOC)[0]['number'] == 1) {
            return true;
        } else {
            return false;
        }
    }

    public function updateUser($uname, $institute, $email, $status, $pwd, $uid, $ntf_nr, $ntf_no, $ntf_nq, $ntf_pq, $ntf_om)
    {
        $sql = "UPDATE " . TABLE_USERS .
            " SET username=?, institute=?, email=?, status=?, password=?, ntf_newreg=?, ntf_newoer=?, ntf_newqry=?, ntf_perqry=?, ntf_oermod=? WHERE uid=?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$uname, $institute, $email, $status, $pwd, $ntf_nr, $ntf_no, $ntf_nq, $ntf_pq, $ntf_om, $uid]);
    }

    public function deleteUserCode($code)
    {
        $sql = "DELETE FROM " . TABLE_CODES . " WHERE code=?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$code]);
    }

}

// EOF
