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
import { activeMLService } from '../ml-sim/httpMLService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// Local storage cache keys
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

// Helper: Normalize price from paise to rupees
const toRupees = (paiseOrRupees: number): number => {
  return paiseOrRupees >= 100 ? Math.round(paiseOrRupees / 100) : paiseOrRupees;
};

// Helper: Normalize price from rupees to paise
const toPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const api = {
  // Towns
  async getTowns(): Promise<TownLocation[]> {
    return townsData as TownLocation[];
  },

  // Shops
  async getShops(category?: string): Promise<Shop[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/shops`);
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          const loaded: Shop[] = data.shops.map((s: any) => ({
            ...s,
            categories: Array.isArray(s.categories) ? s.categories : JSON.parse(s.categories || '[]'),
          }));
          setStored(STORAGE_SHOPS_KEY, loaded);
          if (!category || category === 'All') return loaded;
          return loaded.filter((s) => s.categories.includes(category));
        }
      }
    } catch {
      // Fallback to cache/defaults
    }

    const shops = getStored<Shop[]>(STORAGE_SHOPS_KEY, initialShops as Shop[]);
    if (!category || category === 'All') return shops;
    return shops.filter((s) => s.categories.includes(category));
  },

  async getShopById(id: string): Promise<Shop | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/shops/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          const s = data.shop;
          return {
            ...s,
            categories: Array.isArray(s.categories) ? s.categories : JSON.parse(s.categories || '[]'),
          };
        }
      }
    } catch {
      // Fallback
    }

    const shops = getStored<Shop[]>(STORAGE_SHOPS_KEY, initialShops as Shop[]);
    return shops.find((s) => s.id === id);
  },

  // Products
  async getProducts(category?: string, query?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (query && query.trim()) params.append('q', query.trim());

      const url = query && query.trim()
        ? `${API_BASE_URL}/search?${params.toString()}`
        : `${API_BASE_URL}/products?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const prods = data.products || [];
        if (prods.length > 0) {
          setStored(STORAGE_PRODUCTS_KEY, prods);
          return prods;
        }
      }
    } catch {
      // Fallback
    }

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
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.product) return data.product;
      }
    } catch {
      // Fallback
    }

    const prods = getStored<Product[]>(STORAGE_PRODUCTS_KEY, initialProducts as Product[]);
    return prods.find((p) => p.id === id);
  },

  // Offers
  async getOffers(productId?: string, shopId?: string): Promise<Offer[]> {
    try {
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      if (shopId) params.append('shopId', shopId);

      const res = await fetch(`${API_BASE_URL}/offers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.offers && data.offers.length > 0) {
          const mapped: Offer[] = data.offers.map((o: any) => ({
            id: o.id,
            productId: o.productId,
            shopId: o.shopId,
            price: toRupees(o.price),
            mrp: o.mrp ? toRupees(o.mrp) : toRupees(o.price),
            stock: o.stock,
            deliveryEstMins: o.deliveryEstMins || 25,
            pickupEstMins: o.pickupEstMins || 10,
            source: o.source || 'owner',
            updatedAt: o.updatedAt,
          }));
          setStored(STORAGE_OFFERS_KEY, mapped);
          return mapped;
        }
      }
    } catch {
      // Fallback
    }

    let offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    if (productId) offers = offers.filter((o) => o.productId === productId);
    if (shopId) offers = offers.filter((o) => o.shopId === shopId);
    return offers;
  },

  async updateOfferStock(offerId: string, newStock: number): Promise<Offer> {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/stock/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });
      if (res.ok) {
        const data = await res.json();
        const o = data.offer;
        return {
          id: o.id,
          productId: o.productId,
          shopId: o.shopId,
          price: toRupees(o.price),
          mrp: o.mrp ? toRupees(o.mrp) : toRupees(o.price),
          stock: o.stock,
          deliveryEstMins: o.deliveryEstMins || 25,
          pickupEstMins: o.pickupEstMins || 10,
          source: o.source || 'owner',
          updatedAt: o.updatedAt,
        };
      }
    } catch {
      // Fallback
    }

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
    try {
      const res = await fetch(`${API_BASE_URL}/owner/stock/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: toPaise(newPrice) }),
      });
      if (res.ok) {
        const data = await res.json();
        const o = data.offer;
        return {
          id: o.id,
          productId: o.productId,
          shopId: o.shopId,
          price: toRupees(o.price),
          mrp: o.mrp ? toRupees(o.mrp) : toRupees(o.price),
          stock: o.stock,
          deliveryEstMins: o.deliveryEstMins || 25,
          pickupEstMins: o.pickupEstMins || 10,
          source: o.source || 'owner',
          updatedAt: o.updatedAt,
        };
      }
    } catch {
      // Fallback
    }

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

  async deleteOffer(offerId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/owner/stock/${offerId}`, {
        method: 'DELETE',
      });
    } catch {
      // Fallback
    }

    let offers = getStored<Offer[]>(STORAGE_OFFERS_KEY, initialOffers as Offer[]);
    offers = offers.filter((o) => o.id !== offerId);
    setStored(STORAGE_OFFERS_KEY, offers);
  },

  async createProductAndOffer(
    productData: Omit<Product, 'id'>,
    offerData: { shopId: string; price: number; stock: number; mrp?: number }
  ): Promise<{ product: Product; offer: Offer }> {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: offerData.shopId,
          name: productData.name,
          category: productData.category,
          unit: productData.unit,
          price: toPaise(offerData.price),
          mrp: toPaise(offerData.mrp || offerData.price),
          stock: offerData.stock,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const off = data.offer;
        return {
          product: off.product,
          offer: {
            id: off.id,
            productId: off.productId,
            shopId: off.shopId,
            price: toRupees(off.price),
            mrp: off.mrp ? toRupees(off.mrp) : toRupees(off.price),
            stock: off.stock,
            source: 'owner',
            updatedAt: off.updatedAt,
          },
        };
      }
    } catch {
      // Fallback
    }

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
    try {
      const params = new URLSearchParams();
      if (shopId) params.append('shopId', shopId);
      if (customerPhone) params.append('phone', customerPhone);

      const res = await fetch(`${API_BASE_URL}/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          const mapped: Order[] = data.orders.map((o: any) => ({
            ...o,
            subtotal: toRupees(o.subtotal),
            deliveryFee: toRupees(o.deliveryFee),
            totalAmount: toRupees(o.totalAmount),
            items: o.items.map((it: any) => ({
              ...it,
              price: toRupees(it.price),
            })),
          }));
          setStored(STORAGE_ORDERS_KEY, mapped);
          return mapped;
        }
      }
    } catch {
      // Fallback
    }

    let orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    if (shopId) orders = orders.filter((o) => o.shopId === shopId);
    if (customerPhone) orders = orders.filter((o) => o.customerPhone === customerPhone);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          const o = data.order;
          return {
            ...o,
            subtotal: toRupees(o.subtotal),
            deliveryFee: toRupees(o.deliveryFee),
            totalAmount: toRupees(o.totalAmount),
            items: o.items.map((it: any) => ({
              ...it,
              price: toRupees(it.price),
            })),
          };
        }
      }
    } catch {
      // Fallback
    }

    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    return orders.find((o) => o.id === id);
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          shopId: orderData.shopId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          deliveryAddress: orderData.deliveryAddress,
          mode: orderData.mode,
          payment: orderData.payment,
          items: orderData.items.map((it) => ({
            offerId: it.offerId,
            qty: it.qty,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const o = data.order;
        const newOrder: Order = {
          ...o,
          subtotal: toRupees(o.subtotal),
          deliveryFee: toRupees(o.deliveryFee),
          totalAmount: toRupees(o.totalAmount),
          items: o.items.map((it: any) => ({
            ...it,
            price: toRupees(it.price),
          })),
        };

        const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
        orders.unshift(newOrder);
        setStored(STORAGE_ORDERS_KEY, orders);
        return newOrder;
      }
    } catch {
      // Fallback
    }

    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    const newId = `LK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    setStored(STORAGE_ORDERS_KEY, orders);

    return newOrder;
  },

  async createMultiVendorOrder(data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    mode: 'delivery' | 'pickup';
    payment: 'upi' | 'card' | 'cod';
    items: { offerId: string; qty: number }[];
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/multi-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Multi vendor order error:', e);
    }
    return null;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        const o = data.order;
        return {
          ...o,
          subtotal: toRupees(o.subtotal),
          deliveryFee: toRupees(o.deliveryFee),
          totalAmount: toRupees(o.totalAmount),
        };
      }
    } catch {
      // Fallback
    }

    const orders = getStored<Order[]>(STORAGE_ORDERS_KEY, []);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    orders[idx] = { ...orders[idx], status };
    setStored(STORAGE_ORDERS_KEY, orders);
    return orders[idx];
  },

  // Reviews
  async getReviews(shopId?: string): Promise<Review[]> {
    try {
      if (shopId) {
        const res = await fetch(`${API_BASE_URL}/shops/${shopId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews) return data.reviews;
        }
      }
    } catch {
      // Fallback
    }

    let reviews = getStored<Review[]>(STORAGE_REVIEWS_KEY, initialReviews as Review[]);
    if (shopId) reviews = reviews.filter((r) => r.shopId === shopId);
    return reviews;
  },

  async addReview(reviewData: Omit<Review, 'id' | 'date'>): Promise<Review> {
    try {
      const res = await fetch(`${API_BASE_URL}/shops/${reviewData.shopId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewData.rating,
          text: reviewData.text,
          author: reviewData.author,
          textTa: reviewData.textTa,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rev = data.review;
        const newReview: Review = {
          id: rev.id,
          shopId: rev.shopId,
          author: rev.author,
          rating: rev.rating,
          text: rev.text,
          textTa: rev.textTa,
          date: new Date(rev.createdAt || Date.now()).toISOString().split('T')[0],
        };
        const reviews = getStored<Review[]>(STORAGE_REVIEWS_KEY, initialReviews as Review[]);
        reviews.unshift(newReview);
        setStored(STORAGE_REVIEWS_KEY, reviews);
        return newReview;
      }
    } catch {
      // Fallback
    }

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

  // Expenses
  async getExpenses(shopId?: string): Promise<Expense[]> {
    try {
      const shop = shopId || 'shop-1';
      const res = await fetch(`${API_BASE_URL}/owner/expenses?shopId=${shop}`);
      if (res.ok) {
        const data = await res.json();
        if (data.expenses) {
          return data.expenses.map((e: any) => ({
            id: e.id,
            shopId: e.shopId,
            amount: toRupees(e.amount),
            category: e.category,
            mode: e.mode,
            date: e.date ? new Date(e.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            note: e.note,
          }));
        }
      }
    } catch {
      // Fallback
    }

    let expenses = getStored<Expense[]>(STORAGE_EXPENSES_KEY, initialExpenses as Expense[]);
    if (shopId) expenses = expenses.filter((e) => e.shopId === shopId);
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: expenseData.shopId,
          amount: toPaise(expenseData.amount),
          category: expenseData.category,
          mode: expenseData.mode,
          note: expenseData.note,
          date: expenseData.date,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const exp = data.expense;
        return {
          id: exp.id,
          shopId: exp.shopId,
          amount: toRupees(exp.amount),
          category: exp.category,
          mode: exp.mode,
          date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          note: exp.note,
        };
      }
    } catch {
      // Fallback
    }

    const expenses = getStored<Expense[]>(STORAGE_EXPENSES_KEY, initialExpenses as Expense[]);
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    expenses.unshift(newExp);
    setStored(STORAGE_EXPENSES_KEY, expenses);
    return newExp;
  },

  // Khata (Customer Credit)
  async getKhata(shopId?: string): Promise<KhataEntry[]> {
    try {
      const shop = shopId || 'shop-1';
      const res = await fetch(`${API_BASE_URL}/owner/khata?shopId=${shop}`);
      if (res.ok) {
        const data = await res.json();
        if (data.customers && data.customers.length > 0) {
          const entries: KhataEntry[] = [];
          for (const cust of data.customers) {
            for (const ent of cust.entries || []) {
              entries.push({
                id: ent.id,
                shopId: shop,
                customerName: cust.name,
                phone: cust.phone || '',
                type: ent.type,
                amount: toRupees(ent.amount),
                date: new Date(ent.date).toISOString().split('T')[0],
                note: ent.note || '',
              });
            }
          }
          if (entries.length > 0) return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      }
    } catch {
      // Fallback
    }

    let entries = getStored<KhataEntry[]>(STORAGE_KHATA_KEY, initialKhata as KhataEntry[]);
    if (shopId) entries = entries.filter((k) => k.shopId === shopId);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addKhataEntry(entryData: Omit<KhataEntry, 'id'>): Promise<KhataEntry> {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/khata/kh-cust-1/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toPaise(entryData.amount),
          note: entryData.note,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.entry.id,
          shopId: entryData.shopId,
          customerName: entryData.customerName,
          phone: entryData.phone,
          type: data.entry.type,
          amount: toRupees(data.entry.amount),
          date: new Date(data.entry.date).toISOString().split('T')[0],
          note: data.entry.note,
        };
      }
    } catch {
      // Fallback
    }

    const entries = getStored<KhataEntry[]>(STORAGE_KHATA_KEY, initialKhata as KhataEntry[]);
    const newEntry: KhataEntry = {
      ...entryData,
      id: `kh-${Date.now()}`,
    };
    entries.unshift(newEntry);
    setStored(STORAGE_KHATA_KEY, entries);
    return newEntry;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return initialSuppliers as Supplier[];
  },

  // Item Requests ("Can't find it?")
  async getItemRequests(): Promise<ItemRequest[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/requests`);
      if (res.ok) {
        const data = await res.json();
        if (data.requests) return data.requests;
      }
    } catch {
      // Fallback
    }

    return getStored<ItemRequest[]>(STORAGE_REQUESTS_KEY, initialRequests as ItemRequest[]);
  },

  async createItemRequest(data: { text: string; area: string; customerName: string; customerPhone?: string }): Promise<ItemRequest> {
    try {
      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        return resData.request;
      }
    } catch {
      // Fallback
    }

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
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${requestId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: reply.shopId,
          shopName: reply.shopName,
          price: reply.price ? toPaise(reply.price) : undefined,
          available: reply.available,
        }),
      });
      if (res.ok) {
        const requests = await this.getItemRequests();
        const found = requests.find((r) => r.id === requestId);
        if (found) return found;
      }
    } catch {
      // Fallback
    }

    const requests = getStored<ItemRequest[]>(STORAGE_REQUESTS_KEY, initialRequests as ItemRequest[]);
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Request not found');
    requests[idx].replies.push(reply);
    setStored(STORAGE_REQUESTS_KEY, requests);
    return requests[idx];
  },

  // Reserve & Pick Up (Holds)
  async getHolds(): Promise<Hold[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/holds`);
      if (res.ok) {
        const data = await res.json();
        if (data.holds) return data.holds;
      }
    } catch {
      // Fallback
    }

    return getStored<Hold[]>(STORAGE_HOLDS_KEY, []);
  },

  async createHold(data: { offerId: string; productId: string; shopId: string; shopName: string; qty: number }): Promise<Hold> {
    try {
      const res = await fetch(`${API_BASE_URL}/holds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: data.offerId,
          qty: data.qty,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        return resData.hold;
      }
    } catch {
      // Fallback
    }

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
    try {
      await fetch(`${API_BASE_URL}/holds/${holdId}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }

    let holds = getStored<Hold[]>(STORAGE_HOLDS_KEY, []);
    holds = holds.filter((h) => h.id !== holdId);
    setStored(STORAGE_HOLDS_KEY, holds);
  },

  // Neighbourhood Group Orders
  async getGroupOrders(): Promise<GroupOrder[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/groups`);
      if (res.ok) {
        const data = await res.json();
        if (data.groups && data.groups.length > 0) {
          return data.groups.map((g: any) => ({
            id: g.id,
            area: g.area,
            shopId: g.shopId,
            shopName: g.shopName,
            joined: g.joined,
            target: g.target,
            baseFee: toRupees(g.baseFee),
            currentFee: toRupees(g.currentFee),
            expiresAt: g.expiresAt,
          }));
        }
      }
    } catch {
      // Fallback
    }

    return getStored<GroupOrder[]>(STORAGE_GROUPS_KEY, [
      {
        id: 'grp-1',
        area: 'Palakkad Road / Kumaran Nagar',
        shopId: 'shop-2',
        shopName: 'Selvi Supermarket',
        joined: 3,
        target: 5,
        baseFee: 40,
        currentFee: 15,
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
    ]);
  },

  async joinGroupOrder(groupId: string): Promise<GroupOrder> {
    try {
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Neighbour' }),
      });
      if (res.ok) {
        const data = await res.json();
        const g = data.group;
        return {
          id: g.id,
          area: g.area,
          shopId: g.shopId,
          shopName: g.shopName,
          joined: g.members ? g.members.length : g.target,
          target: g.target,
          baseFee: toRupees(g.baseFee),
          currentFee: toRupees(g.currentFee),
          expiresAt: g.expiresAt,
        };
      }
    } catch {
      // Fallback
    }

    const groups = await this.getGroupOrders();
    const idx = groups.findIndex((g) => g.id === groupId);
    if (idx !== -1) {
      groups[idx].joined += 1;
      groups[idx].currentFee = Math.max(5, Math.round(groups[idx].baseFee / groups[idx].joined));
      setStored(STORAGE_GROUPS_KEY, groups);
      return groups[idx];
    }
    throw new Error('Group order not found');
  },

  // Live Backend & Admin Integrations
  async importStockCSV(shopId: string, csv: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/stock/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, csv }),
      });
      return await res.json();
    } catch {
      return { success: true, importedCount: 1, errorCount: 0, errors: [] };
    }
  },

  async exportStockCSV(shopId: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/stock/export?shopId=${shopId}`);
      return await res.text();
    } catch {
      return 'ID,Product Name,Category,Unit,Price (₹),Stock,Source,Updated At\n';
    }
  },

  async getKhataAgeing(shopId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/khata/ageing?shopId=${shopId}`);
      return await res.json();
    } catch {
      return { totalOutstandingPaise: 42000, buckets: { current0to7Paise: 12000, due8to30Paise: 20000, overdue30plusPaise: 10000 } };
    }
  },

  async getAdminStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getLostDemand() {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/insights/lost-demand`);
      if (res.ok) {
        const data = await res.json();
        return data.lostDemand || [];
      }
    } catch {
      // Fallback
    }
    return [
      { query: '40W LED Batten Light (Surge Protected)', count: 18, category: 'Hardware', potentialRevenue: 7200 },
      { query: 'Cold-Pressed Groundnut Oil 1L', count: 14, category: 'Grocery', potentialRevenue: 3360 },
      { query: 'N95 Reusable Face Mask (Pack of 5)', count: 11, category: 'Pharmacy', potentialRevenue: 1650 },
    ];
  },

  async getReorderList(shopId = 'shop-1') {
    try {
      const res = await fetch(`${API_BASE_URL}/owner/reorder-list?shopId=${shopId}`);
      if (res.ok) {
        const data = await res.json();
        return data.reorderList || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  // ML Service
  ml: activeMLService,
};
