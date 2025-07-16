import React, { createContext, useContext, useState } from 'react';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  seller: {
    name: string;
  };
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'ordered' | 'shipped' | 'delivered' | 'returned';
  orderDate: string;
  deliveryAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (items: OrderItem[], deliveryAddress: any, paymentMethod: string) => string;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  requestReturn: (orderId: string, itemId: string, reason: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      items: [
        {
          id: '1',
          title: 'MacBook Pro 2021 - Excellent Condition',
          price: 1299,
          image: 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=400',
          quantity: 1,
          seller: { name: 'John Doe' }
        }
      ],
      totalAmount: 1299,
      status: 'delivered',
      orderDate: '2024-01-10T10:30:00Z',
      deliveryAddress: {
        name: 'Jane Smith',
        address: '123 Main St',
        city: 'Toronto',
        postalCode: 'M5V 3A8',
        phone: '(416) 555-0123'
      },
      paymentMethod: 'Credit Card'
    }
  ]);

  const createOrder = (items: OrderItem[], deliveryAddress: any, paymentMethod: string): string => {
    const newOrder: Order = {
      id: Date.now().toString(),
      items,
      totalAmount: items.reduce((total, item) => total + (item.price * item.quantity), 0),
      status: 'ordered',
      orderDate: new Date().toISOString(),
      deliveryAddress,
      paymentMethod,
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder.id;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const requestReturn = (orderId: string, itemId: string, reason: string) => {
    // In a real app, this would create a return request
    console.log('Return requested:', { orderId, itemId, reason });
  };

  return (
    <OrderContext.Provider value={{
      orders,
      createOrder,
      updateOrderStatus,
      getOrderById,
      requestReturn,
    }}>
      {children}
    </OrderContext.Provider>
  );
};