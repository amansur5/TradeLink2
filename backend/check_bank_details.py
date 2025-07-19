import mysql.connector
from config import DB_CONFIG

def check_bank_details():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'producer_bank_details'")
        tables = cursor.fetchall()
        print("producer_bank_details table exists:", len(tables) > 0)
        
        if len(tables) > 0:
            # Check table structure
            cursor.execute("DESCRIBE producer_bank_details")
            columns = cursor.fetchall()
            print("\nTable structure:")
            for column in columns:
                print(f"  {column[0]} - {column[1]}")
            
            # Check number of records
            cursor.execute("SELECT COUNT(*) FROM producer_bank_details")
            count = cursor.fetchone()[0]
            print(f"\nNumber of bank details records: {count}")
            
            # Show sample records
            if count > 0:
                cursor.execute("SELECT * FROM producer_bank_details LIMIT 5")
                records = cursor.fetchall()
                print("\nSample records:")
                for record in records:
                    print(f"  {record}")
            else:
                print("\nNo bank details records found.")
                
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_bank_details() 