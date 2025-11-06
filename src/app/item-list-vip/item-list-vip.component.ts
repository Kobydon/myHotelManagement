import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from 'express';

@Component({
  selector: 'item-list-vip',
  templateUrl: './item-list-vip.component.html',
  styleUrls: ['./item-list-vip.component.css']
})
export class ItemListVipComponent implements OnInit {

  itemList:any;
  cartItems: any[] = [];
 user:any;
  itemId: string | null = null;
  incomeDetails: any;
 
  constructor(private guestService:GuestService,private cartService:CartService,private route:ActivatedRoute,private userService:userService) { }

  ngOnInit(): void {
    // this.getItemsList();
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  

    
    // Subscribe to route params changes
    this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id');
      console.log('Income ID:', this.itemId);
  
      if (this.itemId) {
        this.getIncomeDetails(this.itemId);
      } else {
        console.error('No income ID found in route.');
      }
    });

    this.getUser();
  }

handleCardClick(product: any) {
  if (+product.quantity === 0) return;

  const existingItem = this.getCartItem(product);
  if (existingItem) {
    this.cartService.increaseQty(product);
  } else {
    this.cartService.addToCart(product);
  }
}


  async getIncomeDetails(id: string) {
    try {
      const res = await this.guestService.getFoodVip(id);
      if (res) {
        this.itemList = res;
        console.log('Fetched income details:', this.incomeDetails);
      } else {
        console.error('No data received for the given income ID');
        // this.toastr.error('No income details found for this ID');
      }
    } catch (error) {
      console.error('Error fetching income details:', error);
      // this.toastr.error('An error occurred while fetching income details');
    }
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
    // if (!this.user[0]?.id) return;
    this.cartService.addToCart(product);
  }
  
  // Increase quantity
  increaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.increaseQty( product);
  }
  
  // Decrease quantity
  decreaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.decreaseQty( product);
  }
  
  // Remove item from cart
  removeFromCart(product: any) {
    // if (!this.user[0]?.id) return;
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

  


