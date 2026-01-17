import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from 'express';
import { find } from 'rxjs';

@Component({
  selector: 'item-list-category',
  templateUrl: './item-list-category.component.html',
  styleUrls: ['./item-list-category.component.css']
})
export class ItemListCategoryComponent implements OnInit {

searchTerm: string = '';
itemList: any
filteredItemList: any[] = [];
 cartItems: any[] = [];
user:any;
createForm:FormGroup
 itemId: string | null = null;
 incomeDetails: any;

 
   constructor(private guestService:GuestService,private cartService:CartService,private route:ActivatedRoute,private userService:userService,private fb:FormBuilder) { 
    this.fb.group({
      find:['',Validators.required]
    })
   }
 
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

async searchItems(term: string) {
  term = term.trim().toLowerCase();
  if (!term) {
    // optionally reload all items when input is empty
    this.itemList = await this.guestService.getItemsList();
    return;
  }

  try {
    var ad={
      find:term
    }
    const res = await this.guestService.searchItem(ad);
    if (res) {
      this.itemList = res;
    }
  } catch (error) {
    console.error('Error searching items:', error);
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
