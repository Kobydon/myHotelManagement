// item-list-category.component.ts - Fixed version

import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'item-list-category',
  templateUrl: './item-list-category.component.html',
  styleUrls: ['./item-list-category.component.css']
})
export class ItemListCategoryComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Data properties
  searchTerm: string = '';
  itemList: any[] = [];
  filteredItemList: any[] = [];
  cartItems: any[] = [];
  user: any;
  createForm!: FormGroup;
  itemId: string | null = null;
  incomeDetails: any;
  categoryName: string = '';
  isCartOpen: boolean = false;

  // Modal properties
  showModal: boolean = false;
  selectedProduct: any = null;
  itemDescription: string = '';
  selectedFile: File | null = null;
  selectedFileBase64: string | null = null;
  selectedFileName: string = '';
  selectedFileType: string = '';
  selectedFileSize: number = 0;

  // Subscription
  private cartSubscription: Subscription | null = null;

  // Measurement products list
  measurementProducts: string[] = [
    'SAV', 'SAV WITH LAMINATION', 'FLEXY', 'ONE WAY', 'REFLECTIVE',
    'TRANSPARENT', 'SAV PRINT & CUT', 'PP LABEL PRINT & CUT',
    'TRANSPARENT PRINT & CUT', 'BANNER WITH LAMINATION', 'LAMINATION'
  ];

  // Product icons mapping
  private productIcons: { [key: string]: string } = {
    'label': '🏷️',
    'labels': '🏷️',
    'sticker': '🏷️',
    'tag': '🏷️',
    'large format': '🖼️',
    'large_format': '🖼️',
    'large-format': '🖼️',
    'banner': '🏴',
    'billboard': '🖼️',
    'poster': '🖼️',
    'digital printing': '🖨️',
    'digital_printing': '🖨️',
    'digital-printing': '🖨️',
    'print': '🖨️',
    'printing': '🖨️',
    'dtf': '👕',
    'dtf printing': '👕',
    'dtf transfer': '👕',
    'garment': '👕',
    't-shirt': '👕',
    'clothing': '👕',
    'default': '📦'
  };

  constructor(
    private guestService: GuestService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: userService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.createForm = this.fb.group({
      find: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Subscribe to cart updates
    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      console.log('🔄 Cart updated:', items.length, 'items');
    });

    // Load cart initially
    this.cartService.loadCart();

    // Get route params
    this.route.paramMap.subscribe(params => {
      this.itemId = params.get('id');
      console.log('📂 Category ID from route:', this.itemId);
      if (this.itemId) {
        this.getIncomeDetails(this.itemId);
      } else {
        this.getItemsList();
      }
    });

    this.getUser();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // ===================== DATA FETCHING =====================

  async getIncomeDetails(id: string) {
    try {
      console.log('🔍 Fetching products for category:', id);
      const res = await this.guestService.getFood(id);
      console.log('📦 API Response:', res);
      
      if (res) {
        const data = Array.isArray(res) ? res : [res];
        this.itemList = data.map((product: any) => ({
          ...product,
          // Ensure each product has a unique identifier
          id: product.id || product._id || product.productId || Math.random().toString(36),
          showMeasurement: false,
          measurementWidth: 0,
          measurementHeight: 0,
          measurementUnit: 'inches'
        }));
        this.filteredItemList = [...this.itemList];
        if (this.itemList.length > 0) {
          this.categoryName = this.itemList[0].categoryName || this.itemList[0].category || 'Products';
        }
        console.log('✅ Loaded products:', this.itemList.length);
        this.toastr.success(`Loaded ${this.itemList.length} products`);
      } else {
        this.itemList = [];
        this.filteredItemList = [];
        this.toastr.warning('No products found in this category');
      }
    } catch (error) {
      console.error('❌ Error fetching income details:', error);
      this.itemList = [];
      this.filteredItemList = [];
      this.toastr.error('Error loading products');
    }
  }

  async getItemsList() {
    try {
      const res = await this.guestService.getItemsList();
      if (res) {
        const data = Array.isArray(res) ? res : [];
        this.itemList = data.map((product: any) => ({
          ...product,
          id: product.id || product._id || product.productId || Math.random().toString(36),
          showMeasurement: false,
          measurementWidth: 0,
          measurementHeight: 0,
          measurementUnit: 'inches'
        }));
        this.filteredItemList = [...this.itemList];
        this.categoryName = 'All Products';
        console.log('✅ Loaded all products:', this.itemList.length);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      this.itemList = [];
      this.filteredItemList = [];
    }
  }

  // ===================== PRODUCT HELPERS =====================

  getProductIcon(productName: string): string {
    if (!productName) return this.productIcons['default'];
    const name = productName.toLowerCase().trim();
    
    for (const [key, icon] of Object.entries(this.productIcons)) {
      if (name.includes(key) || key.includes(name)) {
        return icon;
      }
    }
    return this.productIcons['default'];
  }

  requiresMeasurement(product: any): boolean {
    if (!product || !product.name) return false;
    const productName = product.name.toUpperCase();
    return this.measurementProducts.some(p => productName.includes(p.toUpperCase()));
  }

  // ===================== MEASUREMENT PRODUCTS =====================

  showMeasurementInputs(product: any, event: Event): void {
    event.stopPropagation();
    // Close other measurement inputs
    this.itemList.forEach((p: any) => {
      if (p.id !== product.id) p.showMeasurement = false;
    });
    product.showMeasurement = true;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
    product.measurementUnit = 'inches';
  }

  cancelMeasurement(product: any, event: Event): void {
    event.stopPropagation();
    product.showMeasurement = false;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
  }

  addWithMeasurement(product: any, event: Event): void {
    event.stopPropagation();
    if (!product.measurementWidth || !product.measurementHeight) {
      this.toastr.warning('Please enter width and height');
      return;
    }

    const width = product.measurementWidth;
    const height = product.measurementHeight;
    const unit = product.measurementUnit || 'inches';
    
    console.log(`📏 Adding measurement product: ${product.name}`);
    console.log(`   Width: ${width}${unit}, Height: ${height}${unit}`);
    
    // Add to cart with measurement
    this.cartService.addMeasurementToCart(product, width, height, unit);
    
    this.toastr.success(`${product.name} added to cart with measurements`);
    product.showMeasurement = false;
    product.measurementWidth = 0;
    product.measurementHeight = 0;
  }

  // ===================== MODAL METHODS =====================

  openAddToCartModal(product: any) {
    if (+product.quantity === 0) {
      this.toastr.warning('Product is out of stock');
      return;
    }
    
    this.selectedProduct = product;
    this.itemDescription = '';
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    this.selectedFileName = '';
    this.selectedFileType = '';
    this.selectedFileSize = 0;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showModal = false;
    this.selectedProduct = null;
    this.itemDescription = '';
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    this.selectedFileName = '';
    this.selectedFileType = '';
    this.selectedFileSize = 0;
    document.body.style.overflow = 'auto';
  }

  // ===================== FILE UPLOAD =====================

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('File size must be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Please upload PDF, JPG, PNG, GIF, or DOC files');
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.selectedFileType = file.type;
    this.selectedFileSize = file.size;

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedFileBase64 = e.target.result;
      this.toastr.success('File attached successfully');
      console.log('📎 File converted to Base64:', file.name);
    };
    reader.onerror = (error) => {
      console.error('Error converting file to Base64:', error);
      this.toastr.error('Error reading file');
    };
    reader.readAsDataURL(file);
    
    this.fileInput.nativeElement.value = '';
  }

  removeSelectedFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.selectedFileBase64 = null;
    this.selectedFileName = '';
    this.selectedFileType = '';
    this.selectedFileSize = 0;
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ===================== ADD TO CART =====================

  addToCartWithDetails() {
    if (!this.selectedProduct) {
      this.toastr.error('No product selected');
      return;
    }

    console.log('🛒 Adding product to cart:', this.selectedProduct);
    console.log('📝 Description:', this.itemDescription);
    console.log('📎 Attachment:', this.selectedFileBase64 ? 'Yes' : 'No');

    // Use the product's ID, fallback to name if ID is missing
    const productId = this.selectedProduct.id || this.selectedProduct._id || this.selectedProduct.name;

    // Create a clean copy of the product for cart
    const productToAdd = {
      id: productId,
      name: this.selectedProduct.name,
      price: this.selectedProduct.price || 0,
      family  : this.selectedProduct.family ,
      category:this.selectedProduct.category, 
      quantity: this.selectedProduct.quantity || 0,
      description: this.itemDescription.trim() || '',
      attachment: this.selectedFileBase64 ? {
        base64: this.selectedFileBase64,
        name: this.selectedFileName,
        type: this.selectedFileType,
        size: this.selectedFileSize
      } : null,
      qty: 1,
      total: this.selectedProduct.price || 0
    };

    // Remove temporary UI properties
    const cleanProduct = { ...productToAdd };
    delete (cleanProduct as any).showMeasurement;
    delete (cleanProduct as any).measurementWidth;
    delete (cleanProduct as any).measurementHeight;
    delete (cleanProduct as any).measurementUnit;

    console.log('📦 Clean product to add:', cleanProduct);

    try {
      // Add to cart using the service
      this.cartService.addToCart(cleanProduct);
      
      // Show success message
      let message = `${this.selectedProduct.name} added to cart`;
      if (this.itemDescription.trim() && this.selectedFileBase64) {
        message += ' with description and attachment';
      } else if (this.itemDescription.trim()) {
        message += ' with description';
      } else if (this.selectedFileBase64) {
        message += ' with attachment';
      }
      this.toastr.success(message);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.toastr.error('Error adding item to cart');
    }
    
    this.closeModal();
  }

  // ===================== CART OPERATIONS =====================

  getCartItem(product: any) {
    if (!product) return null;
    // Try to match by ID first, then by name
    const productId = product.id || product._id || product.name;
    return this.cartItems.find(item => {
      const itemId = item.id || item._id || item.name;
      return itemId === productId;
    });
  }

  addToCart(product: any) {
    if (+product.quantity === 0) {
      this.toastr.warning('Product is out of stock');
      return;
    }
    this.openAddToCartModal(product);
  }

  increaseQty(product: any) {
    if (!product) return;
    this.cartService.increaseQty(product);
  }

  decreaseQty(product: any) {
    if (!product) return;
    this.cartService.decreaseQty(product);
  }

  removeFromCart(product: any) {
    if (!product) return;
    this.cartService.removeFromCart(product);
    this.toastr.info(`${product.name} removed from cart`);
  }

  removeAttachmentFromCart(item: any) {
    if (!item || !item.id) return;
    
    // Get current cart
    const currentItems = this.cartService.getCart();
    const index = currentItems.findIndex(i => i.id === item.id);
    
    if (index !== -1) {
      // Remove attachment
      currentItems[index].attachment = null;
      // Update cart
      this.cartService.updateCart(currentItems);
      this.toastr.info('Attachment removed from item');
    }
  }

  // ===================== CART SIDEBAR =====================

  openCart() {
    this.isCartOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.isCartOpen = false;
    document.body.style.overflow = 'auto';
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const qty = item.qty || 1;
      return total + (price * qty);
    }, 0);
  }

  proceedToCheckout() {
    this.closeCart();
    this.router.navigate(['/checkout']);
  }

  // ===================== NAVIGATION =====================

  goBack() {
    this.router.navigate(['/customer-category']);
  }

  // ===================== SEARCH =====================

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredItemList = [...this.itemList];
    } else {
      this.filteredItemList = this.itemList.filter(product =>
        product.name.toLowerCase().includes(term)
      );
    }
  }

  // ===================== USER =====================

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) this.user = res;
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }
}