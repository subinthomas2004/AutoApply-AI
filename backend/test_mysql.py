import pymysql

passwords = ['', 'root', 'admin', 'password', '1234', '12345', '123456', '12345678', 'mysql', 'subin', 'Subin@123', 'subin123', 'Subin#123', 'root123', 'Admin@123']
found = False
for p in passwords:
    try:
        conn = pymysql.connect(host='localhost', user='root', password=p, port=3306, connect_timeout=1)
        print(f"SUCCESS! Root password is: '{p}'")
        found = True
        conn.close()
        break
    except Exception as e:
        pass

if not found:
    print("None of the common passwords worked.")
