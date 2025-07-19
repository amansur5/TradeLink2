from db import get_db_connection

def check_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check total products
        cursor.execute('SELECT COUNT(*) as count FROM products')
        result = cursor.fetchone()
        print(f"Total products in database: {result['count']}")
        
        # Check products for a specific producer (if any)
        cursor.execute('SELECT DISTINCT producer_id FROM products LIMIT 5')
        producers = cursor.fetchall()
        print(f"Producers with products: {[p['producer_id'] for p in producers]}")
        
        # Show sample products
        cursor.execute('SELECT id, name, producer_id, created_at FROM products LIMIT 5')
        products = cursor.fetchall()
        print("\nSample products:")
        for product in products:
            print(f"- ID: {product['id']}, Name: {product['name']}, Producer: {product['producer_id']}, Created: {product['created_at']}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_products() 