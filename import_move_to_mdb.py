import mariadb
import sys
import datetime
import pytz

#data = "/home/cyrille/Dropbox/Research/lux_free_transport_analysis/arduino/data/commute.csv"
#data = "/home/cyrille/Dropbox/Research/lux_free_transport_analysis/arduino/data/raw_commute_files/2024-03-14_COMMUTE.TXT"
#data = "/home/cyrille/Dropbox/Research/lux_free_transport_analysis/arduino/data/raw_commute_files/2024_09_18_COMMUTE.TXT"
exit("Specify file!")

mdbu = "cyrille"
mdbp = ""

# Connect to MariaDB
try:
    # connect to DB
    conn = mariadb.connect(
        user=mdbu,
        password=mdbp,
        host="localhost",
        database="testing"
    )

    # successful
    print("Connected to DB")
except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
    sys.exit(1)


c = conn.cursor()
comminterval = 10000
commitcount = 0
totalrows = 0

tzUTC = pytz.timezone("UTC")
tzCET = pytz.timezone("CET")

with open(data, 'r') as fh:
    print("Opened file successfully")

    header = True

    for l in fh:
        # skip first line
        if header:
            header = False
            continue

        p = l.strip().split(',')
        #print(commitcount, p)
        try:
            # define the tz as UTC
            dt = datetime.datetime.strptime(p[0] + ' ' + p[1], "%y/%m/%d %H:%M:%S")
            # convert to local timezone
            dtutc = tzUTC.localize(dt)
            dtcet = dtutc.astimezone(tzCET)

        except ValueError:
            print("Skipping row with invalid date-time " + p[0] + ' ' + p[1])
            continue

        query = "INSERT IGNORE INTO busmov (dt, satnum, altitude, spdknts, lat, lng, batv) VALUES (?, ?, ?, ?, ?, ?, ?)"
        value_tuple = ( dtcet.strftime("%Y-%m-%d %H:%M:%S"), p[2], p[3], p[4], p[5], p[6], p[7])
        c.execute(query, value_tuple)
        commitcount += 1

        if commitcount > comminterval:
            conn.commit()
            totalrows += commitcount
            commitcount = 0
            print("Processed " + str(totalrows) + " rows")

if commitcount > 0:
    conn.commit()
    totalrows += commitcount
    commitcount = 0
    print("Processed " + str(totalrows) + " rows")

c.close()
conn.close()

