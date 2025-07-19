from db import get_db_connection

def run_migration():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Add payment fields to orders table
        migration_queries = [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255) NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_timestamp DATETIME NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN' AFTER total_amount"
        ]
        
        for query in migration_queries:
            try:
                cursor.execute(query)
                print(f"Executed: {query}")
            except Exception as e:
                print(f"Error executing {query}: {e}")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration() 