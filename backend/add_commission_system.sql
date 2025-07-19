-- Add commission system tables
USE tradelink;

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    producer_id INT NOT NULL,
    admin_id INT NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    producer_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 10.00,
    status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (producer_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Create admin bank details table
CREATE TABLE IF NOT EXISTS admin_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin bank details
INSERT INTO admin_bank_details (bank_name, account_name, account_number) 
VALUES ('Opay', 'Aminu Aminu', '8060051309')
ON DUPLICATE KEY UPDATE account_number = '8060051309';

-- Add commission tracking to orders table
ALTER TABLE orders 
ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN producer_amount DECIMAL(10,2) DEFAULT 0.00; 