import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'checkout-list',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  sessionList:any;
  status:any;
  cartItems: any[] = [];
  total = 0;
  manager=false;
  heldCarts: any[] = [];
  selectedCartIds: number[] = [];
  user: any = null;
  showOrders: boolean = false;
  orders: any[] = [];
  createForm:FormGroup;
cashier =false;
admin=false
id:any;
displayStyle="none";

isHeldOrder: boolean = false;
  constructor(public cartService: CartService, private userService: userService,private fb:FormBuilder,private guestService:GuestService,private router:Router,
    private toatsr:ToastrService
  ) {
    this.createForm= this.fb.group({

      id : ['',Validators.required],
      id2 : ['',Validators.required],
      username:['',Validators.required],
      method :['',Validators.required],
      cashier :['',Validators.required]
    })
  }

  ngOnInit(): void {
    
    this.getUser();
    // this.loadOrders();

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
      this.getCurrentSession();
    });
  }

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.user = res;
        console.log("User Loaded:", this.user);
        this.loadHeldCarts();
        this.clearCart();
      } else {
        console.warn("User not found.");
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }



  openPopup() {
    // this.header = action;
    // this.createForm.reset();

    this.displayStyle = "block";
  }

  closePopup() {
    this.displayStyle = "none";
  }


  updateOrderStatus(orderId: number, newStatus: string) {
    this.cartService.updateOrderStatus(orderId, newStatus).subscribe(
      (response) => {
        console.log(`Order ${orderId} updated successfully:`, response);
        alert(`Order ${orderId} updated to ${newStatus}`);
        this.loadOrders();
      },
      (error) => {
        console.error(`Error updating order ${orderId}:`, error);
        alert("Failed to update order status. Please try again.");
      }
    );
  }
  increaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.increaseQty( product);
  }
  
  // Decrease quantity
  decreaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.decreaseQty( product);
  }
  removeFromCart(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.removeFromCart( product);
  }
  

  
  holdOrder(): void {
  
  
    const userId = this.cartItems 
    const holdId = this.createForm.value.id2;  // Get the hold ID from the form
    const tot =   this.total;
    // this.clearCart();
    this.cartService.holdCart(userId, holdId,tot).subscribe(
      (response) => {
        alert(`Cart is now on hold!`);
  
        this.loadHeldCarts(); // Refresh the list of held carts
       
        this.cashier=false;
        this.clearCart();
        this.total=0;
      },
      (error) => {
        console.error("Error holding cart:", error);
        alert("Failed to hold cart. Please try again.");
      }
    );
  }
  
  loadHeldCarts(): void {
  
      this.cartService.getHeldCarts().subscribe(
        (carts) => {
          this.heldCarts = carts; // Assign the resolved data
          console.log("Held Carts Loaded:", this.heldCarts);
        },
        (error) => {
          console.error("Error loading held carts:", error);
        }
      );
    
  }
loadHeldCart(cartId: any): void {
  this.createForm.patchValue({ id2: cartId });

  this.cartService.loadHeldCart(cartId).subscribe(
    (response) => {
      console.log("Cart loaded:", response);
      alert(`Loaded cart #${cartId}!`);

      if (response && response.items) {
        this.total = response.total || 0;
        this.isHeldOrder = response.one_time ? true : false;

        // ✅ Update localStorage and emit new cart via BehaviorSubject
        this.cartService.updateCart(response.items);
      } else {
        console.warn("Loaded cart does not contain items.");
        this.cartService.updateCart([]); // Clear cart
        this.total = 0;
        this.isHeldOrder = false;
      }
    },
    (error) => {
      console.error("Error loading cart:", error);
      alert("Failed to load cart. Please try again.");
      this.isHeldOrder = false;
    }
  );
}

  
 async removeHeldCart(cartId: number) {
 try{
  var res = await this.cartService.removeHeldCart( cartId);

  if (res)
  alert(`Removed cart #${cartId}!`)
    this.loadHeldCarts();

 }catch(err){
  alert(err)
 }
   

    
  }

  clearCart(): void {

   this.cartService.clearCart();
    
  }

  toggleSelection(cartId: number): void {
    if (this.selectedCartIds.includes(cartId)) {
      this.selectedCartIds = this.selectedCartIds.filter(id => id !== cartId);
    } else {
      this.selectedCartIds.push(cartId);
    }
  }

  getCart() {
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
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
  
    this.cartService.mergeSelectedOrders(this.selectedCartIds).subscribe(
      (response) => {
        alert(`Merged selected orders into the active cart!`);
        this.selectedCartIds = [];
        this.loadHeldCarts(); // Refresh held carts
      },
      (error) => {
        console.error("Error merging orders:", error);
        alert("Failed to merge orders. Please try again.");
      }
    );
  }
  

  payOrder() {
    const orderData = {
      cartItems: this.cartItems,
      total: this.total,
      id:this.createForm.value.id2,
      method : this.createForm.value.method,
      cashier :this.createForm.value.cashier
    };

    console.log("🛒 Cart Items Being Sent:", JSON.stringify(orderData.cartItems, null, 2));

    this.cartService.payOrder(orderData).subscribe(
      (response) => {
        this.clearCart();
        this.loadHeldCarts();
        this.closePopup();
        this.createForm.get('username')?.reset();
        // this.cartService.clearCart(this.user?.id);
        alert(`Payment successful! Order #${response.id} has been placed.`);

        this.printReceipts(response);
        
        this.cashier=false;
        this.admin=false
      },
      (error) => {
        console.error("Payment failed:", error);
        alert("Payment failed. Please try again.");
      }
    );
  }



  async  startSession(){
    const s ={
      date:""
    }
    try{
      var res = await this.guestService.startSession(s);
      if(res)  this.toatsr.success(null,"successful"); this.getCurrentSession();
    }catch(err) {this.toatsr.error(err)}
    
  }

  
 async  closeSession(id){
  const s ={
    id:id
  }
  try{
    var res = await this.guestService.closeSession(s);
    if(res)   this.getCurrentSession()
  }catch(err) {this.toatsr.error(err)}
  
}


  async  getCurrentSession(){
  
    try{
      var res = await this.guestService.getCurrentSession();
      if(res)  this.sessionList=res; this.status=res[0]?.status; this.id=res[0]?.id;
    }catch(err) {this.toatsr.error(err)}
    
  }
  
  payOrderTwo() {
    const orderData = {
      cartItems: this.cartItems,
      total: this.total,
      id:this.createForm.value.id,
      method : this.createForm.value.method
    };

    console.log("🛒 Cart Items Being Sent:", JSON.stringify(orderData.cartItems, null, 2));

    this.cartService.payOrderTwo(orderData).subscribe(
      (response) => {
        this.clearCart();
        this.loadHeldCarts();
        this.closePopup();
        this.createForm.get('username')?.reset();

        // this.cartService.clearCart(this.user?.id);
        alert(`Payment successful! Order #${response.id} has been placed.`);

        this.printReceipts(response);
        
        this.cashier=false;
        this.admin=false
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
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      } catch (error) {
        console.error("Error parsing order items:", error);
        items = [];
      }

      receiptWindow.document.write(`
        <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 14px;
              width: 280px;
              margin: auto;
              text-align: center;
            }
            .receipt-header {
              font-size: 18px;
              font-weight: bold;
            }
            .line {
              border-top: 1px dashed black;
              margin: 5px 0;
            }
            .items {
              text-align: left;
              width: 100%;
            }
            .total {
              font-size: 16px;
              font-weight: bold;
              text-align: right;
            }
            .footer {
              text-align: center;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">LONGFORD Royal Center</div>
          <p><strong>Address:</strong> Odeneho Kwadaso, KUMASI</p>
          <p><strong>Email:</strong> longfordroyalcentre@yahoo.com</p>
          <p><strong>Tel:</strong> 0595579928 / 0247903072 </p>
          <div class="line"></div>
          <h3>${title}</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
          <div class="line"></div>
          
          <div class="items">
            ${items.length > 0 ? items.map(item => `
              <p>${item.name || "N/A"} x${item.qty || 0} .... ₵${(parseFloat(item.price) || 0) * (parseInt(item.qty) || 0)}</p>
            `).join('') : `<p>No items found</p>`}
          </div>

          <div class="line"></div>
          <p class="total">Total: ₵${order.total}</p>
          <p class="footer">${footer}</p>
          <div class="line"></div>
          <p class="footer">Thank you for shopping with us!</p>
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

  toggleOrders() {
    this.showOrders = !this.showOrders;
  }

  viewOrderDetails(orderId: number) {
    console.log('Viewing details for order:', orderId);
  }



  async checkCashier(){
    const ask:string = this.createForm.value.username;
    this.createForm.patchValue({cashier:ask});
    const password ={
      username:ask
    }
    try{

      var res = await this.userService.findCashier(password);
      if(res) this.cashier=true; this.closePopup();

    }

    catch(err){

      alert("password is incorrect");
    }
  }



  logOut(){
    this.userService.logout();
  }






  printBill() {
    const currentDate = new Date().toLocaleString();
    // const cashierName = "John Doe"; // Replace this with dynamic cashier info if available
  
    let receiptContent = `
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; text-align: center; }
          .receipt-header { font-size: 14px; font-weight: bold; text-align: center; }
          h3 { margin-bottom: 5px; }
          p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px dashed #000; padding: 4px; text-align: left; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="receipt-header">
          <h3>LONGFORD CITY</h3>
          <p><strong>Address:</strong> KOFROM, KUMASI</p>
          <p><strong>Email:</strong> longfordroyalcentre@yahoo.com</p>
          <p>------------------------------------</p>
        </div>
        
        <p><strong>Date:</strong> ${currentDate}</p>
      
        <p>------------------------------------</p>
  
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
    `;
  
    // Append cart items to receipt
    this.cartItems.forEach(item => {
      receiptContent += `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>₵${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `;
    });
  
    // Append total and footer
    receiptContent += `
          </tbody>
        </table>
  
        <p>------------------------------------</p>
        <h4 class="text-center">Total: ₵${this.total.toFixed(2)}</h4>
        <p class="text-center">Thank you for your purchase!</p>
      </body>
      </html>
    `;
  
    // Open print window
    const printWindow = window.open('', '', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  }
  
  openSales(){
    this.router.navigate(['/daily-income'])
  }

}


