from db import get_db_connection

def check_orders_table():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check table structure
        cursor.execute("DESCRIBE orders")
        columns = cursor.fetchall()
        print("Orders table structure:")
        for column in columns:
            print(f"- {column['Field']}: {column['Type']} {column['Null']} {column['Key']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_orders_table() 