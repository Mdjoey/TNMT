import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  // Xác định key lưu trữ theo tài khoản
  const getCartKey = (currentUser) => {
    return currentUser?.username 
      ? `ecotrace_cart_user_${currentUser.username}` 
      : 'ecotrace_cart_guest';
  };

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(getCartKey(user));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tự động tải giỏ hàng tương ứng khi đổi tài khoản
  useEffect(() => {
    const key = getCartKey(user);
    try {
      const saved = localStorage.getItem(key);
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }
  }, [user]);

  // Tự động lưu giỏ hàng khi thay đổi
  useEffect(() => {
    const key = getCartKey(user);
    try {
      localStorage.setItem(key, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems, user]);

  // Thêm vào giỏ
  const addToCart = (productToAdd) => {
    setCartItems((prevItems) => {
      const variantName = productToAdd.variant_name || productToAdd.unit || 'default';
      const uniqueId = `${productToAdd.id}_${variantName}`;

      const existingIndex = prevItems.findIndex(
        (item) => (item.cart_item_id || `${item.id}_${item.variant_name || item.unit || 'default'}`) === uniqueId
      );

      // Lưu giá gốc không đổi
      const originalBasePrice = Number(productToAdd.base_price || productToAdd.price || 0);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += (productToAdd.quantity || 1);
        return updated;
      } else {
        return [
          ...prevItems,
          {
            ...productToAdd,
            base_price: originalBasePrice, // Giữ nguyên mốc giá gốc
            cart_item_id: uniqueId,
            quantity: productToAdd.quantity || 1,
            farm_id: productToAdd.farm_id || 'default_farm',
            farm_name: productToAdd.farm_name || 'Nông Trại Shop',
            available_variants: productToAdd.available_variants || [],
          },
        ];
      }
    });
  }; 

  // Cập nhật số lượng chuẩn theo uniqueId (Gán trực tiếp newQuantity)
  const updateQuantity = (uniqueId, newQuantity) => {
    const qty = Number(newQuantity);
    if (qty < 1) return;
    setCartItems((prev) =>
      prev.map((item) => {
        const itemId = item.cart_item_id || `${item.id}_${item.variant_name || item.unit || 'default'}`;
        if (itemId === uniqueId || item.id === uniqueId) {
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  // Đổi quy cách đóng gói trực tiếp trong giỏ hàng
  const updateVariant = (uniqueId, newVariant) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const currentId = item.cart_item_id || `${item.id}_${item.variant_name || item.unit || 'default'}`;
        if (currentId === uniqueId || item.id === uniqueId) {
          const vName = newVariant.name || newVariant.unit || 'default';
          const newUniqueId = `${item.id}_${vName}`;
          return {
            ...item,
            cart_item_id: newUniqueId,
            variant_name: vName,
            unit: newVariant.unit || item.unit,
            price: Number(newVariant.price ?? item.price),
            multiplier_kg: Number(newVariant.multiplier_kg || newVariant.multiplier || 1.0),
          };
        }
        return item;
      })
    );
  };

  // Xóa khỏi giỏ
  const removeFromCart = (uniqueId) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        const itemId = item.cart_item_id || `${item.id}_${item.variant_name || item.unit || 'default'}`;
        return itemId !== uniqueId && item.id !== uniqueId;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(getCartKey(user));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const totalCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart: cartItems,
        cartItems,
        addToCart,
        updateVariant,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;