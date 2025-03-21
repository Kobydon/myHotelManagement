import { Component, OnInit } from '@angular/core';
import { CartService } from 'app/cart.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'checkout-list',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  cartItems: any[] = [];
  total = 0;
  heldCarts: any[] = [];
  selectedCartIds: number[] = [];
  user: any;
  showOrders: boolean = false;
  orders: any[] = [];

  constructor(private cartService: CartService, private userService: userService) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal(this.user[0]?.id);
    });

    this.getUser();
    this.loadOrders();
  }

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) {
        this.user = res;
        this.loadHeldCarts();
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      console.log("User loaded successfully.");
    }
  }

  increaseQty(item: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.increaseQty(this.user[0]?.id, item);
  }

  decreaseQty(item: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.decreaseQty(this.user[0]?.id, item);
  }

  removeItem(item: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.removeFromCart(this.user[0]?.id, item);
  }

  holdOrder(): void {
    if (!this.user[0]?.id) {
      alert("User not identified. Please log in.");
      return;
    }

    const cartId = this.cartService.holdCart(this.user[0]?.id);
    alert(`Cart #${cartId} is now on hold!`);
    this.loadHeldCarts();
  }

  loadHeldCarts(): void {
    if (this.user[0]?.id) {
      this.heldCarts = this.cartService.getHeldCarts(this.user[0]?.id);
    }
  }

  loadHeldCart(cartId: number): void {
    // if (!this.user[0]?.id) return;
    this.cartService.loadHeldCart(this.user[0]?.id, cartId);
    alert(`Loaded cart #${cartId}!`);
  }

  removeHeldCart(cartId: number): void {
    // if (!this.user[0]?.id) return;
    this.cartService.removeHeldCart(this.user[0]?.id, cartId);
    alert(`Removed cart #${cartId}!`);
    this.loadHeldCarts();
  }

  clearCart(): void {
    // if (!this.user[0]?.id) return;
    this.cartService.clearCart(this.user[0]?.id);
    // alert("Cart cleared!");
    // this.getCart();
  }

  toggleSelection(cartId: number): void {
    if (this.selectedCartIds.includes(cartId)) {
      this.selectedCartIds = this.selectedCartIds.filter(id => id !== cartId);
    } else {
      this.selectedCartIds.push(cartId);
    }
  }

  getCart(){
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal(this.user[0]?.id);
    });

  }

  mergeSelectedOrders(): void {
    if (!this.user[0]?.id) {
      alert("User not identified. Please log in.");
      return;
    }

    if (this.selectedCartIds.length === 0) {
      alert("Please select at least one order to merge.");
      return;
    }

    this.cartService.mergeSelectedOrders(this.user[0]?.id, this.selectedCartIds);
    alert(`Merged selected orders into the active cart!`);
    this.selectedCartIds = [];
    this.loadHeldCarts();
  }




  payOrder() {
    // if (!this.user?.id) {
    //   alert("User not identified. Please log in.");
    //   return;
    // }

    const orderData = {
      cartItems: this.cartItems,
      total: this.total
    };

    this.cartService.payOrder(orderData).subscribe(
      (response) => {
        alert(`Payment successful! Order #${response.id} has been placed.`);
        this.printReceipts(response);
        // this.total=0;
        this.clearCart();
       
      },
      (error) => {
        console.error("Payment failed:", error);
        alert("Payment failed. Please try again.");
      }
    );
  }

  printReceipts(order: any) {
    this.printReceipt(order, "Customer Receipt", "Thank you for your purchase!");
    this.printReceipt(order, "Seller Copy", "Keep this copy for records.");
  }

  printReceipt(order: any, title: string, footer: string) {
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      let items = [];
  
      try {
        // Ensure order.items is correctly parsed
        items = JSON.parse(order.items);
        if (!Array.isArray(items)) {
          throw new Error("Parsed items is not an array");
        }
      } catch (error) {
        console.error("Error parsing order items:", error);
        items = [];
      }
  
      receiptWindow.document.write(`
        <html>
        <head><title>${title}</title></head>
        <body>
          <div style="text-align: center;">
            <h2>LONGFORD CITY</h2>
            <p><strong>Address:</strong> KOFROM, KUMASI</p>
            <p><strong>Email:</strong> longfordroyalcentre@yahoo.com</p>
            <p><strong>Tel:</strong> 0247047117</p>
            <hr>
            <h3>${title}</h3>
          </div>
  
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
  
          <table border="1" width="100%" style="border-collapse: collapse; text-align: center;">
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
            ${items.length > 0 ? items.map(item => `
              <tr>
                <td>${item.name || "N/A"}</td>
                <td>${item.qty || 0}</td>
                <td>₵${(parseFloat(item.price) || 0) * (parseInt(item.qty) || 0)}</td>
              </tr>
            `).join('') : `<tr><td colspan="3">No items found</td></tr>`}
          </table>
  
          <h3 style="text-align: right;">Total: ₵${order.total}</h3>
          <p style="text-align: center;">${footer}</p>
  
          <hr>
          <p style="text-align: center;">Thank you for shopping with us!</p>
        </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.print();
    }
  }
  
  
  


  loadOrders() {
    this.cartService.getOrders().subscribe((data: any[]) => {
      this.orders = data;
    });
  }

  // Toggle orders visibility
  toggleOrders() {
    this.showOrders = !this.showOrders;
  }

  // View specific order details
  viewOrderDetails(orderId: number) {
    console.log('Viewing details for order:', orderId);
  }

}
