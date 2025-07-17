/*
  # Add Categories, Wishlist, and Special Product Features

  1. New Tables
    - `categories` - Product categories with special types
    - `wishlists` - User wishlist/favorites functionality
  
  2. Product Updates
    - Add `is_donation` and `is_urgent` boolean fields
    - Update category relationship
  
  3. Security
    - Enable RLS on all new tables
    - Add policies for proper access control
  
  4. Functions
    - Category management functions
    - Wishlist management functions
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  is_special boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add special product fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_donation'
  ) THEN
    ALTER TABLE products ADD COLUMN is_donation boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_urgent'
  ) THEN
    ALTER TABLE products ADD COLUMN is_urgent boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist"
  ON wishlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON wishlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_donation ON products(is_donation);
CREATE INDEX IF NOT EXISTS idx_products_is_urgent ON products(is_urgent);

-- Insert default categories
INSERT INTO categories (name, description, icon, is_special) VALUES
  ('Books & Textbooks', 'Educational materials and literature', '📚', false),
  ('Electronics', 'Phones, laptops, gadgets and accessories', '📱', false),
  ('Furniture', 'Home and office furniture', '🪑', false),
  ('Clothing', 'Fashion and apparel', '👕', false),
  ('Sports & Recreation', 'Sports equipment and recreational items', '⚽', false),
  ('Services', 'Professional and personal services', '🔧', false),
  ('Donate / Giveaway', 'Free items for donation', '🎁', true),
  ('Urgent / Moving Out', 'Quick sales before relocation', '📦', true)
ON CONFLICT (name) DO NOTHING;

-- Function to get products by category
CREATE OR REPLACE FUNCTION get_products_by_category(
  category_name text DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  condition product_condition,
  city text,
  state text,
  pincode text,
  image_urls text[],
  status product_status,
  views integer,
  is_donation boolean,
  is_urgent boolean,
  created_at timestamptz,
  seller_id uuid,
  seller_name text,
  seller_rating numeric,
  category_name text,
  category_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.condition,
    p.city,
    p.state,
    p.pincode,
    p.image_urls,
    p.status,
    p.views,
    p.is_donation,
    p.is_urgent,
    p.created_at,
    p.seller_id,
    up.full_name as seller_name,
    4.5::numeric as seller_rating,
    c.name as category_name,
    c.id as category_id
  FROM products p
  JOIN user_profiles up ON p.seller_id = up.id
  JOIN categories c ON p.category_id = c.id
  WHERE 
    p.status = 'active'
    AND (category_name IS NULL OR c.name = category_name)
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to toggle wishlist item
CREATE OR REPLACE FUNCTION toggle_wishlist(product_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
  wishlist_exists boolean;
BEGIN
  -- Get current user
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Check if item exists in wishlist
  SELECT EXISTS(
    SELECT 1 FROM wishlists 
    WHERE user_id = user_uuid AND product_id = product_uuid
  ) INTO wishlist_exists;

  IF wishlist_exists THEN
    -- Remove from wishlist
    DELETE FROM wishlists 
    WHERE user_id = user_uuid AND product_id = product_uuid;
    RETURN false;
  ELSE
    -- Add to wishlist
    INSERT INTO wishlists (user_id, product_id)
    VALUES (user_uuid, product_uuid);
    RETURN true;
  END IF;
END;
$$;

-- Function to get user's wishlist
CREATE OR REPLACE FUNCTION get_user_wishlist()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  condition product_condition,
  city text,
  state text,
  image_urls text[],
  is_donation boolean,
  is_urgent boolean,
  created_at timestamptz,
  seller_name text,
  category_name text,
  added_to_wishlist_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.condition,
    p.city,
    p.state,
    p.image_urls,
    p.is_donation,
    p.is_urgent,
    p.created_at,
    up.full_name as seller_name,
    c.name as category_name,
    w.created_at as added_to_wishlist_at
  FROM wishlists w
  JOIN products p ON w.product_id = p.id
  JOIN user_profiles up ON p.seller_id = up.id
  JOIN categories c ON p.category_id = c.id
  WHERE 
    w.user_id = user_uuid
    AND p.status = 'active'
  ORDER BY w.created_at DESC;
END;
$$;

-- Function to get special products (donations and urgent)
CREATE OR REPLACE FUNCTION get_special_products(
  product_type text DEFAULT 'all', -- 'donation', 'urgent', or 'all'
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  city text,
  state text,
  image_urls text[],
  is_donation boolean,
  is_urgent boolean,
  created_at timestamptz,
  seller_name text,
  category_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.city,
    p.state,
    p.image_urls,
    p.is_donation,
    p.is_urgent,
    p.created_at,
    up.full_name as seller_name,
    c.name as category_name
  FROM products p
  JOIN user_profiles up ON p.seller_id = up.id
  JOIN categories c ON p.category_id = c.id
  WHERE 
    p.status = 'active'
    AND (
      (product_type = 'donation' AND p.is_donation = true) OR
      (product_type = 'urgent' AND p.is_urgent = true) OR
      (product_type = 'all' AND (p.is_donation = true OR p.is_urgent = true))
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;