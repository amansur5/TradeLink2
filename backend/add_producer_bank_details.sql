-- Add producer bank details system
USE tradelink;

-- Create producer bank details table
CREATE TABLE IF NOT EXISTS producer_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producer_id INT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_code VARCHAR(20),
    swift_code VARCHAR(20),
    routing_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_producer_bank (producer_id, account_number)
);

-- Add bank details fields to users table for quick access
ALTER TABLE users 
ADD COLUMN bank_name VARCHAR(100) NULL,
ADD COLUMN account_name VARCHAR(100) NULL,
ADD COLUMN account_number VARCHAR(50) NULL,
ADD COLUMN bank_code VARCHAR(20) NULL,
ADD COLUMN swift_code VARCHAR(20) NULL,
ADD COLUMN routing_number VARCHAR(20) NULL;

-- Add index for faster lookups
CREATE INDEX idx_producer_bank_details ON producer_bank_details(producer_id, is_active);
CREATE INDEX idx_users_bank_details ON users(id, bank_name, account_number); 