import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'view-order',
  templateUrl: './view-order.component.html',
  styleUrls: ['./view-order.component.css']
})
export class ViewOrderComponent implements OnInit {
  itemList:any;
  cartItems: any[] = [];
  user:any;
  interval:any;
  interval1:any;
  orderList:any[]
  heldOrderSub: Subscription;
  intervalId:any;
  currentDate: Date = new Date();
  currentMonth: string;
  currentTime: string;
  daysInMonth: { date: number }[] = [];
  constructor(private guestService:GuestService,private cartService:CartService,private userService:userService,
    private router:Router
  ) { }
ngOnInit(): void {
  // ✅ React to held cart event from cartService


  // ✅ Initial load
  this.loadHeldOrders();
  this.getUser();

 
  this.intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      console.log("🕒 Polling for held orders as fallback...");
      this.loadHeldOrders();
    }
  }, 7000);
  
}


  checkOrder(){
    this.router.navigate(['/todays-order']);
  }

  updateTime() {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    this.currentTime = this.currentDate.toLocaleTimeString('en-GB'); // Live time update in Ghana format
    console.log(this.currentDate);
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => ({ date: i + 1 }));


  }
  

async getOrders(){

  try{


    var  res = await this.guestService.getOrdersList();
    if (res) this.orderList=res;
  }catch(err){
    // alert(err);
    console.log(err);
  }
}

  
  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) {
        this.user = res;
        // this.loadHeldCarts();
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      console.log("User loaded successfully.");
    }
  }
  async loadHeldOrders() {
    try {
      const res = await this.guestService.getHeldOrders();
      if (res) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;

          // Optional: sort VIP items within each order
          items = items.sort((a, b) => {
            return (b.is_vip === "yes" ? 1 : 0) - (a.is_vip === "yes" ? 1 : 0);
          });

          return { ...order, items };
        });

        // Sort whole order list by VIP presence
        parsedOrders = parsedOrders.sort((a, b) => {
          const aHasVip = a.items.some(item => item.is_vip === "yes");
          const bHasVip = b.items.some(item => item.is_vip === "yes");
          return (bHasVip ? 1 : 0) - (aHasVip ? 1 : 0);
        });

        this.itemList = parsedOrders;
        console.log("Held Orders Loaded (VIP orders first):", this.itemList);
      }
    } catch (error) {
      console.error("Error loading held orders:", error);
    }
  }

  ngOnDestroy(): void {
    this.heldOrderSub?.unsubscribe();
  }

  async confirmOrder(id:any){

  const order ={id:id}
    try{
      var res = await this.guestService.confirmOrder(order);
      if(res)this.loadHeldOrders();this.getOrders();
    }catch(err){console.log(err)}



  }



  async confirmOrderTwo(id:any){
    const order ={id:id}

    try{
      var res = await this.guestService.confirmOrderTwo(order);
      if(res)this.loadHeldOrders();this.getOrders();
    }catch(err){console.log(err)}



  

  }

  logOut(){
    this.userService.logout();
  }
}
