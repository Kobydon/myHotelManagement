import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, Subject, ReplaySubject } from 'rxjs';
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

  // List of products that require width/height calculation
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

  // ===================== CART OPERATIONS =====================

  /**
   * Check if product requires measurement (width/height)
   */
  requiresMeasurement(product: any): boolean {
    if (!product || !product.name) return false;
    const name = product.name.toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }

  /**
   * Calculate price based on product type, width, height, and unit
   */
  calculateProductPrice(product: any, width: number, height: number, unit: string): number {
    const name = product.name ? product.name.toUpperCase() : '';
    const isMeasurementProduct = this.measurementProducts.some(p => name.includes(p.toUpperCase()));
    
    if (!isMeasurementProduct) {
      return product.price;
    }

    // For measurement products
    if (unit === 'inches') {
      // Formula: width * height * price / 144
      return (width * height * product.price) / 144;
    } else if (unit === 'feet') {
      // Formula: width * height * price
      return width * height * product.price;
    }
    
    return product.price;
  }

  /**
   * Add item to cart with measurement support
   */
  addToCart(product: any, width?: number, height?: number, unit?: string) {
    const items = this.getCart();
    
    // Check if product requires measurement
    const needsMeasurement = this.requiresMeasurement(product);
    
    let calculatedPrice = product.price;
    let measurementData = null;

    if (needsMeasurement && width && height && unit) {
      // Calculate price based on formula
      calculatedPrice = this.calculateProductPrice(product, width, height, unit);
      
      measurementData = {
        width: width,
        height: height,
        unit: unit,
        area: width * height
      };
      
      console.log(`Measurement Product: ${product.name}`);
      console.log(`Width: ${width}${unit}, Height: ${height}${unit}`);
      console.log(`Calculated Price: ${calculatedPrice}`);
    }

    // Check if item already exists in cart by ID
    const existingItem = items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Item exists - update quantity and price
      existingItem.qty += 1;
      
      // If measurement product, update price and measurement data
      if (needsMeasurement && measurementData) {
        existingItem.price = calculatedPrice;
        existingItem.measurement = measurementData;
        existingItem.total = existingItem.price * existingItem.qty;
        existingItem.is_measurement_product = true;
        existingItem.original_price = product.price;
      }
      
      console.log(`✅ Updated existing item: ${product.name}, Qty: ${existingItem.qty}, Price: ${existingItem.price}`);
    } else {
      // New item - add to cart
      const newItem = { 
        ...product, 
        qty: 1, 
        description: product.description || '', 
        confirmed: null
      };
      
      // If measurement product, set calculated price
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
      console.log(`✅ Added new item: ${product.name}, Price: ${newItem.price}`);
    }
    
    this.updateCart(items);
  }

  /**
   * Add measurement product to cart (convenience method)
   */
  addMeasurementToCart(product: any, width: number, height: number, unit: string) {
    this.addToCart(product, width, height, unit);
  }

  /**
   * Update item price (for editable price)
   */
  updateItemPrice(item: any, newPrice: number) {
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
    if (!product || !product.name) return false;
    const name = product.name.toUpperCase();
    return this.measurementProducts.some(p => name.includes(p.toUpperCase()));
  }

  removeFromCart(product: any) {
    const cartItems = this.getCart().filter(item => item.id !== product.id);
    this.updateCart(cartItems);
  }

  increaseQty(product: any) {
    this.updateItemQty(product, 1);
  }

  decreaseQty(product: any) {
    this.updateItemQty(product, -1);
  }

  getTotal(): number {
    return this.getCart().reduce((sum, item) => {
      if (item.total !== undefined) {
        return sum + item.total;
      }
      return sum + item.price * item.qty;
    }, 0);
  }

  // ===================== HELD CART METHODS =====================

  /**
   * Original holdCart method - keeps 6 parameters for backward compatibility
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

    console.log("📤 Sending hold request to backend:", holdPayload);

    return this.http.post(`${this.orderUrl}/hold_order`, holdPayload).pipe(
      tap({
        next: () => {
          console.log("📢 Hold request successful — notifying heldOrder$ subscribers...");
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
   * NEW METHOD: Hold cart with amount paid support
   * This accepts a full payload including amount_paid
   */
  holdCartWithAmount(payload: any): Observable<any> {
    console.log("📤 Sending hold request with amount to backend:", payload);
    
    return this.http.post(`${this.orderUrl}/hold_order`, payload).pipe(
      tap({
        next: () => {
          console.log("📢 Hold request with amount successful — notifying heldOrder$ subscribers...");
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
   * Convenience method to hold cart with amount paid
   * This builds the payload and calls holdCartWithAmount
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

  removeHeldCart(holdId: number): Promise<any> {
    return lastValueFrom(this.http.delete(`${this.orderUrl}/remove_held_order/${holdId}`));
  }

  // ===================== CART STORAGE =====================

  clearCart() {
    this.updateCart([]);
  }

  public getCart(): any[] {
    return this.safeParse(localStorage.getItem('cart'), []);
  }

  public updateCart(items: any[]) {
    localStorage.setItem('cart', JSON.stringify(items));
    this.cartItems.next([...items]);
  }

  public updateItemQty(product: any, change: number) {
    const items = this.getCart();
    const item = items.find(i => i.id === product.id);

    if (item) {
      item.qty += change;
      
      // If measurement product, recalculate total
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

  public loadCart() {
    this.cartItems.next(this.getCart());
  }

  // ===================== UTILITY METHODS =====================

  public safeParse<T>(data: string | null, fallback: T): T {
    try {
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  // ===================== ORDER METHODS =====================

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/my_orders`);
  }

  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.orderUrl}/update_order_status/${orderId}`, { status: newStatus });
  }

  mergeSelectedOrders(orderIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.orderUrl}/merge_orders`, { order_ids: orderIds });
  }
}