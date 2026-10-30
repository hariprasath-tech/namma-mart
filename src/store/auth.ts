import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: 'customer' | 'shop_owner';
  shopId?: string;
  address?: string;
}

interface AuthState {
  user: UserProfile | null;
  savedAddress: string;
  login: (phone: string, name?: string, role?: 'customer' | 'shop_owner', shopId?: string) => void;
  logout: () => void;
  setSavedAddress: (address: string) => void;
  switchRole: (role: 'customer' | 'shop_owner', shopId?: string) => void;
}

const defaultCustomer: UserProfile = {
  id: 'usr-1',
  name: 'Murugan K.',
  phone: '+91 98421 90112',
  role: 'customer',
  address: '14, Kumaran Nagar, Palakkad Road, Pollachi',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: defaultCustomer,
      savedAddress: '14, Kumaran Nagar, Palakkad Road, Pollachi',

      login: (phone: string, name = 'Valued Customer', role: 'customer' | 'shop_owner' = 'customer', shopId?: string) => {
        set({
          user: {
            id: `usr-${Date.now()}`,
            name,
            phone,
            role,
            shopId: role === 'shop_owner' ? (shopId || 'shop-1') : undefined,
          },
        });
      },

      logout: () => {
        set({ user: null });
      },

      setSavedAddress: (address: string) => {
        set({ savedAddress: address });
        if (get().user) {
          set({ user: { ...get().user!, address } });
        }
      },

      switchRole: (role: 'customer' | 'shop_owner', shopId = 'shop-1') => {
        const current = get().user || defaultCustomer;
        set({
          user: {
            ...current,
            role,
            shopId: role === 'shop_owner' ? shopId : undefined,
          },
        });
      },
    }),
    {
      name: 'localkart_auth',
    }
  )
);
