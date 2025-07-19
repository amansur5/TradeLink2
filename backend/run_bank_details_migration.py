#!/usr/bin/env python3
"""
Script to run the producer bank details migration
"""

from db import get_db_connection

def run_migration():
    """Run the bank details migration"""
    try:
        # Read the SQL file
        with open('add_producer_bank_details.sql', 'r') as f:
            sql_commands = f.read()
        
        # Split into individual commands
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Running bank details migration...")
        
        for i, command in enumerate(commands, 1):
            if command:
                try:
                    print(f"Executing command {i}/{len(commands)}: {command[:50]}...")
                    cursor.execute(command)
                    conn.commit()
                    print(f"✓ Command {i} executed successfully")
                except Exception as e:
                    print(f"⚠ Command {i} failed: {e}")
                    # Continue with other commands
                    continue
        
        print("\nMigration completed!")
        
        # Verify the tables were created
        cursor.execute("SHOW TABLES LIKE 'producer_bank_details'")
        if cursor.fetchone():
            print("✓ producer_bank_details table exists")
        else:
            print("✗ producer_bank_details table not found")
        
        cursor.execute("DESCRIBE users")
        columns = [col[0] for col in cursor.fetchall()]
        bank_columns = ['bank_name', 'account_name', 'account_number']
        for col in bank_columns:
            if col in columns:
                print(f"✓ {col} column exists in users table")
            else:
                print(f"✗ {col} column not found in users table")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    run_migration() 