import { Zone, Camera } from './ml';
export * from './ml';

export interface Shop {
  id: string;
  name: string;
  shortName: string; // Max 16 chars, human-chosen for clean map pills
  nameTa?: string;
  area: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  openNow: boolean;
  hours: string;
  delivery: boolean;
  pickup: boolean;
  categories: string[];
  bannerColor?: string;
  type: 'small' | 'department';
  zones?: Zone[];
  cameras?: Camera[];
  verified: boolean;
  avgReplyMins: number;
}

export interface Product {
  id: string;
  name: string;
  nameTa?: string;
  category: string;
  unit: string;
  image: string;
  description: string;
  descriptionTa?: string;
}

export interface Offer {
  id: string;
  productId: string;
  shopId: string;
  price: number;
  mrp?: number;
  stock: number;
  deliveryEstMins?: number;
  pickupEstMins?: number;
  source?: 'owner' | 'camera';
  updatedAt?: string;
}

export interface StockItem {
  id: string;
  productId: string;
  shopId: string;
  qty: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  reorderLevel: number;
  expiry?: string;
  supplierId?: string;
  source: 'owner' | 'camera';
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjust' | 'wastage';
  qty: number;
  at: string;
  note?: string;
}

export interface Expense {
  id: string;
  shopId: string;
  amount: number;
  category: 'stock purchase' | 'rent' | 'electricity' | 'salary' | 'transport' | 'repairs' | 'packaging' | 'other';
  mode: 'cash' | 'upi' | 'card';
  date: string;
  note?: string;
}

export interface KhataEntry {
  id: string;
  shopId: string;
  customerName: string;
  phone?: string;
  type: 'credit' | 'payment';
  amount: number;
  date: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  items: string[];
}

export interface ItemRequestReply {
  shopId: string;
  shopName: string;
  price?: number;
  available: boolean;
  replyAt: string;
}

export interface ItemRequest {
  id: string;
  text: string;
  area: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  replies: ItemRequestReply[];
}

export interface Hold {
  id: string;
  offerId: string;
  productId: string;
  shopId: string;
  shopName: string;
  qty: number;
  expiresAt: string; // ISO date string 30 min from creation
  claimed: boolean;
}

export interface GroupOrder {
  id: string;
  area: string;
  shopId: string;
  shopName: string;
  joined: number;
  target: number;
  baseFee: number;
  currentFee: number;
  expiresAt: string;
}

export interface CartItem {
  offerId: string;
  productId: string;
  shopId: string;
  qty: number;
}

export type OrderMode = 'delivery' | 'pickup';
export type PaymentMethod = 'upi' | 'card' | 'cod';
export type OrderStatus = 'packed' | 'out_for_delivery' | 'delivered' | 'ready_for_pickup' | 'picked_up';

export interface OrderItem {
  productId: string;
  offerId: string;
  name: string;
  price: number;
  qty: number;
  unit: string;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  mode: OrderMode;
  payment: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  status: OrderStatus;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
}

export interface Review {
  id: string;
  shopId: string;
  productId?: string;
  rating: number;
  text: string;
  textTa?: string;
  author: string;
  date: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface TownLocation {
  id: string;
  name: string;
  nameTa: string;
  area: string;
  lat: number;
  lng: number;
}

export interface ComparisonFilter {
  maxDistanceKm?: number;
  minRating?: number;
  maxPrice?: number;
  openNowOnly?: boolean;
  hasDeliveryOnly?: boolean;
  hasPickupOnly?: boolean;
  sortBy?: 'cheapest' | 'closest' | 'topRated';
}

export interface OfferComparisonResult {
  offer: Offer;
  shop: Shop;
  product: Product;
  distanceKm: number;
  isCheapest: boolean;
  isClosest: boolean;
  isTopRated: boolean;
  summaryLabel: string;
}
