import {
  Shop,
  Product,
  Offer,
  Review,
  TownLocation,
  Order,
  OrderStatus,
  Expense,
  KhataEntry,
  Supplier,
  ItemRequest,
  ItemRequestReply,
  Hold,
  GroupOrder,
} from '../types';
import townsData from '../data/towns.json';
import initialShops from '../data/shops.json';
import initialProducts from '../data/products.json';
import initialOffers from '../data/offers.json';
import initialReviews from '../data/reviews.json';
import initialExpenses from '../data/expenses.json';
import initialKhata from '../data/khata.json';
import initialSuppliers from '../data/suppliers.json';
import initialRequests from '../data/requests.json';
import { mockMLService } from '../ml-sim/mockMLService';

// Local storage keys
const STORAGE_SHOPS_KEY = 'localkart_shops';
const STORAGE_PRODUCTS_KEY = 'localkart_products';
const STORAGE_OFFERS_KEY = 'localkart_offers';
const STORAGE_ORDERS_KEY = 'localkart_orders';
const STORAGE_REVIEWS_KEY = 'localkart_reviews';
const STORAGE_EXPENSES_KEY = 'localkart_expenses';
const STORAGE_KHATA_KEY = 'localkart_khata';
const STORAGE_REQUESTS_KEY = 'localkart_requests';
const STORAGE_HOLDS_KEY = 'localkart_holds';
const STORAGE_GROUPS_KEY = 'localkart_groups';

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Storage access error', e);
  }
  return defaultValue;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

// Initial group orders
const initialGroupOrders: GroupOrder[] = [
  {
    id: 'grp-1',
    area: 'Palakkad Road / Kumaran Nagar',
    shopId: 'shop-2',
    shopName: 'Selvi Supermarket',
    joined: 3,
    target: 5,
    baseFee: 40,
    currentFee: 15, // Falling fee as people join
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'grp-2',
    area: 'Venkatesa Colony / NGM Arch',
    shopId: 'shop-1',
    shopName: 'Sri Krishna Maligai',
    joined: 4,
    target: 5,
    baseFee: 35,
    currentFee: 10,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
];

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // Towns
  async getTowns(): Promise<TownLocation[]> {
    await delay(60);
    return townsData as TownLocation[];
  },

  // Shops
  async getShops(category?: string): Promise<Shop[]> {
    await delay(80);
    const shops = getStored<Shop[]>(STORAGE_SHOPS_KEY, initialShops as Shop[]);
    if (!category || category === 'All') return shops;
    return shops.filter((s) => s.categories.includes(category));
  },

  async getShopById(id: string): Promise<Shop | undefined> {
    await delay(60);
    const shops = getStored<Shop[]>(STORAGE_SHOPS_KEY, initialShops as Shop[]);
    return shops.find((s) => s.id === id);
  },

  // Products
  async getProducts(category?: string, query?: string): Promise<Product[]> {
    await delay(80);
    let prods = getStored<Product[]>(STORAGE_PRODUCTS_KEY, initialProducts as Product[]);

    if (category && category !== 'All') {
      prods = prods.filter((p) => p.category === category);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameTa && p.nameTa.includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return prods;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    await delay(50);
    const prods = getStored<Product[]>(STORAGE_PRODUCTS_KEY, initialProducts as Product[]);
    return prods.find((p) => p.id === id);
  },

  // Offers
  async getOffers(productId?: string, shopId?: string): Promise<Offer[]> {
    await delay(80);
    let offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    if (productId) offers = offers.filter((o) => o.productId === productId);
    if (shopId) offers = offers.filter((o) => o.shopId === shopId);
    return offers;
  },

  async updateOfferStock(offerId: string, newStock: number): Promise<Offer> {
    await delay(80);
    const offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    const idx = offers.findIndex((o) => o.id === offerId);
    if (idx === -1) throw new Error('Offer not found');

    offers[idx] = {
      ...offers[idx],
      stock: Math.max(0, newStock),
      source: 'owner',
      updatedAt: new Date().toISOString(),
    };
    setStored(STORAGE_OFFERS_KEY, offers);
    return offers[idx];
  },

  async updateOfferPrice(offerId: string, newPrice: number): Promise<Offer> {
    await delay(80);
    const offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    const idx = offers.findIndex((o) => o.id === offerId);
    if (idx === -1) throw new Error('Offer not found');

    offers[idx] = {
      ...offers[idx],
      price: Math.max(1, newPrice),
      updatedAt: new Date().toISOString(),
    };
    setStored(STORAGE_OFFERS_KEY, offers);
    return offers[idx];
  },

  async createProductAndOffer(
    productData: Omit<Product, 'id'>,
    offerData: { shopId: string; price: number; stock: number; mrp?: number }
  ): Promise<{ product: Product; offer: Offer }> {
    await delay(120);
    const prods = getStored<Product[]>(STORAGE_PRODUCTS_KEY, initialProducts as Product[]);
    const offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);

    const newProdId = `prod-${prods.length + 1}`;
    const newProduct: Product = { ...productData, id: newProdId };
    prods.unshift(newProduct);
    setStored(STORAGE_PRODUCTS_KEY, prods);

    const newOfferId = `off-${offers.length + 1}`;
    const newOffer: Offer = {
      id: newOfferId,
      productId: newProdId,
      shopId: offerData.shopId,
      price: offerData.price,
      stock: offerData.stock,
      mrp: offerData.mrp || offerData.price,
      deliveryEstMins: 25,
      pickupEstMins: 10,
      source: 'owner',
      updatedAt: new Date().toISOString(),
    };
    offers.unshift(newOffer);
    setStored(STORAGE_OFFERS_KEY, offers);

    return { product: newProduct, offer: newOffer };
  },

  // Orders
  async getOrders(shopId?: string, customerPhone?: string): Promise<Order[]> {
    await delay(80);
    let orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    if (shopId) orders = orders.filter((o) => o.shopId === shopId);
    if (customerPhone) orders = orders.filter((o) => o.customerPhone === customerPhone);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    await delay(60);
    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    return orders.find((o) => o.id === id);
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    await delay(150);
    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    const newId = `LK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    setStored(STORAGE_ORDERS_KEY, orders);

    // Decrement stock
    const offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    for (const it of orderData.items) {
      const idx = offers.findIndex((o) => o.id === it.offerId);
      if (idx !== -1) {
        offers[idx].stock = Math.max(0, offers[idx].stock - it.qty);
        offers[idx].updatedAt = new Date().toISOString();
      }
    }
    setStored(STORAGE_OFFERS_KEY, offers);

    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    await delay(80);
    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    orders[idx] = { ...orders[idx], status };
    setStored(STORAGE_ORDERS_KEY, orders);
    return orders[idx];
  },

  // Reviews
  async getReviews(shopId?: string): Promise<Review[]> {
    await delay(60);
    let reviews = getStored<Review[]>(STORAGE_REVIEWS_KEY, initialReviews as Review[]);
    if (shopId) reviews = reviews.filter((r) => r.shopId === shopId);
    return reviews;
  },

  async addReview(reviewData: Omit<Review, 'id' | 'date'>): Promise<Review> {
    await delay(80);
    const reviews = getStored<Review[]>(STORAGE_REVIEWS_KEY, initialReviews as Review[]);
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    reviews.unshift(newReview);
    setStored(STORAGE_REVIEWS_KEY, reviews);
    return newReview;
  },

  // v2: Expenses
  async getExpenses(shopId?: string): Promise<Expense[]> {
    await delay(60);
    let expenses = getStored<Expense[]>(STORAGE_EXPENSES_KEY, initialExpenses as Expense[]);
    if (shopId) expenses = expenses.filter((e) => e.shopId === shopId);
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    await delay(80);
    const expenses = getStored<Expense[]>(STORAGE_EXPENSES_KEY, initialExpenses as Expense[]);
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    expenses.unshift(newExp);
    setStored(STORAGE_EXPENSES_KEY, expenses);
    return newExp;
  },

  // v2: Khata (Customer Credit)
  async getKhata(shopId?: string): Promise<KhataEntry[]> {
    await delay(60);
    let entries = getStored<KhataEntry[]>(STORAGE_KHATA_KEY, initialKhata as KhataEntry[]);
    if (shopId) entries = entries.filter((k) => k.shopId === shopId);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addKhataEntry(entryData: Omit<KhataEntry, 'id'>): Promise<KhataEntry> {
    await delay(80);
    const entries = getStored<KhataEntry[]>(STORAGE_KHATA_KEY, initialKhata as KhataEntry[]);
    const newEntry: KhataEntry = {
      ...entryData,
      id: `kh-${Date.now()}`,
    };
    entries.unshift(newEntry);
    setStored(STORAGE_KHATA_KEY, entries);
    return newEntry;
  },

  // v2: Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    await delay(50);
    return initialSuppliers as Supplier[];
  },

  // v2: Item Requests ("Can't find it?")
  async getItemRequests(): Promise<ItemRequest[]> {
    await delay(60);
    return getStored<ItemRequest[]>(STORAGE_REQUESTS_KEY, initialRequests as ItemRequest[]);
  },

  async createItemRequest(data: { text: string; area: string; customerName: string; customerPhone?: string }): Promise<ItemRequest> {
    await delay(100);
    const requests = getStored<ItemRequest[]>(STORAGE_REQUESTS_KEY, initialRequests as ItemRequest[]);
    const newReq: ItemRequest = {
      id: `req-${Date.now()}`,
      text: data.text,
      area: data.area,
      createdAt: new Date().toISOString(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      replies: [],
    };
    requests.unshift(newReq);
    setStored(STORAGE_REQUESTS_KEY, requests);
    return newReq;
  },

  async replyToRequest(requestId: string, reply: ItemRequestReply): Promise<ItemRequest> {
    await delay(80);
    const requests = getStored<ItemRequest[]>(STORAGE_REQUESTS_KEY, initialRequests as ItemRequest[]);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Request not found');

    requests[idx].replies.push(reply);
    setStored(STORAGE_REQUESTS_KEY, requests);
    return requests[idx];
  },

  // v2: Reserve & Pick Up (Holds)
  async getHolds(): Promise<Hold[]> {
    await delay(40);
    return getStored<Hold[]>(STORAGE_HOLDS_KEY, []);
  },

  async createHold(data: { offerId: string; productId: string; shopId: string; shopName: string; qty: number }): Promise<Hold> {
    await delay(80);
    const holds = getStored<Hold[]>(STORAGE_HOLDS_KEY, []);
    const newHold: Hold = {
      id: `hold-${Date.now()}`,
      offerId: data.offerId,
      productId: data.productId,
      shopId: data.shopId,
      shopName: data.shopName,
      qty: data.qty,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      claimed: false,
    };
    holds.unshift(newHold);
    setStored(STORAGE_HOLDS_KEY, holds);
    return newHold;
  },

  async cancelHold(holdId: string): Promise<void> {
    await delay(50);
    let holds = getStored<Hold[]>(STORAGE_HOLDS_KEY, []);
    holds = holds.filter((h) => h.id !== holdId);
    setStored(STORAGE_HOLDS_KEY, holds);
  },

  // v2: Neighbourhood Group Orders
  async getGroupOrders(): Promise<GroupOrder[]> {
    await delay(50);
    return getStored<GroupOrder[]>(STORAGE_GROUPS_KEY, initialGroupOrders);
  },

  async joinGroupOrder(groupId: string): Promise<GroupOrder> {
    await delay(80);
    const groups = getStored<GroupOrder[]>(STORAGE_GROUPS_KEY, initialGroupOrders);
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx === -1) throw new Error('Group order not found');

    groups[idx].joined += 1;
    groups[idx].currentFee = Math.max(5, Math.round(groups[idx].baseFee / groups[idx].joined));
    setStored(STORAGE_GROUPS_KEY, groups);
    return groups[idx];
  },

  // ML Service
  ml: mockMLService,
};
