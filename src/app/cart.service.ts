import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public cartItems = new BehaviorSubject<any[]>([]);
  cartItems$ = this.cartItems.asObservable();
  
  public apiUrl = 'https://renderdemo-pnzm.onrender.com/guest/create_orders';
  public apiUrl3 = 'https://renderdemo-pnzm.onrender.com/guest/create_orders_all';
  public apiUrl4 = 'https://renderdemo-pnzm.onrender.com/guest/create_orders_two_all';
  public apiUrl2 = 'https://renderdemo-pnzm.onrender.com/guest/create_orders_two';
  public orderUrl = 'https://renderdemo-pnzm.onrender.com/guest';
  
  private heldOrderSubject = new ReplaySubject<void>(1);
  public heldOrder$ = this.heldOrderSubject.asObservable();
  
  holdOrderMade = new EventEmitter<void>();

  // Products requiring measurement
  public measurementProducts: string[] = [
    'SAV',
    'SAV WITH LAMINATION',
    'FLEXY',
    'ONE WAY',
    'REFLECTIVE',
    'TRANSPARENT',
    'SAV PRINT & CUT',
    'PP LABEL PRINT & CUT',
    'TRANSPARENT PRINT & CUT',
    'BANNER WITH LAMINATION'
  ];

  constructor(public http: HttpClient) {
    this.loadCart();
  }

  // ===================== PAYMENT METHODS =====================

  payOrder(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderData);
  }

  payOrderTwoAll(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl3, orderData);
  }

  payOrderAll(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl4, orderData);
  }

  payOrderTwo(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl2, orderData);
  }

  // ===================== HOLD & PAY UNIFIED METHOD =====================

  holdAndPay(data: any): Observable<any> {
    console.log("📤 Sending hold & pay request:", data);
    
    const payload = {
      id: data.id || null,
      cartItems: data.cartItems || [],
      total: data.total || 0,
      amount_paid: data.amount_paid || 0,
      customer: data.customer || '',
      note: data.note || '',
      table: data.table || '',
      method: data.method || 'Cash'
    };
    
    return this.http.post(`${this.orderUrl}/hold_and_pay`, payload).pipe(
      tap({
        next: (response: any) => {
          console.log("✅ Hold & Pay successful:", response);
          this.heldOrderSubject.next();
          this.holdOrderMade.emit();
        },
        error: (error) => {
          console.error("❌ Hold & Pay error:", error);
        }
      })
    );
  }

  // ===================== CART OPERATIONS =====================

  private getMeasurementKey(product: any, width?: number, height?: number, unit?: string): string {
    const productId = product.id || product._id || product.name;
    if (this.requiresMeasurement(product) && width && height && unit) {
      return `${productId}_${width}x${height}_${unit}`;
    }
    return productId;
  }

  requiresMeasurement(product: any): boolean {
    if (!product) return false;
    const name = (product.name || product.item_name || '').toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }

  updateItemDescription(item: any, description: string): void {
    const items = this.getCart();
    const cartItem = this.findCartItem(items, item);
    
    if (cartItem) {
      cartItem.description = description;
      this.updateCart(items);
    }
  }

  calculateProductPrice(product: any, width: number, height: number, unit: string): number {
    const basePrice = product.price || 0;
    const name = (product.name || product.item_name || '').toUpperCase();
    const isMeasurementProduct = this.measurementProducts.some(p => name.includes(p.toUpperCase()));
    
    if (!isMeasurementProduct) {
      return basePrice;
    }

    if (unit === 'inches') {
      return (width * height * basePrice) / 144;
    } else if (unit === 'feet') {
      return width * height * basePrice;
    }
    
    return basePrice;
  }

  private findCartItem(
    items: any[],
    product: any,
    width?: number,
    height?: number,
    unit?: string
  ): any | null {
    if (product?.cart_item_id) {
      return items.find(
        item => item.cart_item_id === product.cart_item_id
      ) || null;
    }

    const productId = product.product_id || product.id || product._id || product.name;
    const needsMeasurement = this.requiresMeasurement(product);

    return items.find(item => {
      const itemProductId = item.product_id || item.id || item._id || item.name;
      if (itemProductId !== productId) return false;
      if (needsMeasurement) {
        if (!item.measurement) return false;
        return (
          item.measurement.width === width &&
          item.measurement.height === height &&
          item.measurement.unit === unit
        );
      }
      return true;
    }) || null;
  }

  addToCart(product: any, width?: number, height?: number, unit?: string): void {
    const items = this.getCart();
    const productName = product.name || product.item_name || '';
    const needsMeasurement = this.requiresMeasurement(product);

    let calculatedPrice = product.price || 0;
    let measurementData = null;
    let uniqueKey = product.id || product._id || product.name;

    if (needsMeasurement && width && height && unit) {
      calculatedPrice = this.calculateProductPrice(product, width, height, unit);
      measurementData = { width, height, unit, area: width * height };
      uniqueKey = this.getMeasurementKey(product, width, height, unit);
    }

    const newItem: any = {
      ...product,
      id: product.id || product._id || product.name,
      cart_item_id: this.generateCartItemId(),
      qty: 1,
      description: product.description || '',
      confirmed: null,
      is_checked: "no",
      checked_by: "",
      name: productName
    };

    if (needsMeasurement && measurementData) {
      newItem.is_measurement_product = true;
      newItem.measurement = measurementData;
      newItem._measurementKey = uniqueKey;
      console.log(`📏 Added measurement product: ${productName} (${width}x${height} ${unit})`);
    } else {
      newItem.is_measurement_product = false;
      console.log(`➕ Added new item: ${productName}`);
    }

    items.push(newItem);
    this.updateCart(items);
  }

  addMeasurementToCart(product: any, width: number, height: number, unit: string): void {
    this.addToCart(product, width, height, unit);
  }

  increaseQty(product: any): void {
    this.updateItemQty(product, 1);
  }

  decreaseQty(product: any): void {
    this.updateItemQty(product, -1);
  }

  public updateItemQty(product: any, change: number): void {
    const items = this.getCart();
    const width = product.measurement?.width;
    const height = product.measurement?.height;
    const unit = product.measurement?.unit;
    const item = this.findCartItem(items, product, width, height, unit);

    if (item) {
      item.qty = (item.qty || 0) + change;
      if (item.is_measurement_product && item.measurement) {
        item.total = item.price * item.qty;
      }
      if (item.qty <= 0) {
        this.removeFromCart(product);
        return;
      }
      console.log(`🔄 Updated quantity: ${item.name} -> ${item.qty}`);
    } else {
      console.warn(`⚠️ Item not found in cart:`, product);
    }
    this.updateCart(items);
  }

  removeFromCart(product: any): void {
    const items = this.getCart();
    if (product?.cart_item_id) {
      const filteredItems = items.filter(item => item.cart_item_id !== product.cart_item_id);
      this.updateCart(filteredItems);
      console.log(`🗑️ Removed cart item: ${product.cart_item_id}`);
      return;
    }
  }

  clearCart(): void {
    this.updateCart([]);
    console.log('🧹 Cart cleared');
  }

  getTotal(): number {
    return this.getCart().reduce((sum, item) => {
      if (item.total !== undefined) {
        return sum + item.total;
      }
      return sum + (item.price || 0) * (item.qty || 0);
    }, 0);
  }

  public getCart(): any[] {
    return this.safeParse(localStorage.getItem('cart'), []);
  }

  public updateCart(items: any[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
    this.cartItems.next([...items]);
  }

  public loadCart(): void {
    this.cartItems.next(this.getCart());
  }

  updateItemPrice(item: any, newPrice: number): void {
    const items = this.getCart();
    if (!item?.cart_item_id) {
      console.warn('⚠️ Cannot update price: cart_item_id is missing', item);
      return;
    }
    const existingItem = items.find(cartItem => cartItem.cart_item_id === item.cart_item_id);
    if (!existingItem) {
      console.warn('⚠️ Cart item not found:', item.cart_item_id);
      return;
    }
    const price = Number(newPrice);
    if (!Number.isFinite(price) || price < 0) {
      console.warn('⚠️ Invalid price:', newPrice);
      return;
    }
    existingItem.price = price;
    existingItem.total = price * (existingItem.qty || 1);
    this.updateCart(items);
    console.log(`💰 Updated ${existingItem.name} price=${price}`);
  }

  isMeasurementProduct(product: any): boolean {
    if (!product || !product.name && !product.item_name) return false;
    const name = (product.name || product.item_name || '').toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }

  hasMeasurementVariant(product: any, width: number, height: number, unit: string): boolean {
    const items = this.getCart();
    const productId = product.id || product._id || product.name;
    return items.some(item => {
      if (!item.measurement) return false;
      const itemId = item.id || item._id || item.name;
      return itemId === productId &&
             item.measurement.width === width &&
             item.measurement.height === height &&
             item.measurement.unit === unit;
    });
  }

  getProductVariants(product: any): any[] {
    const items = this.getCart();
    const productId = product.id || product._id || product.name;
    return items.filter(item => {
      const itemId = item.id || item._id || item.name;
      return itemId === productId && item.is_measurement_product;
    });
  }

  getCartItemCount(): number {
    return this.getCart().reduce((total, item) => total + (item.qty || 1), 0);
  }

  getUniqueItemCount(): number {
    return this.getCart().length;
  }

  // ===================== HELD CART METHODS =====================

  holdCart(userId: any, holdId: number, total: any, table: any, note: string, customer: string): Observable<any> {
    const holdPayload = {
      id: holdId,
      userId: userId,
      table: table,
      cartItems: this.getCart(),
      note: note,
      total: total,
      customer: customer
    };
    return this.http.post(`${this.orderUrl}/hold_order`, holdPayload).pipe(
      tap({
        next: () => {
          this.heldOrderSubject.next();
          this.holdOrderMade.emit();
        },
        error: (error) => {
          console.error("❌ Error during holdCart request:", error);
        }
      })
    );
  }

  holdCartWithAmount(payload: any): Observable<any> {
    console.log("📤 Sending hold request with amount to backend:", payload);
    return this.http.post(`${this.orderUrl}/hold_order`, payload).pipe(
      tap({
        next: () => {
          console.log("📢 Hold request with amount successful");
          this.heldOrderSubject.next();
          this.holdOrderMade.emit();
        },
        error: (error) => {
          console.error("❌ Error during holdCartWithAmount request:", error);
        }
      })
    );
  }

  holdCartWithAmountCustomer(payload: any): Observable<any> {
    console.log("📤 Sending hold request with amount to backend:", payload);
    return this.http.post(`${this.orderUrl}/hold_order_customer`, payload).pipe(
      tap({
        next: () => {
          console.log("📢 Hold request with amount successful");
          this.heldOrderSubject.next();
          this.holdOrderMade.emit();
        },
        error: (error) => {
          console.error("❌ Error during holdCartWithAmount request:", error);
        }
      })
    );
  }

  holdCartWithPayment(holdId: any, total: number, table: string, note: string, customer: string, amountPaid: number): Observable<any> {
    const payload = {
      id: holdId,
      total: total,
      table: table,
      note: note,
      customer: customer,
      cartItems: this.getCart(),
      amount_paid: amountPaid
    };
    return this.holdCartWithAmount(payload);
  }

  holdCartWithPaymentCustomer(holdId: any, total: number, table: string, note: string, customer: string, amountPaid: number): Observable<any> {
    const payload = {
      id: holdId,
      total: total,
      table: table,
      note: note,
      customer: customer,
      cartItems: this.getCart(),
      amount_paid: amountPaid
    };
    return this.holdCartWithAmountCustomer(payload);
  }

  loadHeldCartAll(): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order_all`);
  }

  loadHeldOrder(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order/${holdId}`);
  }

  getHeldCarts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/held_orders`);
  }

  loadHeldCart(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order/${holdId}`);
  }

  trackOrder(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/track_order/${holdId}`);
  }


  removeHeldCart(holdId: number): Observable<any> {
    return this.http.delete(`${this.orderUrl}/remove_held_order/${holdId}`);
  }

  mergeSelectedOrders(orderIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.orderUrl}/merge_orders`, { order_ids: orderIds });
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/my_orders`);
  }

  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.orderUrl}/update_order_status/${orderId}`, { status: newStatus });
  }

  private generateCartItemId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ===================== UTILITY METHODS =====================

  public safeParse<T>(data: string | null, fallback: T): T {
    try {
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  // ===================== MULTI-ORDER POS METHODS =====================

  private multiOrderStorageKey = 'pos_multi_orders';
  public activeOrderId: string | null = null;

  public getMultiOrders(): any[] {
    return this.safeParse(localStorage.getItem(this.multiOrderStorageKey), []);
  }

  private saveMultiOrders(orders: any[]): void {
    localStorage.setItem(this.multiOrderStorageKey, JSON.stringify(orders));
  }

  private generateMultiOrderId(): string {
    return `POS_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  public createMultiOrder(customer: any = '', note: string = '', table: string = ''): any {
    const orders = this.getMultiOrders();
    const order = {
      local_id: this.generateMultiOrderId(),
      customer: customer,
      note: note,
      table: table,
      cartItems: [],
      total: 0,
      amount_paid: 0,
      balance: 0,
      method: 'Cash',
      status: 'open',
      created_at: new Date().toISOString()
    };
    orders.push(order);
    this.saveMultiOrders(orders);
    return order;
  }

  public saveActiveMultiOrder(): void {
    if (!this.activeOrderId) return;
    const orders = this.getMultiOrders();
    const index = orders.findIndex(order => order.local_id === this.activeOrderId);
    if (index === -1) return;
    const cartItems = this.getCart();
    orders[index].cartItems = [...cartItems];
    orders[index].total = this.calculateItemsTotal(cartItems);
    this.saveMultiOrders(orders);
    console.log('💾 Active order saved:', orders[index]);
  }

  public switchMultiOrder(localId: string): any {
    this.saveActiveMultiOrder();
    const orders = this.getMultiOrders();
    const order = orders.find(item => item.local_id === localId);
    if (!order) {
      console.warn('⚠️ Multi-order not found:', localId);
      return null;
    }
    this.activeOrderId = localId;
    this.updateCart(order.cartItems || []);
    console.log('🔄 Switched to order:', order);
    return order;
  }

  public startNewMultiOrder(customer: any = '', note: string = '', table: string = ''): any {
    this.saveActiveMultiOrder();
    const order = this.createMultiOrder(customer, note, table);
    this.activeOrderId = order.local_id;
    this.updateCart([]);
    console.log('➕ New POS order started:', order);
    return order;
  }

  public updateActiveMultiOrder(data: any): void {
    if (!this.activeOrderId) return;
    const orders = this.getMultiOrders();
    const index = orders.findIndex(order => order.local_id === this.activeOrderId);
    if (index === -1) return;
    orders[index] = { ...orders[index], ...data };
    this.saveMultiOrders(orders);
  }

  public getActiveMultiOrder(): any | null {
    if (!this.activeOrderId) return null;
    const orders = this.getMultiOrders();
    return orders.find(order => order.local_id === this.activeOrderId) || null;
  }

  public getOpenMultiOrders(): any[] {
    return this.getMultiOrders().filter(order => order.status === 'open');
  }

  private calculateItemsTotal(items: any[]): number {
    return (items || []).reduce((sum: number, item: any) => {
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 0);
      return sum + (item.total !== undefined ? Number(item.total) : price * qty);
    }, 0);
  }

  public completeMultiOrder(paymentResponse: any): any | null {
    if (!this.activeOrderId) {
      console.warn('⚠️ No active order ID to complete');
      return null;
    }
    const orders = this.getMultiOrders();
    const index = orders.findIndex(order => order.local_id === this.activeOrderId);
    if (index === -1) {
      console.warn('⚠️ Order not found:', this.activeOrderId);
      this.activeOrderId = null;
      return null;
    }
    const order = orders[index];
    const receipt = {
      ...order,
      ...paymentResponse,
      cartItems: [...(order.cartItems || [])],
      local_id: order.local_id,
      completed_at: new Date().toISOString(),
      status: 'paid',
      order_id: paymentResponse.id || paymentResponse.order_id || order.local_id,
      amount_paid: paymentResponse.amount_paid || order.amount_paid || 0,
      balance: paymentResponse.balance || 0,
      total: paymentResponse.total || order.total || 0,
      customer: paymentResponse.customer || order.customer || '',
      method: paymentResponse.method || order.method || 'Cash',
      note: paymentResponse.note || order.note || '',
      table: paymentResponse.table || order.table || ''
    };
    orders.splice(index, 1);
    this.saveMultiOrders(orders);
    this.updateCart([]);
    this.activeOrderId = null;
    console.log('✅ Multi-order completed and removed:', receipt);
    console.log(`📊 Remaining orders: ${orders.length}`);
    return receipt;
  }

  public deleteMultiOrder(localId: string): boolean {
    const orders = this.getMultiOrders();
    const index = orders.findIndex(order => order.local_id === localId);
    if (index === -1) return false;
    orders.splice(index, 1);
    this.saveMultiOrders(orders);
    if (this.activeOrderId === localId) {
      this.activeOrderId = null;
      this.updateCart([]);
    }
    return true;
  }

  public getMultiOrderCount(): number {
    return this.getOpenMultiOrders().length;
  }

  public clearAllMultiOrders(): void {
    localStorage.removeItem(this.multiOrderStorageKey);
    this.activeOrderId = null;
    this.updateCart([]);
    console.log('🧹 All multi-orders cleared');
  }

  // ===================== COMPLETED ORDERS FOR BATCH PRINTING =====================

  public getCompletedMultiOrders(): any[] {
    return this.safeParse(localStorage.getItem('pos_completed_orders'), []);
  }

  private saveCompletedMultiOrders(orders: any[]): void {
    localStorage.setItem('pos_completed_orders', JSON.stringify(orders));
  }

  public addCompletedMultiOrder(order: any): void {
    const completed = this.getCompletedMultiOrders();
    const exists = completed.some(o => o.local_id === order.local_id);
    if (!exists) {
      completed.push({
        ...order,
        completed_at: new Date().toISOString()
      });
      this.saveCompletedMultiOrders(completed);
    }
  }

  public clearCompletedMultiOrders(): void {
    localStorage.removeItem('pos_completed_orders');
  }

  public removeCompletedMultiOrder(localId: string): void {
    const completed = this.getCompletedMultiOrders();
    const filtered = completed.filter(o => o.local_id !== localId);
    this.saveCompletedMultiOrders(filtered);
  }

  // ===================== SAVED CARTS (FOR LATER RETRIEVAL) =====================

private savedCartsStorageKey = 'pos_saved_carts';

/**
 * Get all saved carts
 */
public getSavedCarts(): any[] {
  return this.safeParse(localStorage.getItem(this.savedCartsStorageKey), []);
}

/**
 * Save all saved carts
 */
private persistSavedCarts(carts: any[]): void {
  localStorage.setItem(this.savedCartsStorageKey, JSON.stringify(carts));
}

/**
 * Save current cart for later retrieval
 */
public saveCartForLater(data: {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  note?: string;
  table?: string;
  discount?: number;
  cartItems: any[];
  total: number;
  subtotal?: number;
  existingBalance?: number;
  holdOrderId?: number | null;
}): any {
  const savedCarts = this.getSavedCarts();
  
  // Check if a saved cart already exists for this customer
  const existingIndex = savedCarts.findIndex(
    (c: any) => 
      (data.customerId && c.customerId === data.customerId) ||
      (data.customerPhone && c.customerPhone === data.customerPhone)
  );

  const savedCart = {
    id: `SAVED_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    customerId: data.customerId || null,
    customerName: data.customerName || 'Walk-in Customer',
    customerPhone: data.customerPhone || '',
    note: data.note || '',
    table: data.table || '',
    discount: data.discount || 0,
    subtotal: data.subtotal || data.total || 0,
    total: data.total || 0,
    existingBalance: data.existingBalance || 0,
    holdOrderId: data.holdOrderId || null,
    cartItems: JSON.parse(JSON.stringify(data.cartItems || [])), // deep clone
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    // Update existing saved cart
    savedCart.id = savedCarts[existingIndex].id;
    savedCart.savedAt = savedCarts[existingIndex].savedAt;
    savedCarts[existingIndex] = savedCart;
  } else {
    savedCarts.push(savedCart);
  }

  this.persistSavedCarts(savedCarts);
  console.log(`💾 Cart saved for later: ${savedCart.customerName} (${savedCart.id})`);
  return savedCart;
}

/**
 * Retrieve a saved cart by ID
 */
public getSavedCartById(id: string): any | null {
  const savedCarts = this.getSavedCarts();
  return savedCarts.find((c: any) => c.id === id) || null;
}

/**
 * Retrieve saved carts for a specific customer
 */
public getSavedCartsByCustomer(customerId: string, phone?: string): any[] {
  return this.getSavedCarts().filter((c: any) =>
    (customerId && c.customerId === customerId) ||
    (phone && c.customerPhone === phone)
  );
}

/**
 * Load a saved cart into the active cart
 */
public loadSavedCart(id: string): any | null {
  const savedCart = this.getSavedCartById(id);
  if (!savedCart) {
    console.warn('⚠️ Saved cart not found:', id);
    return null;
  }

  // Replace active cart with saved cart items
  this.updateCart(savedCart.cartItems || []);
  console.log(`📂 Loaded saved cart: ${savedCart.customerName}`);
  return savedCart;
}

/**
 * Delete a saved cart
 */
public deleteSavedCart(id: string): boolean {
  const savedCarts = this.getSavedCarts();
  const filtered = savedCarts.filter((c: any) => c.id !== id);
  if (filtered.length === savedCarts.length) return false;
  this.persistSavedCarts(filtered);
  console.log(`🗑️ Deleted saved cart: ${id}`);
  return true;
}

/**
 * Clear all saved carts
 */
public clearSavedCarts(): void {
  localStorage.removeItem(this.savedCartsStorageKey);
  console.log('🧹 All saved carts cleared');
}
}