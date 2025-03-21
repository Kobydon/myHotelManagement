import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<any[]>([]); // Holds cart items
  cartItems$ = this.cartItems.asObservable(); // Exposes cart data as Observable
  private apiUrl = 'http://127.0.0.1:5000/guest/create_orders';

  private orderUrl = 'http://localhost:5000/guest';

  constructor(private http: HttpClient) {
    this.loadCart(); // Load saved cart when service initializes
  }

  
  payOrder(orderData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderData);
  }

  // Add item to cart
  addToCart(userId: number, product: any) {
    let items = this.getCartForUser(userId);
    let existingItem = items.find((item) => item.name === product.name);

    if (existingItem) {
      existingItem.qty += 1; // If item exists, increase quantity
    } else {
      items.push({ ...product, qty: 1 }); // Otherwise, add new item
    }

    this.cartItems.next([...items]);
    this.saveCart(userId, items);
  }

  // Remove item from cart
  removeFromCart(userId: number, product: any) {
    let items = this.getCartForUser(userId).filter((item) => item.name !== product.name);
    this.cartItems.next([...items]);
    this.saveCart(userId, items);
  }

  // Increase quantity
  increaseQty(userId: number, product: any) {
    let items = this.getCartForUser(userId);
    let item = items.find((i) => i.name === product.name);
    if (item) item.qty += 1;
    this.cartItems.next([...items]);
    this.saveCart(userId, items);
  }

  // Decrease quantity
  decreaseQty(userId: number, product: any) {
    let items = this.getCartForUser(userId);
    let item = items.find((i) => i.name === product.name);
    if (item && item.qty > 1) {
      item.qty -= 1;
    } else {
      items = items.filter((i) => i.name !== product.name);
    }
    this.cartItems.next([...items]);
    this.saveCart(userId, items);
  }

  // Get total price
  getTotal(userId: number) {
    return this.getCartForUser(userId).reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  // Save the cart for a specific user
  private saveCart(userId: number, items: any[]) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(items));
  }

  // Load the cart for a specific user
  private loadCart() {
    const userId = this.getCurrentUserId();
    const savedCart = JSON.parse(localStorage.getItem(`cart_${userId}`) || '[]');
    this.cartItems.next(savedCart);
  }

  // Get cart for a specific user
  private getCartForUser(userId: number) {
    return JSON.parse(localStorage.getItem(`cart_${userId}`) || '[]');
  }

  // Hold the current cart with a unique ID for a specific user
  holdCart(userId: number): number {
    const cartId = Date.now(); // Unique ID
    const newHeldCart = {
      id: cartId,
      userId: userId,
      items: [...this.getCartForUser(userId)],
      total: this.getTotal(userId),
    };

    let heldCarts = this.getHeldCarts(userId);
    heldCarts.push(newHeldCart);
    localStorage.setItem(`heldCarts_${userId}`, JSON.stringify(heldCarts));

    this.clearCart(userId);
    return cartId;
  }

  // Retrieve all held carts for a specific user
  getHeldCarts(userId: number): any[] {
    return JSON.parse(localStorage.getItem(`heldCarts_${userId}`) || '[]');
  }

  // Load a specific held cart by ID for a user
  loadHeldCart(userId: number, cartId: number) {
    const heldCarts = this.getHeldCarts(userId);
    const selectedCart = heldCarts.find(cart => cart.id === cartId);

    if (selectedCart) {
      this.cartItems.next(selectedCart.items);
      this.saveCart(userId, selectedCart.items);
    }
  }

  // Remove a specific held cart by ID for a user
  removeHeldCart(userId: number, cartId: number) {
    let heldCarts = this.getHeldCarts(userId);
    heldCarts = heldCarts.filter(cart => cart.id !== cartId);
    localStorage.setItem(`heldCarts_${userId}`, JSON.stringify(heldCarts));
  }

  // Merge selected held orders into the active cart for a user
  mergeSelectedOrders(userId: number, selectedCartIds: number[]) {
    let heldCarts = this.getHeldCarts(userId);
    let mergedItems: any[] = [...this.getCartForUser(userId)];

    selectedCartIds.forEach(cartId => {
      const cart = heldCarts.find(c => c.id === cartId);
      if (cart) {
        cart.items.forEach(item => {
          let existingItem = mergedItems.find(i => i.name === item.name);
          if (existingItem) {
            existingItem.qty += item.qty;
          } else {
            mergedItems.push({ ...item });
          }
        });
      }
    });

    // Update the cart with merged items
    this.cartItems.next(mergedItems);
    this.saveCart(userId, mergedItems);

    // Remove merged held carts
    heldCarts = heldCarts.filter(cart => !selectedCartIds.includes(cart.id));
    localStorage.setItem(`heldCarts_${userId}`, JSON.stringify(heldCarts));
  }

  // Clear the cart (used for checkout or cancel)
  clearCart(userId: number) {
    this.cartItems.next([]);
    this.saveCart(userId, []);
  }

  // Get the current logged-in user ID
  private getCurrentUserId(): number {
    return JSON.parse(localStorage.getItem('currentUser') || '{}').id || 0;
  }


  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.orderUrl}/my_orders`);
  }
}
