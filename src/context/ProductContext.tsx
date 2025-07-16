import React, { createContext, useContext, useState } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  condition: string;
  description: string;
  image: string;
  postedAt: string;
  status: string;
  views?: number;
  seller: {
    name: string;
    rating: number;
  };
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      title: 'MacBook Pro 2021 - Excellent Condition',
      price: 1299,
      location: 'Toronto, ON',
      category: 'Electronics',
      condition: 'Like New',
      description: 'MacBook Pro 13" with M1 chip. Barely used, comes with original box and charger. Perfect for students and professionals.',
      image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-15T10:30:00Z',
      status: 'active',
      views: 127,
      seller: {
        name: 'John Doe',
        rating: 4.8,
      },
    },
    {
      id: '2',
      title: 'Calculus Textbook - 8th Edition',
      price: 89,
      location: 'Vancouver, BC',
      category: 'Books',
      condition: 'Good',
      description: 'Stewart Calculus textbook in great condition. All pages intact, minimal highlighting. Perfect for university students.',
      image: 'https://images.pexels.com/photos/159581/dictionary-reference-book-learning-meaning-159581.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-14T14:20:00Z',
      status: 'active',
      views: 89,
      seller: {
        name: 'Jane Smith',
        rating: 4.9,
      },
    },
    {
      id: '3',
      title: 'Modern Office Chair - Ergonomic Design',
      price: 199,
      location: 'Calgary, AB',
      category: 'Furniture',
      condition: 'Good',
      description: 'Comfortable office chair with lumbar support. Black leather, adjustable height. Great for home office or study room.',
      image: 'https://images.pexels.com/photos/586960/pexels-photo-586960.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-13T09:15:00Z',
      status: 'active',
      views: 156,
      seller: {
        name: 'Mike Johnson',
        rating: 4.7,
      },
    },
    {
      id: '4',
      title: 'Guitar Lessons - Online & In-Person',
      price: 45,
      location: 'Montreal, QC',
      category: 'Services',
      condition: 'New',
      description: 'Professional guitar instructor with 10+ years experience. Beginner to advanced levels. First lesson free!',
      image: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-12T16:45:00Z',
      status: 'active',
      views: 203,
      seller: {
        name: 'Sarah Wilson',
        rating: 4.9,
      },
    },
    {
      id: '5',
      title: 'Winter Jacket - Columbia Brand',
      price: 79,
      location: 'Ottawa, ON',
      category: 'Clothing',
      condition: 'Good',
      description: 'Columbia winter jacket, size Medium. Warm and waterproof, perfect for Canadian winters. Excellent condition.',
      image: 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-11T12:30:00Z',
      status: 'active',
      views: 67,
      seller: {
        name: 'David Brown',
        rating: 4.6,
      },
    },
    {
      id: '6',
      title: 'Basketball Hoop - Portable',
      price: 159,
      location: 'Edmonton, AB',
      category: 'Sports',
      condition: 'Like New',
      description: 'Portable basketball hoop with adjustable height. Great for driveway or backyard. Comes with basketball.',
      image: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
      postedAt: '2024-01-10T08:00:00Z',
      status: 'active',
      views: 94,
      seller: {
        name: 'Lisa Davis',
        rating: 4.8,
      },
    },
  ]);

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === id ? { ...product, ...updates } : product
      )
    );
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, deleteProduct, updateProduct }}>
      {children}
    </ProductContext.Provider>
  );
};