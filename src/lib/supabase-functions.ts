import { supabase } from './supabase';

// Types for location-based features
export interface NearbyProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  condition: string;
  city: string;
  state: string;
  pincode: string;
  image_urls: string[];
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  seller_id: string;
  seller_name: string;
  seller_rating: number;
  category_name: string;
  distance_km?: number;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  product_id?: string;
  last_message_at: string;
  created_at: string;
  other_user?: UserProfile;
  product?: Product;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  product_id?: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: UserProfile;
  receiver?: UserProfile;
  product?: Product;
}

export interface SellerStats {
  id: string;
  full_name: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  member_since: string;
  total_products: number;
  active_products: number;
  sold_products: number;
  avg_views: number;
  last_posted?: string;
}

// Location-based functions
export const updateUserLocation = async (location: {
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .update(location)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getNearbyProducts = async (
  userLat?: number,
  userLon?: number,
  radiusKm: number = 50,
  limitCount: number = 20
): Promise<NearbyProduct[]> => {
  const { data, error } = await supabase.rpc('get_nearby_products', {
    user_lat: userLat || null,
    user_lon: userLon || null,
    radius_km: radiusKm,
    limit_count: limitCount
  });

  if (error) throw error;
  return data || [];
};

export const getProductsWithLocation = async (filters?: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  search?: string;
  userLocation?: { latitude?: number; longitude?: number };
}) => {
  // Use nearby products function if user location is provided
  if (filters?.userLocation?.latitude && filters?.userLocation?.longitude) {
    let products = await getNearbyProducts(
      filters.userLocation.latitude,
      filters.userLocation.longitude
    );
    
    // Apply additional filters
    if (filters.category && filters.category !== 'All') {
      products = products.filter(p => p.category_name === filters.category);
    }
    
    if (filters.condition && filters.condition !== 'All') {
      products = products.filter(p => p.condition === filters.condition);
    }
    
    if (filters.minPrice) {
      products = products.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice) {
      products = products.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    return products;
  }
  
  // Fallback to regular query
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:user_profiles!seller_id(*),
      category:categories!category_id(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category !== 'All') {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', filters.category)
      .single();
    
    if (categoryData) {
      query = query.eq('category_id', categoryData.id);
    }
  }

  if (filters?.condition && filters.condition !== 'All') {
    query = query.eq('condition', filters.condition);
  }

  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters?.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  
  if (filters?.state) {
    query = query.ilike('state', `%${filters.state}%`);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Messaging functions
export const getConversations = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:user_profiles!user1_id(*),
      user2:user_profiles!user2_id(*),
      product:products(*)
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  
  // Add other_user field and get unread counts
  const conversationsWithOtherUser = await Promise.all(
    (data || []).map(async (conv) => {
      const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
      
      // Get unread message count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return {
        ...conv,
        other_user: otherUser,
        unread_count: count || 0
      };
    })
  );

  return conversationsWithOtherUser;
};

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!sender_id(*),
      receiver:user_profiles!receiver_id(*),
      product:products(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const sendMessage = async (
  receiverId: string,
  messageText: string,
  productId?: string
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('send_message', {
    sender_id: user.id,
    receiver_id: receiverId,
    message_text: messageText,
    product_id: productId || null
  });

  if (error) throw error;
  return data;
};

export const markMessagesAsRead = async (conversationId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('receiver_id', user.id);

  if (error) throw error;
};

// Real-time subscription for messages
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        // Fetch the complete message with relations
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender:user_profiles!sender_id(*),
            receiver:user_profiles!receiver_id(*),
            product:products(*)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();
};

// Seller profile functions
export const getSellerStats = async (sellerId: string): Promise<SellerStats> => {
  const { data, error } = await supabase
    .from('seller_stats')
    .select('*')
    .eq('id', sellerId)
    .single();

  if (error) throw error;
  return data;
};

export const getSellerProducts = async (
  sellerId: string,
  status: string = 'active'
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories!category_id(*)
    `)
    .eq('seller_id', sellerId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Utility functions
export const getUserLocation = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('city, state, pincode, latitude, longitude')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export const geocodeAddress = async (address: string) => {
  // This would integrate with a geocoding service like Google Maps API
  // For now, return mock coordinates for major Indian cities
  const cityCoordinates: { [key: string]: { lat: number; lon: number } } = {
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'delhi': { lat: 28.7041, lon: 77.1025 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'ahmedabad': { lat: 23.0225, lon: 72.5714 }
  };

  const city = address.toLowerCase().split(',')[0].trim();
  return cityCoordinates[city] || { lat: 20.5937, lon: 78.9629 }; // Default to India center
};