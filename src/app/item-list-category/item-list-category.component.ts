import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

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
  user: any;
  createForm: FormGroup;
  itemId: string | null = null;
  incomeDetails: any;

  // Measurement Products List
  measurementProducts: string[] = [
    'SAV',
    'SAV WITH LAMINATION',
    'FLEXY',
    'ONE WAY',
    'REFLECTIVE',
    'TRANSPARENT',
    'SAV PRINT & CUT',
    'PP LABEL PRINT & CUT',
    'TRANSPARENT PRINT & CUT',
    'BANNER WITH LAMINATION'
  ];

  constructor(
    private guestService: GuestService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private userService: userService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      find: ['', Validators.required]
    });
  }

  ngOnInit(): void {
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
        // Load all items if no ID
        this.getItemsList();
      }
    });

    this.getUser();
  }

  async getIncomeDetails(id: string) {
    try {
      const res = await this.guestService.getFood(id);
      if (res) {
        // Check if res is an array, if not, convert to array
        const data = Array.isArray(res) ? res : [res];
        this.itemList = data.map((product: any) => ({
          ...product,
          showMeasurement: false,
          measurementWidth: 0,
          measurementHeight: 0,
          measurementUnit: 'inches'
        }));
        console.log('Fetched income details:', this.itemList);
      } else {
        console.error('No data received for the given income ID');
        this.itemList = [];
      }
    } catch (error) {
      console.error('Error fetching income details:', error);
      this.itemList = [];
    }
  }

  async getItemsList() {
    try {
      const res = await this.guestService.getItemsList();
      if (res) {
        // Check if res is an array
        const data = Array.isArray(res) ? res : [];
        this.itemList = data.map((product: any) => ({
          ...product,
          showMeasurement: false,
          measurementWidth: 0,
          measurementHeight: 0,
          measurementUnit: 'inches'
        }));
        this.filteredItemList = this.itemList;
        console.log('Items loaded:', this.itemList.length);
      } else {
        this.itemList = [];
        this.filteredItemList = [];
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      this.itemList = [];
      this.filteredItemList = [];
    }
  }

  /**
   * Check if product requires measurement
   */
  requiresMeasurement(product: any): boolean {
    if (!product || !product.name) return false;
    const productName = product.name.toUpperCase();
    return this.measurementProducts.some(p => productName.includes(p.toUpperCase()));
  }

  /**
   * Show measurement inputs for a product
   */
  showMeasurementInputs(product: any, event: Event): void {
    event.stopPropagation();
    // Close any other open measurement inputs
    this.itemList.forEach((p: any) => {
      if (p.id !== product.id) {
        p.showMeasurement = false;
      }
    });
    product.showMeasurement = true;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
    product.measurementUnit = 'inches';
  }

  /**
   * Cancel measurement input
   */
  cancelMeasurement(product: any, event: Event): void {
    event.stopPropagation();
    product.showMeasurement = false;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
  }

  /**
   * Calculate price preview
   */
  calculatePricePreview(product: any): number {
    if (!product.measurementWidth || !product.measurementHeight) return 0;
    
    const width = product.measurementWidth;
    const height = product.measurementHeight;
    const price = product.price;
    const unit = product.measurementUnit || 'inches';
    
    if (unit === 'inches') {
      return (width * height * price) / 144;
    } else {
      return width * height * price;
    }
  }

  /**
   * Add product with measurement to cart
   */
  addWithMeasurement(product: any, event: Event): void {
    event.stopPropagation();
    
    if (!product.measurementWidth || !product.measurementHeight) {
      return;
    }

    const width = product.measurementWidth;
    const height = product.measurementHeight;
    const unit = product.measurementUnit || 'inches';
    
    // Calculate price
    let calculatedPrice = product.price;
    if (unit === 'inches') {
      calculatedPrice = (width * height * product.price) / 144;
    } else {
      calculatedPrice = width * height * product.price;
    }

    // Create measurement data
    const measurementData = {
      width: width,
      height: height,
      unit: unit,
      area: width * height
    };

    // Add to cart with measurement
    const cartItem = {
      ...product,
      price: calculatedPrice,
      total: calculatedPrice,
      measurement: measurementData,
      is_measurement_product: true
    };

    this.cartService.addToCart(cartItem);
    
    // Reset measurement inputs
    product.showMeasurement = false;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
  }

  handleCardClick(product: any) {
    if (+product.quantity === 0) return;

    // If product requires measurement, show inputs instead of adding directly
    if (this.requiresMeasurement(product)) {
      // Toggle measurement inputs
      product.showMeasurement = !product.showMeasurement;
      if (product.showMeasurement) {
        product.measurementWidth = 0;
        product.measurementHeight = 0;
        product.measurementUnit = 'inches';
        // Close other open measurement inputs
        this.itemList.forEach((p: any) => {
          if (p.id !== product.id) {
            p.showMeasurement = false;
          }
        });
      }
      return;
    }

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
      this.getItemsList();
      return;
    }

    try {
      const ad = {
        find: term
      };
      const res = await this.guestService.searchItem(ad);
      if (res) {
        // Check if res is an array
        const data = Array.isArray(res) ? res : [];
        this.itemList = data.map((product: any) => ({
          ...product,
          showMeasurement: false,
          measurementWidth: 0,
          measurementHeight: 0,
          measurementUnit: 'inches'
        }));
        console.log('Search results:', this.itemList.length);
      } else {
        this.itemList = [];
      }
    } catch (error) {
      console.error('Error searching items:', error);
      this.itemList = [];
    }
  }

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredItemList = this.itemList;
    } else {
      this.filteredItemList = this.itemList.filter(product =>
        product.name.toLowerCase().includes(term)
      );
    }
  }

  matchesSearch(product: any): boolean {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return true;
    return product.name.toLowerCase().includes(term);
  }

  // Check if product is already in cart
  getCartItem(product: any) {
    return this.cartItems.find(item => item.name === product.name);
  }

  // Add item to cart
  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  // Increase quantity
  increaseQty(product: any) {
    this.cartService.increaseQty(product);
  }

  // Decrease quantity
  decreaseQty(product: any) {
    this.cartService.decreaseQty(product);
  }

  // Remove item from cart
  removeFromCart(product: any) {
    this.cartService.removeFromCart(product);
  }

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) {
        this.user = res;
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      console.log("User loaded successfully.");
    }
  }
}