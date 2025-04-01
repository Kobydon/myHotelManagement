import { Component, OnInit } from '@angular/core';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})
export class ItemListComponent implements OnInit {
itemList:any;
cartItems: any[] = [];
user:any;
  constructor(private guestService:GuestService,private cartService:CartService,private userService:userService) { }

  ngOnInit(): void {
    // this.getItemsList();
    // this.cartService.cartItems$.subscribe(items => {
    //   this.cartItems = items;
    // });

    this.getUser();
  }


  async getItemsList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getItemsList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.itemList = res;
      }
    } catch (error) {
      // this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }


  // Check if product is already in cart
  getCartItem(product: any) {
    return this.cartItems.find(item => item.name === product.name);
  }

  // Add item to cart
  addToCart(product: any) {
    // if (!this.user?.id) return;
    this.cartService.addToCart( product);
  }
  
  // Increase quantity
  increaseQty(product: any) {
    // if (!this.user?.id) return;
    this.cartService.increaseQty( product);
  }
  
  // Decrease quantity
  decreaseQty(product: any) {
    // if (!this.user?.id) return;
    this.cartService.decreaseQty( product);
  }
  
  // Remove item from cart
  removeFromCart(product: any) {
    // if (!this.user?.id) return;
    this.cartService.removeFromCart( product);
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
}
