/*
  # Marketplace Backend Setup - Location, Messaging & Seller Profiles

  1. Location Features
    - Add location fields to user_profiles and products
    - Create function for nearby products search
    - Add geospatial indexing

  2. Messaging System
    - Create conversations and messages tables
    - Enable realtime subscriptions
    - Proper RLS policies

  3. Public Seller Profiles
    - Allow public read access to seller profiles
    - Create seller stats view
    - Product listing functions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Add location fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Add location fields to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_products_location_point ON products USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_point ON user_profiles USING GIST (location_point);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id, product_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for messaging
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_product ON conversations(product_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Function to update location_point when lat/lon changes
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for location point updates
DROP TRIGGER IF EXISTS trigger_user_profiles_location ON user_profiles;
CREATE TRIGGER trigger_user_profiles_location
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_location_point();

DROP TRIGGER IF EXISTS trigger_products_location ON products;
CREATE TRIGGER trigger_products_location
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_location_point();

-- Function to sync product location with seller location
CREATE OR REPLACE FUNCTION sync_product_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all active products when user profile location changes
  IF TG_OP = 'UPDATE' AND (
    OLD.city IS DISTINCT FROM NEW.city OR 
    OLD.state IS DISTINCT FROM NEW.state OR 
    OLD.pincode IS DISTINCT FROM NEW.pincode OR
    OLD.latitude IS DISTINCT FROM NEW.latitude OR 
    OLD.longitude IS DISTINCT FROM NEW.longitude
  ) THEN
    UPDATE products 
    SET 
      city = NEW.city,
      state = NEW.state,
      pincode = NEW.pincode,
      latitude = NEW.latitude,
      longitude = NEW.longitude,
      location_point = NEW.location_point,
      updated_at = NOW()
    WHERE seller_id = NEW.id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync product locations
DROP TRIGGER IF EXISTS trigger_sync_product_location ON user_profiles;
CREATE TRIGGER trigger_sync_product_location
  AFTER UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_product_location();

-- Function to get nearby products
CREATE OR REPLACE FUNCTION get_nearby_products(
  user_lat DECIMAL DEFAULT NULL,
  user_lon DECIMAL DEFAULT NULL,
  radius_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  category_id UUID,
  condition product_condition,
  city TEXT,
  state TEXT,
  pincode TEXT,
  image_urls TEXT[],
  status product_status,
  views INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  seller_id UUID,
  seller_name TEXT,
  seller_rating DECIMAL,
  category_name TEXT,
  distance_km DECIMAL
) AS $$
BEGIN
  IF user_lat IS NULL OR user_lon IS NULL THEN
    -- Return all active products if no location provided
    RETURN QUERY
    SELECT 
      p.id,
      p.title,
      p.description,
      p.price,
      p.category_id,
      p.condition,
      p.city,
      p.state,
      p.pincode,
      p.image_urls,
      p.status,
      p.views,
      p.created_at,
      p.updated_at,
      p.seller_id,
      up.full_name as seller_name,
      4.5::DECIMAL as seller_rating,
      c.name as category_name,
      NULL::DECIMAL as distance_km
    FROM products p
    JOIN user_profiles up ON p.seller_id = up.id
    JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT limit_count;
  ELSE
    -- Return products within radius, ordered by distance
    RETURN QUERY
    SELECT 
      p.id,
      p.title,
      p.description,
      p.price,
      p.category_id,
      p.condition,
      p.city,
      p.state,
      p.pincode,
      p.image_urls,
      p.status,
      p.views,
      p.created_at,
      p.updated_at,
      p.seller_id,
      up.full_name as seller_name,
      4.5::DECIMAL as seller_rating,
      c.name as category_name,
      (ST_Distance(
        p.location_point,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
      ) / 1000)::DECIMAL as distance_km
    FROM products p
    JOIN user_profiles up ON p.seller_id = up.id
    JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active'
      AND p.location_point IS NOT NULL
      AND ST_DWithin(
        p.location_point,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
        radius_km * 1000
      )
    ORDER BY distance_km ASC, p.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create seller stats view
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
  up.id,
  up.full_name,
  up.city,
  up.state,
  up.avatar_url,
  up.created_at as member_since,
  COUNT(p.id) as total_products,
  COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold_products,
  COALESCE(AVG(p.views), 0) as avg_views,
  MAX(p.created_at) as last_posted
FROM user_profiles up
LEFT JOIN products p ON up.id = p.seller_id
WHERE up.role IN ('seller', 'both')
GROUP BY up.id, up.full_name, up.city, up.state, up.avatar_url, up.created_at;

-- Function to create or get conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID,
  product_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  ordered_user1 UUID;
  ordered_user2 UUID;
BEGIN
  -- Ensure consistent ordering of user IDs
  IF user1_id < user2_id THEN
    ordered_user1 := user1_id;
    ordered_user2 := user2_id;
  ELSE
    ordered_user1 := user2_id;
    ordered_user2 := user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = ordered_user1 
    AND user2_id = ordered_user2 
    AND (product_id IS NULL OR conversations.product_id = get_or_create_conversation.product_id);

  -- Create new conversation if not found
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id, product_id)
    VALUES (ordered_user1, ordered_user2, product_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send message
CREATE OR REPLACE FUNCTION send_message(
  sender_id UUID,
  receiver_id UUID,
  message_text TEXT,
  product_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  message_id UUID;
BEGIN
  -- Get or create conversation
  conversation_id := get_or_create_conversation(sender_id, receiver_id, product_id);

  -- Insert message
  INSERT INTO messages (conversation_id, sender_id, receiver_id, product_id, message_text)
  VALUES (conversation_id, sender_id, receiver_id, product_id, message_text)
  RETURNING id INTO message_id;

  -- Update conversation last_message_at
  UPDATE conversations 
  SET last_message_at = NOW()
  WHERE id = conversation_id;

  RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- User Profiles: Public read, own edit
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Products: Public read active, sellers manage own
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON products;
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  TO authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Sellers can manage own products" ON products;
CREATE POLICY "Sellers can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id);

-- Conversations: Only participants can access
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: Only participants can access
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Categories: Public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Grant access to views
GRANT SELECT ON seller_stats TO authenticated;