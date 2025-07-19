-- Add currency column to products table
ALTER TABLE products ADD COLUMN currency VARCHAR(10) DEFAULT 'NGN' AFTER price; 

-- Update all products and orders with currency 'USD' to 'NGN'
UPDATE products SET currency = 'NGN' WHERE currency = 'USD';
UPDATE orders SET currency = 'NGN' WHERE currency = 'USD'; 