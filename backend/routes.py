from flask import Blueprint, request, jsonify, send_from_directory
from db import get_db_connection
import bcrypt
import jwt
import os
from datetime import datetime
from functools import wraps
import csv
from io import StringIO
from websocket_service import send_notification_to_user

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

routes_bp = Blueprint('routes', __name__)

# Helper: Admin-only decorator
ADMIN_TYPE = 'admin'
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
            user_id = data['user_id']
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True, buffered=True)
            cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            if not user or user['user_type'] != ADMIN_TYPE:  # type: ignore
                return jsonify({'error': 'Admin access required'}), 403
        except Exception as e:
            return jsonify({'error': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

# Admin: Get all users with filters and CSV export
@routes_bp.route('/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    user_type = request.args.get('user_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    export = request.args.get('export') == 'csv'
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    query = 'SELECT * FROM users WHERE 1=1'
    params = []
    if user_type:
        query += ' AND user_type = %s'
        params.append(user_type)
    if start_date:
        query += ' AND created_at >= %s'
        params.append(start_date)
    if end_date:
        query += ' AND created_at <= %s'
        params.append(end_date)
    cursor.execute(query, tuple(params))
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    if export:
        si = StringIO()
        writer = csv.DictWriter(si, fieldnames=users[0].keys())  # type: ignore
        writer.writeheader()
        writer.writerows(users)  # type: ignore
        output = si.getvalue()
        return output, 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=users.csv'}
    return jsonify(users)

# User Registration
@routes_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    company_name = data.get('company_name')
    phone = data.get('phone')
    address = data.get('address')
    country = data.get('country')
    city = data.get('city')
    postal_code = data.get('postal_code')
    
    # Bank details (required for producers)
    bank_name = data.get('bank_name')
    account_name = data.get('account_name')
    account_number = data.get('account_number')
    bank_code = data.get('bank_code')
    swift_code = data.get('swift_code')
    routing_number = data.get('routing_number')

    if not all([username, email, password, user_type, first_name, last_name]):
        return jsonify({'error': 'Missing required fields'}), 400

    # For producers, bank details are required
    if user_type == 'producer' and not all([bank_name, account_name, account_number]):
        return jsonify({'error': 'Bank details are required for producers'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 409

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Insert user with bank details
    cursor.execute('''INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code, bank_name, account_name, account_number, bank_code, swift_code, routing_number, created_at, updated_at, is_verified, is_active)
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                   (username, email, password_hash, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code, bank_name, account_name, account_number, bank_code, swift_code, routing_number, datetime.utcnow(), datetime.utcnow(), False, True))
    user_id = cursor.lastrowid
    
    # If producer, also insert into producer_bank_details table
    if user_type == 'producer' and all([bank_name, account_name, account_number]):
        cursor.execute('''INSERT INTO producer_bank_details (producer_id, bank_name, account_name, account_number, bank_code, swift_code, routing_number, is_active, is_verified, created_at, updated_at)
                          VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                       (user_id, bank_name, account_name, account_number, bank_code, swift_code, routing_number, True, False, datetime.utcnow(), datetime.utcnow()))
    
    conn.commit()
    # Fetch the new user
    cursor.execute('SELECT id, username, email, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code, bank_name, account_name, account_number, bank_code, swift_code, routing_number FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    # Emit real-time notification to producer
    notification_data = {
        "type": "user",
        "title": "New User Registered",
        "message": f"A new user ({username}) has registered",
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    send_notification_to_user(user_id, notification_data)
    return jsonify({'message': 'User registered successfully', 'user': user}), 201

# User Login
@routes_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    if not all([email, password]):
        return jsonify({'error': 'Missing email or password'}), 400
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user or not user.get('password_hash'):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    # In login, after fetching user, cast user to dict if not None
    user = dict(user) if user else None  # type: ignore
    # On the password_hash encode line, add # type: ignore
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):  # type: ignore
        return jsonify({'error': 'Invalid credentials'}), 401
    token = jwt.encode({'user_id': user['id'], 'username': user['username']}, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithm='HS256')  # type: ignore
    return jsonify({'token': token, 'user': {'id': user['id'], 'username': user['username'], 'email': user['email'], 'user_type': user['user_type'], 'first_name': user['first_name'], 'last_name': user['last_name']}})  # type: ignore

# Get All Products
@routes_bp.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT p.*, u.username as producer_username, u.company_name as producer_company, u.first_name as producer_first_name, u.last_name as producer_last_name 
                      FROM products p 
                      JOIN users u ON p.producer_id = u.id 
                      WHERE p.product_status = 'active' ''')
    products = cursor.fetchall()
    # For each product, get its images
    for i, product in enumerate(products):
        product = dict(product)  # type: ignore
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))  # type: ignore
        images = [row['image_url'] for row in cursor.fetchall()]  # type: ignore
        product['images'] = images  # type: ignore
        products[i] = product  # type: ignore
    cursor.close()
    conn.close()
    return jsonify(products)

# Get Products for Current Producer
@routes_bp.route('/producer/products', methods=['GET'])
def get_producer_products():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM products WHERE producer_id = %s ORDER BY created_at DESC', (user_id,))
    products = cursor.fetchall()
    # For each product, get its images
    for i, product in enumerate(products):
        product = dict(product)  # type: ignore
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))  # type: ignore
        images = [row['image_url'] for row in cursor.fetchall()]  # type: ignore
        product['images'] = images  # type: ignore
        products[i] = product  # type: ignore
    cursor.close()
    conn.close()
    return jsonify(products)

# Get Product by ID
@routes_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT p.*, u.username as producer_username, u.company_name as producer_company, u.first_name as producer_first_name, u.last_name as producer_last_name 
                      FROM products p 
                      JOIN users u ON p.producer_id = u.id 
                      WHERE p.id = %s''', (product_id,))
    product = cursor.fetchone()
    if not product:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
    # Get all images for this product
    product = dict(product)  # type: ignore
    cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product_id,))
    images = [row['image_url'] for row in cursor.fetchall()]
    product['images'] = images
    cursor.close()
    conn.close()
    return jsonify(product)

# Create Product
@routes_bp.route('/products', methods=['POST'])
def create_product():
    data = request.json
    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    currency = data.get('currency', 'NGN')
    price_unit = data.get('price_unit')
    quantity = data.get('quantity')
    category = data.get('category')
    main_image_url = data.get('main_image_url')
    min_order_quantity = data.get('min_order_quantity', 1)
    lead_time = data.get('lead_time')
    origin = data.get('origin')
    specifications = data.get('specifications')
    export_compliance = data.get('export_compliance')
    packaging = data.get('packaging')
    shelf_life = data.get('shelf_life')
    product_status = data.get('product_status', 'active')
    producer_id = data.get('producer_id')
    created_at = data.get('created_at', datetime.utcnow())
    updated_at = datetime.utcnow()
    images = data.get('images', [])
    if not all([name, price, quantity, producer_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    # Insert product
    cursor.execute('''INSERT INTO products (name, description, price, currency, price_unit, quantity, category, main_image_url, min_order_quantity, lead_time, origin, specifications, export_compliance, packaging, shelf_life, product_status, producer_id, created_at, updated_at)
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                   (name, description, price, currency, price_unit, quantity, category, main_image_url, min_order_quantity, lead_time, origin, specifications, export_compliance, packaging, shelf_life, product_status, producer_id, created_at, updated_at))
    product_id = cursor.lastrowid
    # Insert images into product_images table
    for idx, img_url in enumerate(images):
        cursor.execute('''INSERT INTO product_images (product_id, image_url, is_primary, created_at) VALUES (%s, %s, %s, %s)''',
                       (product_id, img_url, idx == 0, datetime.utcnow()))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Product created successfully'}), 201

# Update Product
@routes_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json or {}
    fields = []
    values = []
    for key in ['name', 'description', 'price', 'currency', 'price_unit', 'quantity', 'category', 'main_image_url', 'min_order_quantity', 'lead_time', 'origin', 'specifications', 'export_compliance', 'packaging', 'shelf_life', 'product_status']:
        if key in data:
            fields.append(f"{key} = %s")
            values.append(data[key])  # type: ignore
    if not fields:
        return jsonify({'error': 'No fields to update'}), 400
    values.append(datetime.utcnow())
    values.append(product_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f'''UPDATE products SET {', '.join(fields)}, updated_at = %s WHERE id = %s''', tuple(values))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Product updated successfully'})

# Delete Product
@routes_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM products WHERE id = %s', (product_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Product deleted successfully'})

# --- Orders ---
@routes_bp.route('/orders', methods=['POST'])
def create_order():
    # Get user from JWT token
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data_jwt = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        buyer_id = data_jwt['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity')
    unit_price = data.get('unit_price')
    total_amount = data.get('total_amount')
    shipping_address = data.get('shipping_address')
    shipping_method = data.get('shipping_method')
    payment_method = data.get('payment_method', 'bank_transfer')
    special_instructions = data.get('special_instructions')
    status = data.get('status', 'pending')
    payment_status = data.get('payment_status', 'pending')
    payment_transaction_id = data.get('payment_transaction_id')
    payment_timestamp = data.get('payment_timestamp')
    currency = data.get('currency', 'NGN')

    if not all([product_id, quantity, unit_price, total_amount, shipping_address]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Calculate commission (10% of total amount)
    commission_percentage = 10.0
    commission_amount = (total_amount * commission_percentage) / 100
    producer_amount = total_amount - commission_amount

    # Get producer_id from product
    cursor.execute('SELECT producer_id FROM products WHERE id = %s', (product_id,))
    product_result = cursor.fetchone()
    if not product_result:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    producer_id = product_result[0]

    # Get admin user (assuming admin has user_type = 'admin')
    cursor.execute('SELECT id FROM users WHERE user_type = "admin" LIMIT 1')
    admin_result = cursor.fetchone()
    if not admin_result:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Admin user not found'}), 404

    admin_id = admin_result[0]

    # Insert order with commission amounts and currency
    cursor.execute('''INSERT INTO orders (buyer_id, product_id, quantity, unit_price, total_amount, currency, shipping_address, shipping_method, payment_method, special_instructions, status, payment_status, payment_transaction_id, payment_timestamp, commission_amount, producer_amount, created_at, updated_at)
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                   (buyer_id, product_id, quantity, unit_price, total_amount, currency, shipping_address, shipping_method, payment_method, special_instructions, status, payment_status, payment_transaction_id, payment_timestamp, commission_amount, producer_amount, datetime.utcnow(), datetime.utcnow()))

    order_id = cursor.lastrowid

    # Create commission record
    cursor.execute('''INSERT INTO commissions (order_id, producer_id, admin_id, order_amount, commission_amount, producer_amount, commission_percentage, status, created_at, updated_at)
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                   (order_id, producer_id, admin_id, total_amount, commission_amount, producer_amount, commission_percentage, 'pending', datetime.utcnow(), datetime.utcnow()))

    conn.commit()
    cursor.close()
    conn.close()
    # Emit real-time notification to producer
    notification_data = {
        "type": "order",
        "title": "New Order Received",
        "message": f"You have received a new order (Order #{order_id})",
        "order_id": order_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    send_notification_to_user(producer_id, notification_data)
    return jsonify({'message': 'Order created successfully', 'order_id': order_id, 'commission_amount': commission_amount, 'producer_amount': producer_amount}), 201

@routes_bp.route('/orders', methods=['GET'])
def get_orders():
    # Get user from JWT token
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data_jwt = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        buyer_id = data_jwt['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT o.*, p.name as product_name, p.main_image_url as product_image, u.first_name, u.last_name, u.company_name as producer_company
                      FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      JOIN users u ON p.producer_id = u.id 
                      WHERE o.buyer_id = %s 
                      ORDER BY o.created_at DESC''', (buyer_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(orders)

@routes_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(order)

@routes_bp.route('/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    data = request.json
    fields = []
    values = []
    for key in ['quantity', 'unit_price', 'total_amount', 'shipping_address', 'shipping_method', 'status', 'payment_status']:
        if key in data:
            fields.append(f"{key} = %s")
            values.append(data[key])
    if not fields:
        return jsonify({'error': 'No fields to update'}), 400
    values.append(datetime.utcnow())
    values.append(order_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(f'''UPDATE orders SET {', '.join(fields)}, updated_at = %s WHERE id = %s''', tuple(values))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Order updated successfully'})

@routes_bp.route('/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM orders WHERE id = %s', (order_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Order deleted successfully'})

# --- Cart ---
@routes_bp.route('/cart', methods=['POST'])
def add_to_cart():
    data = request.json
    buyer_id = data.get('buyer_id')
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    if not all([buyer_id, product_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO cart (buyer_id, product_id, quantity, created_at) VALUES (%s, %s, %s, %s)''',
                   (buyer_id, product_id, quantity, datetime.utcnow()))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Added to cart'}), 201

@routes_bp.route('/cart/<int:buyer_id>', methods=['GET'])
def get_cart(buyer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM cart WHERE buyer_id = %s', (buyer_id,))
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)

@routes_bp.route('/cart/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM cart WHERE id = %s', (item_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Removed from cart'})

# --- Wishlist ---
@routes_bp.route('/wishlist', methods=['POST'])
def add_to_wishlist():
    data = request.json
    buyer_id = data.get('buyer_id')
    product_id = data.get('product_id')
    if not all([buyer_id, product_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''INSERT INTO wishlist (buyer_id, product_id, created_at) VALUES (%s, %s, %s)''',
                   (buyer_id, product_id, datetime.utcnow()))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Added to wishlist'}), 201

@routes_bp.route('/wishlist/<int:buyer_id>', methods=['GET'])
def get_wishlist(buyer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM wishlist WHERE buyer_id = %s', (buyer_id,))
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items)

@routes_bp.route('/wishlist/<int:item_id>', methods=['DELETE'])
def remove_from_wishlist(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM wishlist WHERE id = %s', (item_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Removed from wishlist'})

# --- Inquiries ---
@routes_bp.route('/inquiries', methods=['POST'])
def create_inquiry():
    data = request.json
    product_id = data.get('product_id')
    producer_id = data.get('producer_id')
    buyer_id = data.get('buyer_id')
    message = data.get('message')
    quantity_requested = data.get('quantity_requested')
    status = data.get('status', 'pending')

    if not buyer_id or not message or (not product_id and not producer_id):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # If product_id is provided, get producer_id from product
    if product_id:
        cursor.execute('SELECT producer_id FROM products WHERE id = %s', (product_id,))
        prod = cursor.fetchone()
        if not prod:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Product not found'}), 404
        producer_id = prod[0]

    cursor.execute('''INSERT INTO inquiries (product_id, buyer_id, message, quantity_requested, status, created_at, updated_at)
                      VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                   (product_id, buyer_id, message, quantity_requested, status, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Inquiry created successfully'}), 201

@routes_bp.route('/inquiries/<int:product_id>', methods=['GET'])
def get_inquiries_for_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM inquiries WHERE product_id = %s', (product_id,))
    inquiries = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(inquiries)

@routes_bp.route('/inquiries/buyer/<int:buyer_id>', methods=['GET'])
def get_inquiries_for_buyer(buyer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM inquiries WHERE buyer_id = %s', (buyer_id,))
    inquiries = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(inquiries)

@routes_bp.route('/inquiries/<int:inquiry_id>', methods=['DELETE'])
def delete_inquiry(inquiry_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM inquiries WHERE id = %s', (inquiry_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Inquiry deleted successfully'})

@routes_bp.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    url = f"/uploads/{filename}"
    return jsonify({'url': url})

# Serve uploaded files
@routes_bp.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Admin: Get all products with filters and CSV export
@routes_bp.route('/admin/products', methods=['GET'])
@admin_required
def admin_get_products():
    producer_id = request.args.get('producer_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    export = request.args.get('export') == 'csv'
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = '''SELECT p.*, u.username as producer_username, u.company_name as producer_company, u.email as producer_email FROM products p JOIN users u ON p.producer_id = u.id WHERE 1=1'''
    params = []
    if producer_id:
        query += ' AND p.producer_id = %s'
        params.append(producer_id)
    if start_date:
        query += ' AND p.created_at >= %s'
        params.append(start_date)
    if end_date:
        query += ' AND p.created_at <= %s'
        params.append(end_date)
    cursor.execute(query, tuple(params))
    products = cursor.fetchall()
    for i, product in enumerate(products):
        product = dict(product)  # type: ignore
        cursor.execute('SELECT image_url FROM product_images WHERE product_id = %s', (product['id'],))  # type: ignore
        images = [row['image_url'] for row in cursor.fetchall()]  # type: ignore
        product['images'] = images  # type: ignore
        products[i] = product  # type: ignore
    cursor.close()
    conn.close()
    if export:
        si = StringIO()
        writer = csv.DictWriter(si, fieldnames=products[0].keys() if products else [])
        writer.writeheader()
        writer.writerows(products)
        output = si.getvalue()
        return output, 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=products.csv'}
    return jsonify(products)

# Admin: Get all orders with filters and CSV export
@routes_bp.route('/admin/orders', methods=['GET'])
@admin_required
def admin_get_orders():
    buyer_id = request.args.get('buyer_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    export = request.args.get('export') == 'csv'
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = '''SELECT o.*, u.username as buyer_username, u.email as buyer_email, p.name as product_name FROM orders o JOIN users u ON o.buyer_id = u.id JOIN products p ON o.product_id = p.id WHERE 1=1'''
    params = []
    if buyer_id:
        query += ' AND o.buyer_id = %s'
        params.append(buyer_id)
    if start_date:
        query += ' AND o.created_at >= %s'
        params.append(start_date)
    if end_date:
        query += ' AND o.created_at <= %s'
        params.append(end_date)
    cursor.execute(query, tuple(params))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    if export:
        si = StringIO()
        writer = csv.DictWriter(si, fieldnames=orders[0].keys() if orders else [])
        writer.writeheader()
        writer.writerows(orders)
        output = si.getvalue()
        return output, 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=orders.csv'}
    return jsonify(orders)

# Admin: Get financial summary
@routes_bp.route('/admin/financials', methods=['GET'])
@admin_required
def admin_financials():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT COUNT(*) as total_orders, SUM(total_amount) as total_sales, SUM(CASE WHEN payment_status = "pending" THEN total_amount ELSE 0 END) as pending_payments FROM orders')
    summary = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(summary)

# Admin: Approve or deactivate user
@routes_bp.route('/admin/approve_user', methods=['POST'])
@admin_required
def admin_approve_user():
    data = request.json
    user_id = data.get('user_id')
    is_active = data.get('is_active', True)
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_active = %s WHERE id = %s', (is_active, user_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'User status updated'})

# Admin: Create User
@routes_bp.route('/admin/create_user', methods=['POST'])
@admin_required
def admin_create_user():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    company_name = data.get('company_name')
    phone = data.get('phone')
    address = data.get('address')
    country = data.get('country')
    city = data.get('city')
    postal_code = data.get('postal_code')

    if not all([username, email, password, user_type, first_name, last_name]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 409

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute('''INSERT INTO users (username, email, password_hash, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code, created_at, updated_at, is_verified, is_active)
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                   (username, email, password_hash, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code, datetime.utcnow(), datetime.utcnow(), False, True))
    user_id = cursor.lastrowid
    conn.commit()
    # Fetch the new user
    cursor.execute('SELECT id, username, email, user_type, first_name, last_name, company_name, phone, address, country, city, postal_code FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    # Emit real-time notification to producer
    notification_data = {
        "type": "user",
        "title": "New User Registered",
        "message": f"A new user ({username}) has registered",
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    send_notification_to_user(user_id, notification_data)
    return jsonify({'message': 'User created successfully', 'user': user}), 201

@routes_bp.route('/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""')
    categories = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(categories)

@routes_bp.route('/profile', methods=['GET', 'PUT'])
def update_profile():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'GET':
        cursor.execute('SELECT id, username, email, user_type, first_name, last_name, phone, address, company_name, city, postal_code, country, bank_name, account_name, account_number, bank_code, swift_code, routing_number FROM users WHERE id = %s', (user_id,))
        user = cursor.fetchone()
        
        # If user is a producer, also get detailed bank details
        if user and user['user_type'] == 'producer':
            cursor.execute('''SELECT * FROM producer_bank_details 
                              WHERE producer_id = %s 
                              ORDER BY is_active DESC, created_at DESC''', (user_id,))
            bank_details = cursor.fetchall()
            user['bank_details'] = bank_details
        
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'user': user})
    
    # PUT method for updating profile
    req = request.json or {}
    name = req.get('name')
    email = req.get('email')
    phone = req.get('phone')
    address = req.get('address')
    company = req.get('company')
    first_name = req.get('first_name')
    last_name = req.get('last_name')
    password = req.get('password')
    city = req.get('city')
    postal_code = req.get('postal_code')
    country = req.get('country')
    
    # Bank details fields
    bank_name = req.get('bank_name')
    account_name = req.get('account_name')
    account_number = req.get('account_number')
    bank_code = req.get('bank_code')
    swift_code = req.get('swift_code')
    routing_number = req.get('routing_number')
    
    if not any([name, email, phone, address, company, first_name, last_name, password, city, postal_code, country, bank_name, account_name, account_number, bank_code, swift_code, routing_number]):
        return jsonify({'error': 'No fields to update'}), 400
    
    fields = []
    values = []
    
    if name:
        fields.append('username = %s')
        values.append(name)
    if email:
        fields.append('email = %s')
        values.append(email)
    if phone:
        fields.append('phone = %s')
        values.append(phone)
    if address:
        fields.append('address = %s')
        values.append(address)
    if company:
        fields.append('company_name = %s')
        values.append(company)
    if first_name:
        fields.append('first_name = %s')
        values.append(first_name)
    if last_name:
        fields.append('last_name = %s')
        values.append(last_name)
    if password:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        fields.append('password_hash = %s')
        values.append(password_hash)
    if city:
        fields.append('city = %s')
        values.append(city)
    if postal_code:
        fields.append('postal_code = %s')
        values.append(postal_code)
    if country:
        fields.append('country = %s')
        values.append(country)
    
    # Add bank details fields
    if bank_name:
        fields.append('bank_name = %s')
        values.append(bank_name)
    if account_name:
        fields.append('account_name = %s')
        values.append(account_name)
    if account_number:
        fields.append('account_number = %s')
        values.append(account_number)
    if bank_code:
        fields.append('bank_code = %s')
        values.append(bank_code)
    if swift_code:
        fields.append('swift_code = %s')
        values.append(swift_code)
    if routing_number:
        fields.append('routing_number = %s')
        values.append(routing_number)
    
    fields.append('updated_at = %s')
    values.append(datetime.utcnow())
    values.append(user_id)
    
    cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", tuple(values))
    conn.commit()
    cursor.execute('SELECT id, username, email, user_type, first_name, last_name, phone, address, company_name, bank_name, account_name, account_number, bank_code, swift_code, routing_number FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'message': 'Profile updated', 'user': user})

# Change Password Endpoint
@routes_bp.route('/auth/change-password', methods=['POST'])
def change_password():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    req = request.json or {}
    current_password = req.get('current_password')
    new_password = req.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters long'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get current user and verify current password
    cursor.execute('SELECT password_hash FROM users WHERE id = %s', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        cursor.close()
        conn.close()
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Hash new password and update
    new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor.execute('UPDATE users SET password_hash = %s, updated_at = %s WHERE id = %s', 
                   (new_password_hash, datetime.utcnow(), user_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Password changed successfully'})

# Get Orders for Current Producer
@routes_bp.route('/producer/orders', methods=['GET'])
def get_producer_orders():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT o.*, u.username as buyer_username, u.first_name as buyer_first_name, u.last_name as buyer_last_name, 
                      u.company_name as buyer_company, p.name as product_name, p.main_image_url as product_image,
                      o.payment_status, o.payment_method, o.payment_transaction_id, o.payment_timestamp
                      FROM orders o 
                      JOIN users u ON o.buyer_id = u.id 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s 
                      ORDER BY o.created_at DESC''', (user_id,))
    orders = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(orders)

# Get Producer Dashboard Stats
@routes_bp.route('/producer/dashboard', methods=['GET'])
def get_producer_dashboard():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get total products
    cursor.execute('SELECT COUNT(*) as total_products FROM products WHERE producer_id = %s AND product_status = "active"', (user_id,))
    total_products = cursor.fetchone()['total_products']
    
    # Get total orders and earnings
    cursor.execute('''SELECT COUNT(*) as total_orders, 
                      SUM(o.total_amount) as total_earnings,
                      SUM(CASE WHEN o.status = "pending" THEN 1 ELSE 0 END) as pending_orders
                      FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s''', (user_id,))
    order_stats = cursor.fetchone()
    
    # Get recent orders
    cursor.execute('''SELECT o.*, u.username as buyer_username, u.first_name as buyer_first_name, u.last_name as buyer_last_name,
                      u.company_name as buyer_company, p.name as product_name
                      FROM orders o 
                      JOIN users u ON o.buyer_id = u.id 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s 
                      ORDER BY o.created_at DESC 
                      LIMIT 5''', (user_id,))
    recent_orders = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'stats': {
            'totalProducts': total_products,
            'totalOrders': order_stats['total_orders'] or 0,
            'totalEarnings': float(order_stats['total_earnings'] or 0),
            'pendingOrders': order_stats['pending_orders'] or 0
        },
        'recentOrders': recent_orders
    })

# Get Producer Financials
@routes_bp.route('/producer/financials', methods=['GET'])
def get_producer_financials():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get financial summary
    cursor.execute('''SELECT 
                      COUNT(*) as total_orders,
                      SUM(o.total_amount) as total_revenue,
                      AVG(o.total_amount) as average_order_value,
                      SUM(CASE WHEN o.status = "completed" THEN o.total_amount ELSE 0 END) as completed_revenue,
                      SUM(CASE WHEN o.status = "pending" THEN o.total_amount ELSE 0 END) as pending_revenue
                      FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s''', (user_id,))
    summary = cursor.fetchone()
    
    # Get transactions (orders) for the producer
    cursor.execute('''SELECT o.*, u.username as buyer_username, u.first_name as buyer_first_name, u.last_name as buyer_last_name,
                      u.company_name as buyer_company, p.name as product_name
                      FROM orders o 
                      JOIN users u ON o.buyer_id = u.id 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s 
                      ORDER BY o.created_at DESC''', (user_id,))
    transactions = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'summary': {
            'totalOrders': summary['total_orders'] or 0,
            'totalRevenue': float(summary['total_revenue'] or 0),
            'averageOrderValue': float(summary['average_order_value'] or 0),
            'completedRevenue': float(summary['completed_revenue'] or 0),
            'pendingRevenue': float(summary['pending_revenue'] or 0)
        },
        'transactions': transactions
    })

# Update Order Status (Producer)
@routes_bp.route('/producer/orders/<int:order_id>/status', methods=['PUT'])
def update_producer_order_status(order_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    request_data = request.json
    new_status = request_data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify the order belongs to this producer
    cursor.execute('''SELECT o.id FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      WHERE o.id = %s AND p.producer_id = %s''', (order_id, user_id))
    order = cursor.fetchone()
    
    if not order:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Order not found or access denied'}), 404
    
    # Update order status
    cursor.execute('UPDATE orders SET status = %s, updated_at = %s WHERE id = %s', 
                   (new_status, datetime.utcnow(), order_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Order status updated successfully'})

# Update Payment Status (Producer)
@routes_bp.route('/producer/orders/<int:order_id>/payment-status', methods=['PUT'])
def update_producer_payment_status(order_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    request_data = request.json
    new_payment_status = request_data.get('payment_status')
    
    if not new_payment_status:
        return jsonify({'error': 'Payment status is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify the order belongs to this producer
    cursor.execute('''SELECT o.id FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      WHERE o.id = %s AND p.producer_id = %s''', (order_id, user_id))
    order = cursor.fetchone()
    
    if not order:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Order not found or access denied'}), 404
    
    # Update payment status
    cursor.execute('UPDATE orders SET payment_status = %s, updated_at = %s WHERE id = %s', 
                   (new_payment_status, datetime.utcnow(), order_id))
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Payment status updated successfully'})

# Get Bank Account Details
@routes_bp.route('/bank-details', methods=['GET'])
def get_bank_details():
    # In a real application, these would come from environment variables or database
    bank_details = {
        'bankName': 'First Bank of Nigeria',
        'accountName': 'TradeLink International Ltd',
        'accountNumber': '1234567890',
        'swiftCode': 'FBNINGL',
        'iban': 'NG123456789012345678901234',
        'branchCode': '001'
    }
    return jsonify(bank_details)

# Get Admin Bank Details
@routes_bp.route('/admin/bank-details', methods=['GET'])
@admin_required
def get_admin_bank_details():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM admin_bank_details WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1')
    bank_details = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(bank_details)

# Get Commissions (Admin)
@routes_bp.route('/admin/commissions', methods=['GET'])
@admin_required
def get_admin_commissions():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT c.*, o.payment_transaction_id, o.payment_method, 
                      p.name as product_name, u.first_name, u.last_name, u.company_name as producer_company
                      FROM commissions c 
                      JOIN orders o ON c.order_id = o.id 
                      JOIN products p ON o.product_id = p.id 
                      JOIN users u ON c.producer_id = u.id 
                      ORDER BY c.created_at DESC''')
    commissions = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(commissions)

# Get Commission Summary (Admin)
@routes_bp.route('/admin/commission-summary', methods=['GET'])
@admin_required
def get_commission_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get total commissions
    cursor.execute('''SELECT 
                      COUNT(*) as total_commissions,
                      SUM(commission_amount) as total_commission_amount,
                      SUM(CASE WHEN status = "pending" THEN commission_amount ELSE 0 END) as pending_commission_amount,
                      SUM(CASE WHEN status = "paid" THEN commission_amount ELSE 0 END) as paid_commission_amount,
                      AVG(commission_amount) as average_commission
                      FROM commissions''')
    summary = cursor.fetchone()
    
    # Get recent commissions
    cursor.execute('''SELECT c.*, o.payment_transaction_id, p.name as product_name, 
                      u.first_name, u.last_name, u.company_name as producer_company
                      FROM commissions c 
                      JOIN orders o ON c.order_id = o.id 
                      JOIN products p ON o.product_id = p.id 
                      JOIN users u ON c.producer_id = u.id 
                      ORDER BY c.created_at DESC LIMIT 10''')
    recent_commissions = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'summary': {
            'totalCommissions': summary['total_commissions'] or 0,
            'totalCommissionAmount': float(summary['total_commission_amount'] or 0),
            'pendingCommissionAmount': float(summary['pending_commission_amount'] or 0),
            'paidCommissionAmount': float(summary['paid_commission_amount'] or 0),
            'averageCommission': float(summary['average_commission'] or 0)
        },
        'recentCommissions': recent_commissions
    })

# Update Commission Status (Admin)
@routes_bp.route('/admin/commissions/<int:commission_id>/status', methods=['PUT'])
@admin_required
def update_commission_status(commission_id):
    data = request.json
    new_status = data.get('status')
    payment_reference = data.get('payment_reference')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('UPDATE commissions SET status = %s, payment_reference = %s, updated_at = %s WHERE id = %s', 
                   (new_status, payment_reference, datetime.utcnow(), commission_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Commission status updated successfully'})

# Get Producer Commissions
@routes_bp.route('/producer/commissions', methods=['GET'])
def get_producer_commissions():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        producer_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT c.*, o.payment_transaction_id, o.payment_method, p.name as product_name
                      FROM commissions c 
                      JOIN orders o ON c.order_id = o.id 
                      JOIN products p ON o.product_id = p.id 
                      WHERE c.producer_id = %s 
                      ORDER BY c.created_at DESC''', (producer_id,))
    commissions = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(commissions)

# Get Producer Payments
@routes_bp.route('/producer/payments', methods=['GET'])
def get_producer_payments():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get payments (completed orders) for the producer
    cursor.execute('''SELECT o.*, u.username as buyer_username, u.first_name as buyer_first_name, u.last_name as buyer_last_name,
                      u.company_name as buyer_company, p.name as product_name
                      FROM orders o 
                      JOIN users u ON o.buyer_id = u.id 
                      JOIN products p ON o.product_id = p.id 
                      WHERE p.producer_id = %s AND o.payment_status = "completed"
                      ORDER BY o.created_at DESC''', (user_id,))
    payments = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(payments)

# Real-time Messaging Endpoints

# Get conversations for a user
@routes_bp.route('/conversations', methods=['GET'])
def get_conversations():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get conversations where user is either buyer or producer, including those without a product
    cursor.execute('''
        SELECT DISTINCT i.id as inquiry_id, i.product_id, i.buyer_id, 
               COALESCE(p.producer_id, i.producer_id) as producer_id,
               p.name as product_name, p.main_image_url as product_image,
               buyer.username as buyer_username, buyer.first_name as buyer_first_name, buyer.last_name as buyer_last_name, buyer.company_name as buyer_company,
               producer.username as producer_username, producer.first_name as producer_first_name, producer.last_name as producer_last_name, producer.company_name as producer_company,
               i.created_at as inquiry_created_at,
               (SELECT COUNT(*) FROM messages m WHERE m.inquiry_id = i.id AND m.sender_id != %s AND m.is_read = FALSE) as unread_count,
               (SELECT m.message FROM messages m WHERE m.inquiry_id = i.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
               (SELECT m.created_at FROM messages m WHERE m.inquiry_id = i.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
        FROM inquiries i
        LEFT JOIN products p ON i.product_id = p.id
        JOIN users buyer ON i.buyer_id = buyer.id
        LEFT JOIN users producer ON (p.producer_id = producer.id OR i.producer_id = producer.id)
        WHERE i.buyer_id = %s OR (p.producer_id = %s OR i.producer_id = %s)
        ORDER BY last_message_time DESC
    ''', (user_id, user_id, user_id, user_id))

    conversations = cursor.fetchall()

    # Process conversations to add user info
    for conv in conversations:
        if conv['buyer_id'] == user_id:
            conv['other_user'] = {
                'id': conv['producer_id'],
                'username': conv['producer_username'],
                'name': f"{conv['producer_first_name']} {conv['producer_last_name']}",
                'company': conv['producer_company'],
                'type': 'producer'
            }
        else:
            conv['other_user'] = {
                'id': conv['buyer_id'],
                'username': conv['buyer_username'],
                'name': f"{conv['buyer_first_name']} {conv['buyer_last_name']}",
                'company': conv['buyer_company'],
                'type': 'buyer'
            }

    cursor.close()
    conn.close()

    return jsonify(conversations)

# Get messages for a specific inquiry
@routes_bp.route('/conversations/<int:inquiry_id>/messages', methods=['GET'])
def get_messages(inquiry_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Try to find inquiry with or without product
    cursor.execute('''
        SELECT i.*, p.producer_id as product_producer_id
        FROM inquiries i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE i.id = %s
    ''', (inquiry_id,))
    inquiry = cursor.fetchone()

    # Check access
    if not inquiry or not (
        inquiry['buyer_id'] == user_id or
        (inquiry['product_id'] and inquiry['product_producer_id'] == user_id) or
        (inquiry['product_id'] is None and inquiry.get('producer_id') == user_id)
    ):
        cursor.close()
        conn.close()
        return jsonify({'error': 'Inquiry not found or access denied'}), 404

    # Get messages
    cursor.execute('''
        SELECT m.*, u.username, u.first_name, u.last_name, u.user_type
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.inquiry_id = %s
        ORDER BY m.created_at ASC
    ''', (inquiry_id,))

    messages = cursor.fetchall()

    # Mark messages as read for the current user
    cursor.execute('''
        UPDATE messages 
        SET is_read = TRUE 
        WHERE inquiry_id = %s AND sender_id != %s
    ''', (inquiry_id, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify(messages)

# Send a message (also handled by WebSocket, but this is for REST API compatibility)
@routes_bp.route('/conversations/<int:inquiry_id>/messages', methods=['POST'])
def send_message(inquiry_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    request_data = request.json
    message_text = request_data.get('message')
    
    if not message_text:
        return jsonify({'error': 'Message is required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Verify user has access to this inquiry
    cursor.execute('''
        SELECT i.*, p.producer_id 
        FROM inquiries i 
        JOIN products p ON i.product_id = p.id 
        WHERE i.id = %s AND (i.buyer_id = %s OR p.producer_id = %s)
    ''', (inquiry_id, user_id, user_id))
    
    inquiry = cursor.fetchone()
    if not inquiry:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Inquiry not found or access denied'}), 404
    
    # Insert message
    cursor.execute('''
        INSERT INTO messages (inquiry_id, sender_id, message, is_read, created_at)
        VALUES (%s, %s, %s, %s, %s)
    ''', (inquiry_id, user_id, message_text, False, datetime.utcnow()))
    
    message_id = cursor.lastrowid
    
    # Get the inserted message with user info
    cursor.execute('''
        SELECT m.*, u.username, u.first_name, u.last_name, u.user_type
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = %s
    ''', (message_id,))
    
    message = cursor.fetchone()
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify(message), 201

# Get unread message count for a user
@routes_bp.route('/messages/unread-count', methods=['GET'])
def get_unread_count():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT COUNT(*) as unread_count
        FROM messages m
        JOIN inquiries i ON m.inquiry_id = i.id
        JOIN products p ON i.product_id = p.id
        WHERE m.sender_id != %s AND m.is_read = FALSE 
        AND (i.buyer_id = %s OR p.producer_id = %s)
    ''', (user_id, user_id, user_id))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({'unread_count': result['unread_count']})

# Mark messages as read for a specific inquiry
@routes_bp.route('/conversations/<int:inquiry_id>/mark-read', methods=['POST'])
def mark_messages_read(inquiry_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Try to find inquiry with or without product
    cursor.execute('''
        SELECT i.*, p.producer_id as product_producer_id
        FROM inquiries i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE i.id = %s
    ''', (inquiry_id,))
    inquiry = cursor.fetchone()

    # Check access
    if not inquiry or not (
        inquiry['buyer_id'] == user_id or
        (inquiry['product_id'] and inquiry['product_producer_id'] == user_id) or
        (inquiry['product_id'] is None and inquiry.get('producer_id') == user_id)
    ):
        cursor.close()
        conn.close()
        return jsonify({'error': 'Inquiry not found or access denied'}), 404

    # Mark messages as read
    cursor.execute('''
        UPDATE messages 
        SET is_read = TRUE 
        WHERE inquiry_id = %s AND sender_id != %s
    ''', (inquiry_id, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'success': True})

# Producer Bank Details Management
@routes_bp.route('/producer/bank-details', methods=['GET'])
def get_producer_bank_details():
    """Get bank details for the current producer"""
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get bank details from users table
    cursor.execute('''SELECT bank_name, account_name, account_number, bank_code, swift_code, routing_number 
                      FROM users WHERE id = %s''', (user_id,))
    user_bank_details = cursor.fetchone()
    
    # Get detailed bank details from producer_bank_details table
    cursor.execute('''SELECT * FROM producer_bank_details 
                      WHERE producer_id = %s AND is_active = TRUE 
                      ORDER BY created_at DESC''', (user_id,))
    detailed_bank_details = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'user_bank_details': user_bank_details,
        'detailed_bank_details': detailed_bank_details
    })

@routes_bp.route('/producer/bank-details', methods=['POST'])
def add_producer_bank_details():
    """Add new bank details for the current producer"""
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    request_data = request.json or {}
    bank_name = request_data.get('bank_name')
    account_name = request_data.get('account_name')
    account_number = request_data.get('account_number')
    bank_code = request_data.get('bank_code')
    swift_code = request_data.get('swift_code')
    routing_number = request_data.get('routing_number')
    
    if not all([bank_name, account_name, account_number]):
        return jsonify({'error': 'Bank name, account name, and account number are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Insert into producer_bank_details table
        cursor.execute('''INSERT INTO producer_bank_details (producer_id, bank_name, account_name, account_number, bank_code, swift_code, routing_number, is_active, is_verified, created_at, updated_at)
                          VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                       (user_id, bank_name, account_name, account_number, bank_code, swift_code, routing_number, True, False, datetime.utcnow(), datetime.utcnow()))
        
        # Update users table with the primary bank details
        cursor.execute('''UPDATE users SET bank_name = %s, account_name = %s, account_number = %s, bank_code = %s, swift_code = %s, routing_number = %s, updated_at = %s
                          WHERE id = %s''',
                       (bank_name, account_name, account_number, bank_code, swift_code, routing_number, datetime.utcnow(), user_id))
        
        conn.commit()
        
        # Fetch the newly added bank details
        cursor.execute('''SELECT * FROM producer_bank_details WHERE id = %s''', (cursor.lastrowid,))
        new_bank_details = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Bank details added successfully', 'bank_details': new_bank_details}), 201
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({'error': f'Failed to add bank details: {str(e)}'}), 500

@routes_bp.route('/producer/bank-details/<int:bank_id>', methods=['PUT'])
def update_producer_bank_details(bank_id):
    """Update bank details for the current producer"""
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    request_data = request.json or {}
    bank_name = request_data.get('bank_name')
    account_name = request_data.get('account_name')
    account_number = request_data.get('account_number')
    bank_code = request_data.get('bank_code')
    swift_code = request_data.get('swift_code')
    routing_number = request_data.get('routing_number')
    
    if not all([bank_name, account_name, account_number]):
        return jsonify({'error': 'Bank name, account name, and account number are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify the bank details belong to the current user
        cursor.execute('''SELECT * FROM producer_bank_details WHERE id = %s AND producer_id = %s''', (bank_id, user_id))
        existing_bank = cursor.fetchone()
        
        if not existing_bank:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Bank details not found or access denied'}), 404
        
        # Update the bank details
        cursor.execute('''UPDATE producer_bank_details SET bank_name = %s, account_name = %s, account_number = %s, bank_code = %s, swift_code = %s, routing_number = %s, updated_at = %s
                          WHERE id = %s AND producer_id = %s''',
                       (bank_name, account_name, account_number, bank_code, swift_code, routing_number, datetime.utcnow(), bank_id, user_id))
        
        # If this is the primary bank account, also update users table
        if existing_bank.get('is_active'):
            cursor.execute('''UPDATE users SET bank_name = %s, account_name = %s, account_number = %s, bank_code = %s, swift_code = %s, routing_number = %s, updated_at = %s
                              WHERE id = %s''',
                           (bank_name, account_name, account_number, bank_code, swift_code, routing_number, datetime.utcnow(), user_id))
        
        conn.commit()
        
        # Fetch the updated bank details
        cursor.execute('''SELECT * FROM producer_bank_details WHERE id = %s''', (bank_id,))
        updated_bank_details = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Bank details updated successfully', 'bank_details': updated_bank_details})
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({'error': f'Failed to update bank details: {str(e)}'}), 500

@routes_bp.route('/producer/bank-details/<int:bank_id>', methods=['DELETE'])
def delete_producer_bank_details(bank_id):
    """Delete bank details for the current producer"""
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify the bank details belong to the current user
        cursor.execute('''SELECT * FROM producer_bank_details WHERE id = %s AND producer_id = %s''', (bank_id, user_id))
        existing_bank = cursor.fetchone()
        
        if not existing_bank:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Bank details not found or access denied'}), 404
        
        # Delete the bank details
        cursor.execute('''DELETE FROM producer_bank_details WHERE id = %s AND producer_id = %s''', (bank_id, user_id))
        
        # If this was the primary bank account, clear users table bank details
        if existing_bank.get('is_active'):
            cursor.execute('''UPDATE users SET bank_name = NULL, account_name = NULL, account_number = NULL, bank_code = NULL, swift_code = NULL, routing_number = NULL, updated_at = %s
                              WHERE id = %s''', (datetime.utcnow(), user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Bank details deleted successfully'})
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({'error': f'Failed to delete bank details: {str(e)}'}), 500

@routes_bp.route('/producer/bank-details/<int:bank_id>/set-primary', methods=['POST'])
def set_primary_bank_details(bank_id):
    """Set a bank account as primary for the current producer"""
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify the bank details belong to the current user
        cursor.execute('''SELECT * FROM producer_bank_details WHERE id = %s AND producer_id = %s''', (bank_id, user_id))
        existing_bank = cursor.fetchone()
        
        if not existing_bank:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Bank details not found or access denied'}), 404
        
        # Set all other bank accounts as inactive
        cursor.execute('''UPDATE producer_bank_details SET is_active = FALSE, updated_at = %s
                          WHERE producer_id = %s''', (datetime.utcnow(), user_id))
        
        # Set the selected bank account as active
        cursor.execute('''UPDATE producer_bank_details SET is_active = TRUE, updated_at = %s
                          WHERE id = %s AND producer_id = %s''', (datetime.utcnow(), bank_id, user_id))
        
        # Update users table with the primary bank details
        cursor.execute('''UPDATE users SET bank_name = %s, account_name = %s, account_number = %s, bank_code = %s, swift_code = %s, routing_number = %s, updated_at = %s
                          WHERE id = %s''',
                       (existing_bank['bank_name'], existing_bank['account_name'], existing_bank['account_number'], 
                        existing_bank['bank_code'], existing_bank['swift_code'], existing_bank['routing_number'], 
                        datetime.utcnow(), user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Primary bank account updated successfully'})
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({'error': f'Failed to update primary bank account: {str(e)}'}), 500

# Get producer bank details for buyers (public endpoint)
@routes_bp.route('/producer/<int:producer_id>/bank-details', methods=['GET'])
def get_producer_public_bank_details(producer_id):
    """Get public bank details for a specific producer (for buyers)"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get the primary bank details for the producer
    cursor.execute('''SELECT bank_name, account_name, account_number, bank_code, swift_code, routing_number 
                      FROM users WHERE id = %s AND user_type = 'producer' ''', (producer_id,))
    bank_details = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not bank_details:
        return jsonify({'error': 'Producer not found or no bank details available'}), 404
    
    return jsonify(bank_details)

# Get online users (Admin only)
@routes_bp.route('/admin/online-users', methods=['GET'])
@admin_required
def get_online_users():
    from websocket_service import get_online_users
    online_users = get_online_users()
    return jsonify(online_users) 

# Get Producer Order by ID
@routes_bp.route('/producer/orders/<int:order_id>', methods=['GET'])
def get_producer_order(order_id):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split()[1]
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401
    try:
        data = jwt.decode(token, os.getenv('SECRET_KEY', 'your-secret-key-here'), algorithms=['HS256'])
        user_id = data['user_id']
    except Exception as e:
        return jsonify({'error': 'Token is invalid!'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Check that the order belongs to this producer
    cursor.execute('''SELECT o.*, p.name as product_name, p.main_image_url as product_image, \
                      u.username as buyer_username, u.first_name as buyer_first_name, u.last_name as buyer_last_name, \
                      u.company_name as buyer_company
                      FROM orders o 
                      JOIN products p ON o.product_id = p.id 
                      JOIN users u ON o.buyer_id = u.id 
                      WHERE o.id = %s AND p.producer_id = %s''', (order_id, user_id))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    if not order:
        return jsonify({'error': 'Order not found or access denied'}), 404
    return jsonify(order)

# Public: Get all producers
@routes_bp.route('/producers', methods=['GET'])
def get_all_producers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''SELECT id, username, first_name, last_name, company_name, email, phone, city, country FROM users WHERE user_type = 'producer' AND is_active = TRUE''')
    producers = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(producers)