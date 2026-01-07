import { HttpClient } from '@angular/common/http';
import { Injectable,EventEmitter } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable,Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public cartItems = new BehaviorSubject<any[]>([]);
  cartItems$ = this.cartItems.asObservable();
  public apiUrl = 'http://192.168.10.20:5000/guest/create_orders';
  public apiUrl3 = 'http://192.168.10.20:5000/guest/create_orders_all';
  public apiUrl4 = 'http://192.168.10.20:5000/guest/create_orders_two_all';
  public apiUrl2 = 'http://192.168.10.20:5000/guest/create_orders_two';
  public orderUrl = 'http://192.168.10.20:5000/guest';
  
  

 private heldOrderSubject = new ReplaySubject<void>(1);
  public heldOrder$ = this.heldOrderSubject.asObservable();

 holdOrderMade = new EventEmitter<void>();

  constructor(public http: HttpClient) {
    this.loadCart();
   
  }

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


  
  addToCart(product: any) {
    const items = this.getCart();
    const existingItem = items.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    this.updateCart(items);
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
    return this.getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }
  holdCart(userId: any, holdId: number, total: any, table: any): Observable<any> {
  const holdPayload = {
    id: holdId,
    userId: userId,
    table: table,
    cartItems: this.getCart(),
    total: total
  };

  console.log("📤 Sending hold request to backend:", holdPayload);

  return this.http.post(`${this.orderUrl}/hold_order`, holdPayload).pipe(
    tap({
      next: () => {
        console.log("📢 Hold request successful — notifying heldOrder$ subscribers...");
        this.heldOrderSubject.next(); // Notifies subscribers
      },
      error: (error) => {
        console.error("❌ Error during holdCart request:", error);
      }
    })
  );
}

  loadHeldCartAll(): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order_all`);
  }


  getHeldCarts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/held_orders`);
  }

  loadHeldCart(holdId: number): Observable<any> {
    return this.http.get(`${this.orderUrl}/load_held_order/${holdId}`);
  }




  

  removeHeldCart(holdId: number) {
    return lastValueFrom(this.http.delete(`${this.orderUrl}/remove_held_order/${holdId}`));
  }

  clearCart() {
    this.updateCart([]);
  }

  public getCart(): any[] {
    return this.safeParse(localStorage.getItem('cart'), []);
  }

  public updateCart(items: any[]) {
    localStorage.setItem('cart', JSON.stringify(items));
    this.cartItems.next([...items]); // emits to subscribers
  }
  

  public updateItemQty(product: any, change: number) {
    const items = this.getCart();
    const item = items.find(i => i.id === product.id);

    if (item) {
      item.qty += change;
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

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/my_orders`);
  }

  public safeParse<T>(data: string | null, fallback: T): T {
    try {
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  updateOrderStatus(orderId: number, newStatus: string): Observable<any> {
    return this.http.put(`${this.orderUrl}/update_order_status/${orderId}`, { status: newStatus });
  }

  mergeSelectedOrders(orderIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.orderUrl}/merge_orders`, { order_ids: orderIds });
  }
}
