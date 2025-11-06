import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from 'express';

@Component({
  selector: 'item-list-category',
  templateUrl: './item-list-category.component.html',
  styleUrls: ['./item-list-category.component.css']
})
export class ItemListCategoryComponent implements OnInit {

searchTerm: string = '';
itemList: any[] = [];
filteredItemList: any[] = [];
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
   async getIncomeDetails(id: string) {
    try {
      const res = await this.guestService.getFood(id);
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
    const res = await this.guestService.getItemsList();
    if (res) {
      this.itemList = res;
      this.filteredItemList = res; // ✅ This ensures all items show by default
    }
  } catch (error) {
    console.error('Error fetching items:', error);
  }
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



onSearchChange() {
  const term = this.searchTerm.trim().toLowerCase();

  if (!term) {
    this.filteredItemList = this.itemList; // ✅ Reset to full list
  } else {
    this.filteredItemList = this.itemList.filter(product =>
      product.name.toLowerCase().includes(term)
    );
  }
}
matchesSearch(product: any): boolean {
  const term = this.searchTerm.trim().toLowerCase();
  if (!term) return true; // show all if no search term
  return product.name.toLowerCase().includes(term);
}
  // Check if product is already in cart
  getCartItem(product: any) {
    return this.cartItems.find(item => item.name === product.name);
  }

  // Add item to cart
  addToCart(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.addToCart( product);
  }
  
  // Increase quantity
  increaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.increaseQty( product);
  }
  
  // Decrease quantity
  decreaseQty(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.decreaseQty(product);
  }
  
  // Remove item from cart
  removeFromCart(product: any) {
    // if (!this.user[0]?.id) return;
    this.cartService.removeFromCart(product);
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
