import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (offerId: string, productId: string, shopId: string, qty?: number) => void;
  removeItem: (offerId: string) => void;
  updateQty: (offerId: string, qty: number) => void;
  clearCart: () => void;
  clearShopItems: (shopId: string) => void;
  getItemCount: () => number;
  getDistinctShopsCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (offerId: string, productId: string, shopId: string, qty = 1) => {
        const { items } = get();
        const existingIdx = items.findIndex((i) => i.offerId === offerId);

        if (existingIdx !== -1) {
          const updated = [...items];
          updated[existingIdx].qty += qty;
          set({ items: updated });
        } else {
          set({ items: [...items, { offerId, productId, shopId, qty }] });
        }
      },

      removeItem: (offerId: string) => {
        set({ items: get().items.filter((i) => i.offerId !== offerId) });
      },

      updateQty: (offerId: string, qty: number) => {
        if (qty <= 0) {
          get().removeItem(offerId);
          return;
        }
        set({
          items: get().items.map((i) => (i.offerId === offerId ? { ...i, qty } : i)),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearShopItems: (shopId: string) => {
        set({ items: get().items.filter((i) => i.shopId !== shopId) });
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.qty, 0);
      },

      getDistinctShopsCount: () => {
        const shopSet = new Set(get().items.map((i) => i.shopId));
        return shopSet.size;
      },
    }),
    {
      name: 'localkart_cart',
    }
  )
);
