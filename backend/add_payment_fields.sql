-- Add payment transaction fields to orders table
USE tradelink;

ALTER TABLE orders 
ADD COLUMN payment_transaction_id VARCHAR(255) NULL,
ADD COLUMN payment_timestamp DATETIME NULL,
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'bank_transfer',
ADD COLUMN special_instructions TEXT NULL; 