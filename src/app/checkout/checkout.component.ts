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
displayStyleManager
displayStyleCustomer;
isHeldOrder: boolean = false;
customers:any;
  constructor(public cartService: CartService, private userService: userService,private fb:FormBuilder,private guestService:GuestService,private router:Router,
    private toatsr:ToastrService
  ) {
    this.createForm= this.fb.group({

      id : ['',Validators.required],
      id2 : ['',Validators.required],
      username:['',Validators.required],
      method :['',Validators.required],
      cashier :['',Validators.required],
      table :['',Validators.required],
       customer :['',Validators.required],
       discount: [0, Validators.required],
       customer_new_id :['',Validators.required],
       firstname: ['', Validators.required],
       lastname: ['', Validators.required],
    })
  }

  ngOnInit(): void {
    
    this.getUser();
    // this.loadOrders();
    // this.getCustomers();

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
      this.getCurrentSession();
    });
   this.createForm.get('discount')?.valueChanges.subscribe(() => {
    this.calDiscount(this.createForm.value);
  });
  
  setInterval(() => {
    this.checkSessionByTime();
  }, 60000); // check every 1 minute
  }

calDiscount(formValue: any): void {
  const discount = Number(formValue.discount) || 0; // percentage
  const totalWithoutDiscount = this.cartItems.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );
  const discountAmount = (discount / 100) * totalWithoutDiscount;
  this.total = totalWithoutDiscount - discountAmount;

  // Optional: force Angular to update the view if it's not auto-detecting
  // this.changeDetectorRef.detectChanges();
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


  openPopup2() {
    // this.header = action;
    // this.createForm.reset();

    this.displayStyleManager = "block";
  }

   openPopup4() {
    // this.header = action;
    // this.createForm.reset();

    this.displayStyleCustomer= "block";
  }


  closePopup() {
    this.displayStyle = "none";
    this.displayStyleManager="none";
    this.displayStyleCustomer="none";
  }

  async addCustomer(record){
         try{
          var res = await this.guestService.addCustomer(record);
          if(res) alert("successful");
        }catch(err){alert(err)}
  }

 async getCustomers() {
  try {
    const res = await this.guestService.getCustomers();
    if (res && Array.isArray(res)) {
      this.customers = res;
    } else {
      this.customers = [];
    }
  } catch (err) {
    console.error('Error fetching customers:', err);
    alert('Failed to load customers');
  }
}

generateId() {
  try{
  const count = this.customers && this.customers.length ? this.customers.length + 1 : 1;
  this.createForm.patchValue({ customer_new_id: count });
  }catch(err){
    console.log(err);
  }
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
  removeFromCart(product: any,cartId) {
    // if (!this.user[0]?.id) return;
    this.cartService.removeFromCart( product);
    const data ={
      name:product.name,
      price:product.price


    }
    this.guestService.removeFromCart(data);
    this.admin=false;
  } 
  

  
  holdOrder(): void {
  
  
    const userId = this.cartItems 
    const holdId = this.createForm.value.id2;  // Get the hold ID from the form
    const tot =   this.total; 
   const table = this.createForm.value.table;
    // this.clearCart();
     this.printBill();
   this.cartService.holdCart(userId, holdId, tot, table).subscribe({
  next: (response) => {
    console.log('✅ holdCart response received');
    this.loadHeldCarts(); // Refresh held carts
    this.cashier = false;
    this.clearCart();
    this.total = 0;
    this.createForm.reset();
  },
  error: (error) => {
    console.error('Error holding cart:', error);
    alert('Failed to hold cart. Please try again.');
  }
});
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
      // alert(`Loaded cart #${cartId}!`);

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
loadHeldCartAll(): void {
  this.cartService.loadHeldCartAll().subscribe(
    (response: any[]) => {
      console.log("Held orders loaded:", response);

      if (Array.isArray(response) && response.length > 0) {
        // Now we're handling all orders
        this.heldCarts = response; // Store all held orders in heldCarts array

        // Optionally, you can cdralculate the total for all held carts
        this.total = this.heldCarts.reduce((sum, cart) => sum + (cart.total || 0), 0);

        this.isHeldOrder = true;

        // If needed, you can update the cart with items from any selected order
        // (or even from all orders if needed)
        // For now, let's update the cart with the items of the latest held order (the first one)
        this.cartService.updateCart(this.heldCarts.map(cart => cart.items).flat()); // Example: merging all items from held carts
      } else {
        console.warn("No held orders found.");
        this.cartService.updateCart([]);
        this.total = 0;
        this.isHeldOrder = false;
      }
    },
    (error) => {
      console.error("Error loading held orders:", error);
      alert("Failed to load held orders. Please try again.");
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
      cashier :this.createForm.value.cashier,
      table: this.createForm.value.table,
       discount:this.createForm.value.discount,
       customer:this.createForm.value.customer
    };

    console.log("🛒 Cart Items Being Sent:", JSON.stringify(orderData.cartItems, null, 2));

    this.cartService.payOrder(orderData).subscribe(
      (response) => {
        this.clearCart();
        this.loadHeldCarts();
        this.closePopup();
        this.createForm.get('username')?.reset();
        // this.cartService.clearCart(this.user?.id);
        // alert(`Payment successful! Order #${response.id} has been placed.`);

        this.printReceipts(response);
        
        this.cashier=false;
        this.admin=false
      },
      (error) => {
        let errorMessage = "Payment failed. Please try again.";

         if (error?.error?.error) {
             errorMessage = error.error.error;  // Flask sends { "error": "..." }
  }

  alert(errorMessage);
      }
    );
  }









  payOrderAll() {
    const orderData = {
      cartItems: this.cartItems,
      total: this.total,
      // id:this.createForm.value.id2,
      method : this.createForm.value.method,
      cashier :this.createForm.value.cashier,
     
      table: this.createForm.value.table,
       discount:this.createForm.value.discount,
       customer:this.createForm.value.customer
    };

    console.log("🛒 Cart Items Being Sent:", JSON.stringify(orderData.cartItems, null, 2));

    this.cartService.payOrderAll(orderData).subscribe(
      (response) => {
        this.clearCart();
        this.loadHeldCarts();
        this.closePopup();
        this.createForm.get('username')?.reset();
        // this.cartService.clearCart(this.user?.id);
        // alert(`Payment successful! Order #${response.id} has been placed.`);

        this.printReceipts(response);
        
        this.cashier=false;
        this.admin=false
      },
      (error) => {
       let errorMessage = "Payment failed. Please try again.";

  if (error?.error?.error) {
    errorMessage = error.error.error;  // Flask sends { "error": "..." }
  }

  alert(errorMessage);
      }
    );
  }


checkSessionByTime() {
  const now = new Date();
  const hour = now.getHours(); // 0–23

  // Close session at 5am
  if (hour === 5 ) {
    this.closeSession(this.createForm.value.id);
  }

  // Start session from 8am upwards
  if (hour >= 8 ) {
    this.startSession();
  }
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
      method : this.createForm.value.method,
      cashier :this.createForm.value.cashier,
      table:this.createForm.value.table,
      customer:this.createForm.value.customer
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
        let errorMessage = "Payment failed. Please try again.";

  if (error?.error?.error) {
    errorMessage = error.error.error;  // Flask sends { "error": "..." }
  }

  alert(errorMessage);
      }
    );
  }



  payOrderTwoAll() {
    const orderData = {
      cartItems: this.cartItems,
      total: this.total,
      // id:this.createForm.value.id,
      method : this.createForm.value.method,
      table:this.createForm.value.table,
      cashier:this.createForm.value.cashier,
      customer:this.createForm.value.customer
    };

    console.log("🛒 Cart Items Being Sent:", JSON.stringify(orderData.cartItems, null, 2));

    this.cartService.payOrderTwoAll(orderData).subscribe(
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
       let errorMessage = "Payment failed. Please try again.";

  if (error?.error?.error) {
    errorMessage = error.error.error;  // Flask sends { "error": "..." }
  }

  alert(errorMessage);
      }
    );
  }

  printReceipts(order: any) {
  let items: any[] = [];

  try {
    items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
  } catch (error) {
    console.error("Error parsing order items:", error);
    items = [];
  }

  const printWindow = window.open('', '', 'width=300,height=800');

  if (printWindow) {
    const printContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Customer Receipt</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
            }
          }

          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 13px;
            padding: 5px;
            width: 80mm;
            box-sizing: border-box;
          }

          .header {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 2px;
          }

          .info, .footer {
            text-align: center;
            margin: 2px 0;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }

          table {
            width: 100%;
            font-size: 13px;
            border-collapse: collapse;
          }

          td {
            padding: 2px 0;
            word-break: break-word;
          }

          .item-name {
            width: 60%;
          }

          .item-price {
            width: 40%;
            text-align: right;
          }

          .total {
            font-weight: bold;
            font-size: 14px;
            text-align: right;
            margin-top: 4px;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">Longford</div>
        <div class="info">Krofrom KUMASI</div>
        <div class="info">Attendant: ${this.user[0]?.firstname +' '+ this.user[0]?.lastname}</div>
        <div class="line"></div>
        <div class="info"><strong>Customer Receipt</strong></div>
        <div class="info">Order ID: ${order.id}</div>
        <div class="info">Date: ${new Date(order.created_at).toLocaleString()}</div>
        <div class="line"></div>

        <table>
          ${items.map(item => `
            <tr>
              <td class="item-name">${item.name || 'N/A'}</td>
              <td class="item-price">
                ₵${parseFloat(item.price).toFixed(2)} x${item.qty}<br>
                = ₵${((+item.price || 0) * (+item.qty || 0)).toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </table>

        <div class="line"></div>
        <div class="total">Total: ₵${parseFloat(order.total).toFixed(2)}</div>
        <div class="line"></div>
        <div class="footer">Keep this as your proof of purchase.</div>
        <div class="footer">Thank you!</div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  } else {
    console.error('Failed to open print window');
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

      alert("username is incorrect");
    }
  }



  
  async checkManager(){
    const ask:string = this.createForm.value.username;
    this.createForm.patchValue({cashier:ask});
    const password ={
      username:ask
    }
    try{

      var res = await this.userService.findManager(password);
      if(res) this.admin=true; this.closePopup();

    }

    catch(err){

      alert("username is incorrect");
    }
  }



  logOut(){
    this.userService.logout();
  }
 printBill() {
  const currentDate = new Date().toLocaleString();

  const printWindow = window.open('', '', 'width=300,height=800');

  if (printWindow) {
    let receiptContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>INVOICE</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
            }
          }

          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 13px;
            padding: 5px;
            width: 80mm;
            box-sizing: border-box;
          }

          .header {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 4px;
          }

          .info {
            text-align: center;
            font-size: 12px;
            margin: 2px 0;
          }

          .line {
            border-top: 1px dashed black;
            margin: 6px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th, td {
            padding: 2px 0;
            word-break: break-word;
          }

          th {
            text-align: left;
          }

          td:last-child, th:last-child {
            text-align: right;
          }

          .total {
            font-weight: bold;
            font-size: 14px;
            text-align: right;
            margin-top: 5px;
          }

          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">Longford city</div>
        <div class="info">Krofrom, KUMASI</div>
        <div class="info">Attendant: ${this.user[0]?.firstname +' '+ this.user[0]?.lastname}</div>
       <div class="line"> </div>
        <div class="info"><strong>INVOICE</strong></div>
        <div class="info">Date: ${currentDate}</div>
        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.cartItems.forEach(item => {
      receiptContent += `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>₵${(item.price * item.qty).toFixed(2)}</td>
        </tr>
      `;
    });

    receiptContent += `
          </tbody>
        </table>

        <div class="line"></div>
        <div class="total">Total: ₵${this.total.toFixed(2)}</div>
        <div class="line"></div>
        <div class="footer">Thank you for your purchase!</div>
        <div class="footer">-----------------------------</div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  }
}

  
  openSales(){
    this.router.navigate(['/daily-income'])
  }


  

}


