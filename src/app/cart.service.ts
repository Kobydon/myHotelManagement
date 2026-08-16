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
  'BANNER WITH LAMINATION',
  'LAMINATION'  // ← ADDED THIS
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

  /**
   * Unified Hold & Pay endpoint
   * Holds the order and processes payment in one API call
   */
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

  /**
   * Check if product requires measurement (width/height)
   */
  requiresMeasurement(product: any): boolean {
    if (!product || !product.name && !product.item_name) return false;
    const name = (product.name || product.item_name || '').toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }
  /**
 * Update item description
 */
updateItemDescription(item: any, description: string): void {
  const items = this.getCart();
  const cartItem = items.find(i => i.id === item.id);
  
  if (cartItem) {
    cartItem.description = description;
    this.updateCart(items);
  }
}
  
  /**
   * Calculate price based on product type, width, height, and unit
   */
  calculateProductPrice(product: any, width: number, height: number, unit: string): number {
    const name = (product.name || product.item_name || '').toUpperCase();
    const isMeasurementProduct = this.measurementProducts.some(p => name.includes(p.toUpperCase()));
    
    if (!isMeasurementProduct) {
      return product.price;
    }

    if (unit === 'inches') {
      return (width * height * product.price) / 144;
    } else if (unit === 'feet') {
      return width * height * product.price;
    }
    
    return product.price;
  }

  /**
   * Add item to cart with measurement support
   */
  addToCart(product: any, width?: number, height?: number, unit?: string) {
    const items = this.getCart();
    const productName = product.name || product.item_name || '';
    const needsMeasurement = this.requiresMeasurement(product);
    
    let calculatedPrice = product.price;
    let measurementData = null;

    if (needsMeasurement && width && height && unit) {
      calculatedPrice = this.calculateProductPrice(product, width, height, unit);
      measurementData = {
        width: width,
        height: height,
        unit: unit,
        area: width * height
      };
    }

    const existingItem = items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.qty += 1;
      if (needsMeasurement && measurementData) {
        existingItem.price = calculatedPrice;
        existingItem.measurement = measurementData;
        existingItem.total = existingItem.price * existingItem.qty;
        existingItem.is_measurement_product = true;
        existingItem.original_price = product.price;
      }
    } else {
      const newItem = { 
        ...product, 
        qty: 1, 
        description: product.description || '', 
        confirmed: null,
        name: productName
      };
      
      if (needsMeasurement && measurementData) {
        newItem.price = calculatedPrice;
        newItem.original_price = product.price;
        newItem.total = calculatedPrice * 1;
        newItem.is_measurement_product = true;
        newItem.measurement = measurementData;
      } else {
        newItem.total = product.price * 1;
      }
      
      items.push(newItem);
    }
    
    this.updateCart(items);
  }

  /**
   * Increase quantity of an item in cart
   */
  increaseQty(product: any): void {
    this.updateItemQty(product, 1);
  }

  /**
   * Decrease quantity of an item in cart
   */
  decreaseQty(product: any): void {
    this.updateItemQty(product, -1);
  }

  /**
   * Update item quantity by a specific amount
   */
  public updateItemQty(product: any, change: number): void {
    const items = this.getCart();
    const item = items.find(i => i.id === product.id);

    if (item) {
      item.qty += change;
      
      if (item.is_measurement_product && item.measurement) {
        item.total = item.price * item.qty;
      }
      
      if (item.qty <= 0) {
        this.removeFromCart(product);
        return;
      }
    }
    this.updateCart(items);
  }

  /**
   * Remove an item from cart
   */
  removeFromCart(product: any): void {
    const cartItems = this.getCart().filter(item => item.id !== product.id);
    this.updateCart(cartItems);
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    this.updateCart([]);
  }

  /**
   * Get total amount of all items in cart
   */
  getTotal(): number {
    return this.getCart().reduce((sum, item) => {
      if (item.total !== undefined) {
        return sum + item.total;
      }
      return sum + (item.price || 0) * (item.qty || 0);
    }, 0);
  }

  /**
   * Get current cart items
   */
  public getCart(): any[] {
    return this.safeParse(localStorage.getItem('cart'), []);
  }

  /**
   * Update cart with new items
   */
  public updateCart(items: any[]): void {
    localStorage.setItem('cart', JSON.stringify(items));
    this.cartItems.next([...items]);
  }

  /**
   * Load cart from localStorage
   */
  public loadCart(): void {
    this.cartItems.next(this.getCart());
  }

  /**
   * Add measurement product to cart (convenience method)
   */
  addMeasurementToCart(product: any, width: number, height: number, unit: string): void {
    this.addToCart(product, width, height, unit);
  }

  /**
   * Update item price (for editable price)
   */
  updateItemPrice(item: any, newPrice: number): void {
    const items = this.getCart();
    const existingItem = items.find(i => i.id === item.id);
    
    if (existingItem) {
      existingItem.price = newPrice;
      existingItem.total = existingItem.price * existingItem.qty;
      this.updateCart(items);
    }
  }

  /**
   * Check if product is measurement type
   */
  isMeasurementProduct(product: any): boolean {
    if (!product || !product.name && !product.item_name) return false;
    const name = (product.name || product.item_name || '').toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }

  // ===================== HELD CART METHODS =====================

  /**
   * Hold cart with user details
   */
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

  /**
   * Hold cart with amount paid
   */
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

  /**
   * Hold cart with payment for customer
   */
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

  /**
   * Convenience method to hold cart with payment
   */
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

  /**
   * Convenience method to hold cart with payment for customer
   */
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

  /**
   * Load all held carts
   */
  loadHeldCartAll(): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order_all`);
  }

  /**
   * Load a specific held order
   */
  loadHeldOrder(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order/${holdId}`);
  }

  /**
   * Get all held carts
   */
  getHeldCarts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/held_orders`);
  }

  /**
   * Load a held cart
   */
  loadHeldCart(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order/${holdId}`);
  }

  /**
   * Remove a held cart
   */
  removeHeldCart(holdId: number): Observable<any> {
    return this.http.delete(`${this.orderUrl}/remove_held_order/${holdId}`);
  }

  /**
   * Merge selected orders
   */
  mergeSelectedOrders(orderIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.orderUrl}/merge_orders`, { order_ids: orderIds });
  }

  /**
   * Get all orders
   */
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/my_orders`);
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.orderUrl}/update_order_status/${orderId}`, { status: newStatus });
  }

  // ===================== UTILITY METHODS =====================

  /**
   * Safely parse JSON data
   */
  public safeParse<T>(data: string | null, fallback: T): T {
    try {
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }
}