import { Component, OnInit } from '@angular/core';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
@Component({
  selector: 'view-drink-order',
  templateUrl: './view-drink-order.component.html',
  styleUrls: ['./view-drink-order.component.css']
})
export class ViewDrinkOrderComponent implements OnInit {
  temList:any;
  cartItems: any[] = [];
  user:any;
  itemList:any;
  interval:any;
  interval1:any;
  orderList:any[]
  inta:any;
  currentDate: Date = new Date();
  currentMonth: string;
  currentTime: string;
  daysInMonth: { date: number }[] = [];
  constructor(private guestService:GuestService,private cartService:CartService,private userService:userService) { }

  ngOnInit(): void {

     
    this.interval= setInterval(()=>{
      this.loadHeldOrders();

    },1000);
    this.getUser();
    this.updateTime();
    this.generateCalendar();
    this.inta= setInterval(() => this.updateTime(), 1000);


    this.interval1= setInterval(()=>{
       this.getOrders();

    },1000);
 

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
      const res = await this.guestService.getHeldOrdersDrinks();
      if (res) {
        this.itemList = res.map(order => ({
          ...order,
          items: typeof order.items === "string" ? JSON.parse(order.items) : order.items // Only parse if it's a string
        }));
        console.log("Held Orders Loaded:", this.itemList);
      }
    } catch (error) {
      console.error("Error loading held orders:", error);
    }
  }
  




  async confirmOrder(id:any){

  const order ={id:id}
    try{
      var res = await this.guestService.confirmOrder(order);
      if(res)this.loadHeldOrders();
    }catch(err){console.log(err)}



  }

  logOut(){
    this.userService.logout();
  }


}
