import mariadb
import sys
from datetime import datetime

data = "../arduino/data/commute.csv"

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
tenthousands = 0

with open(data, 'r') as fh:
    header = True

    for l in fh:
        # skip first line
        if header:
            header = False
            continue

        p = l.strip().split(',')
        #print(commitcount, p)
        try:
            dt = datetime.strptime(p[0] + ' ' + p[1], "%y/%m/%d %H:%M:%S")
        except ValueError:
            print("Skipping row with invalid date-time " + p[0] + ' ' + p[1])
            continue

        query = "INSERT IGNORE INTO busmov (dt, satnum, altitude, spdms, lat, lng, batv) VALUES (?, ?, ?, ?, ?, ?, ?)"
        value_tuple = (dt.strftime("%Y-%m-%d %H:%M:%S"), p[2], p[3], p[4], p[5], p[6], p[7])
        c.execute(query, value_tuple)
        commitcount += 1

        if commitcount > comminterval:
            conn.commit()
            commitcount = 0
            tenthousands += 1
            print("Processed " + str(tenthousands) + "0,000 rows")

c.close()
conn.close()

