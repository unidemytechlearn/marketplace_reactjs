import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role: 'buyer' | 'seller' | 'both';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_special?: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string; // Keep for backward compatibility
  city?: string;
  state?: string;
  pincode?: string;
  is_donation?: boolean;
  is_urgent?: boolean;
  image_urls: string[];
  status: 'active' | 'sold' | 'inactive';
  views: number;
  created_at: string;
  updated_at: string;
  // Joined relations
  seller?: UserProfile;
  category?: Category;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  // Joined relations
  product?: Product;
}
export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  delivery_address: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  buyer?: UserProfile;
  seller?: UserProfile;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Joined relations
  product?: Product;
}

export interface Return {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  // Joined relations
  order?: Order;
}

// New interfaces for messaging and seller profiles
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id?: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  sender?: UserProfile;
  receiver?: UserProfile;
  product?: Product;
}

export interface Conversation {
  user1_id: string;
  user2_id: string;
  product_id?: string;
  last_message_at: string;
  message_count: number;
  unread_count: number;
  // Joined relations
  other_user?: UserProfile;
  product?: Product;
  last_message?: Message;
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

// Authentication Functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Product Management Functions
export const getProducts = async (filters?: {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  search?: string;
  userLocation?: { city?: string; state?: string };
}) => {
  // Use the nearby products function if user location is provided
  if (filters?.userLocation?.city && filters?.userLocation?.state) {
    const { data, error } = await supabase.rpc('get_nearby_products', {
      user_city: filters.userLocation.city,
      user_state: filters.userLocation.state
    });
    
    if (error) throw error;
    
    // Apply additional filters
    let filteredData = data || [];
    
    if (filters.category && filters.category !== 'All') {
      filteredData = filteredData.filter(p => p.category_name === filters.category);
    }
    
    if (filters.condition && filters.condition !== 'All') {
      filteredData = filteredData.filter(p => p.condition === filters.condition);
    }
    
    if (filters.minPrice) {
      filteredData = filteredData.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice) {
      filteredData = filteredData.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    return filteredData;
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

export const getProduct = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:user_profiles!seller_id(*),
      category:categories!category_id(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createProduct = async (product: {
  title: string;
  description: string;
  price: number;
  category_id: string;
  condition: string;
  location: string;
  image_urls?: string[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      seller_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Order Management Functions
export const createOrder = async (
  orderInput: {
    seller_id: string;
    total_amount: number;
    delivery_address: any;
    payment_method: string;
    notes?: string;
  },
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[]
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...orderInput,
      buyer_id: user.id,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map(item => ({
    ...item,
    order_id: orderData.id,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return orderData;
};

export const getOrders = async (userId: string, role: 'buyer' | 'seller') => {
  const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:user_profiles!orders_buyer_id_fkey(*),
      seller:user_profiles!orders_seller_id_fkey(*),
      order_items(
        *,
        product:products!order_items_product_id_fkey(*)
      )
    `)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Category Functions
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('is_special', { ascending: true })
    .order('name');

  if (error) throw error;
  return data;
};

export const getProductsByCategory = async (categoryName?: string, limit = 20, offset = 0) => {
  const { data, error } = await supabase.rpc('get_products_by_category', {
    category_name: categoryName || null,
    limit_count: limit,
    offset_count: offset
  });

  if (error) throw error;
  return data;
};

export const getSpecialProducts = async (type: 'donation' | 'urgent' | 'all' = 'all', limit = 10) => {
  const { data, error } = await supabase.rpc('get_special_products', {
    product_type: type,
    limit_count: limit
  });

  if (error) throw error;
  return data;
};

// Wishlist Functions
export const toggleWishlist = async (productId: string) => {
  const { data, error } = await supabase.rpc('toggle_wishlist', {
    product_uuid: productId
  });

  if (error) throw error;
  return data; // Returns true if added, false if removed
};

export const getUserWishlist = async () => {
  const { data, error } = await supabase.rpc('get_user_wishlist');

  if (error) throw error;
  return data;
};

export const isProductInWishlist = async (productId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single();

  return !error && !!data;
};
// File Upload Functions
export const uploadProductImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrl;
};

// Messaging Functions
export const sendMessage = async (
  receiverId: string,
  productId: string | null,
  messageText: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      product_id: productId,
      message_text: messageText,
    })
    .select(`
      *,
      sender:user_profiles!sender_id(*),
      receiver:user_profiles!receiver_id(*),
      product:products(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const getConversations = async () => {
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
  
  // Add other_user field for easier access
  const conversationsWithOtherUser = data?.map(conv => ({
    ...conv,
    other_user: conv.user1_id === user.id ? conv.user2 : conv.user1
  }));

  return conversationsWithOtherUser;
};

export const getMessages = async (
  otherUserId: string,
  productId?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles!sender_id(*),
      receiver:user_profiles!receiver_id(*),
      product:products(*)
    `)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const markMessagesAsRead = async (
  senderId: string,
  productId?: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', senderId)
    .eq('receiver_id', user.id);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { error } = await query;
  if (error) throw error;
};

// Real-time subscription for messages
export const subscribeToMessages = (
  otherUserId: string,
  productId: string | undefined,
  callback: (message: Message) => void
) => {
  const { data: { user } } = supabase.auth.getUser();
  
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: productId 
          ? `product_id=eq.${productId}`
          : `sender_id=eq.${otherUserId}`
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();
};

// Seller Profile Functions
export const getSellerProfile = async (sellerId: string) => {
  const { data, error } = await supabase
    .from('seller_stats')
    .select('*')
    .eq('id', sellerId)
    .single();

  if (error) throw error;
  return data;
};

export const getSellerProducts = async (sellerId: string, status: string = 'active') => {
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
  return data;
};

// Location Functions
export const updateUserLocation = async (location: {
  city: string;
  state: string;
  pincode: string;
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

// User Profile Functions
export const getUserProfile = async (userId?: string) => {
  const id = userId || (await supabase.auth.getUser()).data.user?.id;
  if (!id) throw new Error('No user ID provided');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Return Management Functions
export const createReturn = async (returnData: {
  order_id: string;
  seller_id: string;
  reason: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('returns')
    .insert({
      ...returnData,
      buyer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getReturns = async (userId: string, role: 'buyer' | 'seller') => {
  const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
  
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      order:orders!returns_order_id_fkey(*)
    `)
    .eq(column, userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};