import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
// Import JsBarcode for barcode generation
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'checkout-list',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  // Session Properties
  sessionList: any;
  status: any;
  id: any;
  
  // Cart Properties
  cartItems: any[] = [];
  total = 0;
  isHeldOrder: boolean = false;
  
  // User Properties
  user: any = null;
  cashier = false;
  admin = false;
  manager = false;
  customers: any;
  
  // Held Carts
  heldCarts: any[] = [];
  selectedCartIds: number[] = [];
  
  // Orders
  showOrders: boolean = false;
  orders: any[] = [];
  
  // Form
  createForm: FormGroup;
  
  // Modal Controls
  displayStyle = "none";
  displayStyleManager = "none";
  displayStyleCustomer = "none";
  
  // Measurement Modal Properties
  showMeasurementModal: boolean = false;
  selectedProduct: any = null;
  measurementWidth: number = 0;
  measurementHeight: number = 0;
  measurementUnit: string = 'inches';
  
  // Payment Modal Properties
  showPaymentModal: boolean = false;
  amountPaid: number = 0;
  balance: number = 0;
  existingBalance: number = 0;
  isPartialPayment: boolean = false;
  currentPaymentMethod: string = 'payOrder';
  holdOrderId: number | null = null;
  isBalancePayment: boolean = false;
  
  // Update Tracking Properties
  updatingItems: { [key: number]: boolean } = {};
  updatingQty: { [key: number]: boolean } = {};
  
  // Subject for debounced updates
  private descriptionUpdateSubject = new Subject<{item: any, value: string, index: number}>();
  private qtyUpdateSubject = new Subject<{item: any, value: number, index: number}>();
  private descriptionSubscription: Subscription;
  private qtySubscription: Subscription;
  
  // Auto-refresh
  private refreshInterval: any;

  // Sales Report Properties
  showSalesReport: boolean = false;
  salesReport: any = null;
  isLoadingSales: boolean = false;
  salesDateFrom: string = '';
  salesDateTo: string = '';
  salesFilterType: string = 'today';
  totalSales: number = 0;
  totalOrders: number = 0;
  averageOrder: number = 0;
  uniqueCustomers: number = 0;
  totalBalance: number = 0;
  totalCollected: number = 0;

  // Search Properties
  searchTerm: string = '';
  filteredItemList: any[] = [];
  itemList: any[] = [];

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
    public cartService: CartService,
    private userService: userService,
    private fb: FormBuilder,
    private guestService: GuestService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize Form
    this.createForm = this.fb.group({
      id: [''],
      id2: [''],
      username: [''],
      method: ['Cash'],
      cashier: [''],
      table: [''],
      customer: [''],
      discount: [0],
      customer_new_id: [''],
      firstname: [''],
      lastname: [''],
      phone: [''],
      note: [''],
      description: [''],
      search_order: [''],
      email: ['']
    });

    // Setup description debounce
    this.descriptionSubscription = this.descriptionUpdateSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged((prev, curr) => 
          prev.value === curr.value && 
          prev.item.id === curr.item.id &&
          prev.index === curr.index
        )
      )
      .subscribe(({item, value, index}) => {
        this.updateDescription(item, value, index);
      });

    // Setup quantity debounce
    this.qtySubscription = this.qtyUpdateSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => 
          prev.value === curr.value && 
          prev.item.id === curr.item.id &&
          prev.index === curr.index
        )
      )
      .subscribe(({item, value, index}) => {
        this.updateItemQtyWithDebounce(item, value, index);
      });
  }

  ngOnInit(): void {
    this.getUser();
    this.getCustomers();
    this.loadHeldCarts();
    this.getCurrentSession();
    this.getItemsList();
    
    // Subscribe to cart changes
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.total = this.roundToTwoDecimals(this.cartService.getTotal());
      this.cdr.detectChanges();
    });
    
    // Watch for discount changes
    this.createForm.get('discount')?.valueChanges.subscribe(() => {
      this.calDiscount(this.createForm.value);
    });
    
    // Auto-refresh held carts every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadHeldCarts();
      }
    }, 30000);
    
    // Set default date for sales report
    this.setSalesDateFilter('today');
  }

  ngOnDestroy(): void {
    this.descriptionSubscription?.unsubscribe();
    this.qtySubscription?.unsubscribe();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===================== TRACK BY METHOD =====================

  trackByItemId(index: number, item: any): number {
    return item.id || index;
  }

  // ===================== HELPER METHODS =====================

  roundToTwoDecimals(value: number): number {
    if (isNaN(value) || value === null || value === undefined) {
      return 0;
    }
    return Math.round(value * 100) / 100;
  }

  formatCurrency(value: number): string {
    return this.roundToTwoDecimals(value).toFixed(2);
  }

  // ===================== BARCODE GENERATION =====================

  /**
   * Generate a barcode SVG for the receipt
   */
  generateBarcode(orderId: string | number): string {
    try {
      // Create a container for the barcode
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      // Generate barcode SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      // Generate the barcode using JsBarcode
      JsBarcode(svg, String(orderId), {
        format: 'CODE128',
        width: 1.2,
        height: 40,
        displayValue: true,
        fontSize: 14,
        font: 'monospace',
        textMargin: 4,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000'
      });

      // Get the SVG HTML
      const svgHTML = svg.outerHTML;
      
      // Clean up
      container.remove();

      return svgHTML;
    } catch (error) {
      console.error('Error generating barcode:', error);
      return `<div style="text-align:center;font-size:11px;font-weight:bold;">Order #${orderId}</div>`;
    }
  }

  // ===================== ITEMS LIST METHODS =====================

  async getItemsList() {
    try {
      const res = await this.guestService.getItemsList();
      if (res) {
        this.itemList = res;
        this.filteredItemList = res;
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredItemList = this.itemList;
    } else {
      this.filteredItemList = this.itemList.filter(product =>
        product.item_name.toLowerCase().includes(term)
      );
    }
  }

  matchesSearch(product: any): boolean {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return true;
    return product.item_name.toLowerCase().includes(term);
  }

  getCartItem(product: any) {
    return this.cartItems.find(item => item.id === product.id || item.name === product.item_name);
  }

  requiresMeasurement(product: any): boolean {
    if (!product || !product.item_name) return false;
    const productName = product.item_name.toUpperCase();
    return this.measurementProducts.some(p => productName.includes(p.toUpperCase()));
  }

  handleProductClick(product: any): void {
    if (+product.quantity === 0) {
      this.toastr.warning('Product is out of stock', 'Warning');
      return;
    }

    if (this.requiresMeasurement(product)) {
      this.openMeasurementModal(product);
    } else {
      this.cartService.addToCart(product);
      this.toastr.success(`${product.item_name} added to cart`, 'Success');
    }
  }

  // ===================== DESCRIPTION HANDLING =====================

  onDescriptionChange(event: any, item: any, index: number): void {
    const value = event.target.value;
    item.description = value;
    this.updatingItems[index] = true;
    this.descriptionUpdateSubject.next({item, value, index});
  }

  private updateDescription(item: any, value: string, index: number): void {
    const currentCart = [...this.cartItems];
    const itemIndex = currentCart.findIndex(i => i.id === item.id);
    
    if (itemIndex !== -1) {
      currentCart[itemIndex] = { ...currentCart[itemIndex], description: value };
      this.cartService.updateCart(currentCart);
      this.total = this.roundToTwoDecimals(this.cartService.getTotal());
    }
    
    setTimeout(() => {
      this.updatingItems[index] = false;
      this.cdr.detectChanges();
    }, 200);
  }

  // ===================== QUANTITY HANDLING =====================

  onQtyChange(event: any, item: any, index: number): void {
    const value = parseInt(event.target.value) || 1;
    if (value < 1) {
      this.toastr.warning('Quantity must be at least 1', 'Warning');
      event.target.value = 1;
      return;
    }
    
    this.updatingQty[index] = true;
    this.qtyUpdateSubject.next({item, value, index});
  }

  updateItemQtyFromInput(item: any, event: any): void {
    const newQty = parseInt(event.target.value) || 1;
    if (newQty < 1) {
      this.toastr.warning('Quantity must be at least 1', 'Warning');
      this.loadCartItems();
      return;
    }
    
    const items = this.cartService.getCart();
    const cartItem = items.find(i => i.id === item.id);
    
    if (cartItem) {
      cartItem.qty = newQty;
      if (cartItem.is_measurement_product && cartItem.measurement) {
        cartItem.total = cartItem.price * cartItem.qty;
      }
      this.cartService.updateCart(items);
      this.total = this.roundToTwoDecimals(this.cartService.getTotal());
    }
  }

  private updateItemQtyWithDebounce(item: any, value: number, index: number): void {
    const items = this.cartService.getCart();
    const cartItem = items.find(i => i.id === item.id);
    
    if (cartItem) {
      cartItem.qty = value;
      if (cartItem.is_measurement_product && cartItem.measurement) {
        cartItem.total = cartItem.price * cartItem.qty;
      }
      this.cartService.updateCart(items);
      this.total = this.roundToTwoDecimals(this.cartService.getTotal());
    }
    
    setTimeout(() => {
      this.updatingQty[index] = false;
      this.cdr.detectChanges();
    }, 200);
  }

  loadCartItems(): void {
    this.cartService.loadCart();
    this.total = this.roundToTwoDecimals(this.cartService.getTotal());
  }

  updateItemPrice(item: any, event: any): void {
    const newPrice = parseFloat(event.target.value) || 0;
    if (newPrice < 0) {
      this.toastr.warning('Price cannot be negative', 'Warning');
      event.target.value = item.price;
      return;
    }
    
    const items = this.cartService.getCart();
    const cartItem = items.find(i => i.id === item.id);
    
    if (cartItem) {
      cartItem.price = newPrice;
      if (cartItem.is_measurement_product && cartItem.measurement) {
        cartItem.total = cartItem.price * cartItem.qty;
      }
      this.cartService.updateCart(items);
      this.total = this.roundToTwoDecimals(this.cartService.getTotal());
    }
  }

  // ===================== STATUS METHODS =====================

  getStatusText(item: any): string {
    if (item.confirmed === true) {
      return 'Printed';
    } else if (item.confirmed === false) {
      return 'Processing';
    } else {
      return 'N/A';
    }
  }

  // ===================== CART OPERATIONS =====================

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  increaseQty(product: any) {
    this.cartService.increaseQty(product);
  }

  decreaseQty(product: any) {
    this.cartService.decreaseQty(product);
  }

  removeFromCart(product: any, cartId: any): void {
    this.cartService.removeFromCart(product);
    this.admin = false;
    this.cdr.detectChanges();
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.cdr.detectChanges();
  }

  // ===================== MEASUREMENT MODAL =====================

  openMeasurementModal(product: any): void {
    this.selectedProduct = product;
    this.measurementWidth = 0;
    this.measurementHeight = 0;
    this.measurementUnit = 'inches';
    this.showMeasurementModal = true;
  }

  addProductWithMeasurement(): void {
    if (!this.measurementWidth || !this.measurementHeight) {
      this.toastr.warning('Please enter both width and height', 'Warning');
      return;
    }

    if (this.measurementWidth <= 0 || this.measurementHeight <= 0) {
      this.toastr.warning('Width and height must be greater than 0', 'Warning');
      return;
    }

    this.cartService.addToCart(
      this.selectedProduct,
      this.measurementWidth,
      this.measurementHeight,
      this.measurementUnit
    );
    
    this.showMeasurementModal = false;
    this.selectedProduct = null;
    this.toastr.success('Product added to cart', 'Success');
  }

  closeMeasurementModal(): void {
    this.showMeasurementModal = false;
    this.selectedProduct = null;
  }

  // ===================== PAYMENT MODAL METHODS =====================

  openPaymentModal(paymentMethod: string = 'payOrder'): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }
    
    this.currentPaymentMethod = paymentMethod;
    
    if (this.existingBalance > 0) {
      this.amountPaid = this.existingBalance;
      this.isBalancePayment = true;
    } else {
      this.amountPaid = this.roundToTwoDecimals(this.total);
      this.isBalancePayment = false;
    }
    
    this.balance = 0;
    this.isPartialPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
  }

  calculateBalance(): void {
    const enteredAmount = this.roundToTwoDecimals(parseFloat(this.amountPaid.toString()) || 0);
    
    if (this.isBalancePayment && this.existingBalance > 0) {
      const totalDue = this.existingBalance;
      
      if (enteredAmount > totalDue) {
        this.toastr.warning('Amount cannot exceed balance', 'Warning');
        this.amountPaid = totalDue;
        this.balance = 0;
        this.isPartialPayment = false;
        return;
      }
      this.balance = this.roundToTwoDecimals(totalDue - enteredAmount);
      this.isPartialPayment = this.balance > 0;
    } else {
      const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
      
      if (enteredAmount > totalDue) {
        this.toastr.warning('Amount cannot exceed total', 'Warning');
        this.amountPaid = totalDue;
        this.balance = 0;
        this.isPartialPayment = false;
        return;
      }
      this.balance = this.roundToTwoDecimals(totalDue - enteredAmount);
      this.isPartialPayment = this.balance > 0;
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.amountPaid = 0;
    this.balance = 0;
    this.isPartialPayment = false;
    this.isBalancePayment = false;
  }

  processPayment(): void {
    if (!this.amountPaid || this.amountPaid <= 0) {
      this.toastr.warning('Please enter a valid amount', 'Warning');
      return;
    }
    
    let totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    if (this.isBalancePayment && this.existingBalance > 0) {
      totalDue = this.existingBalance;
    }
    
    if (this.amountPaid > totalDue) {
      this.toastr.warning('Amount cannot exceed total', 'Warning');
      return;
    }
    
    const orderData = {
      cartItems: this.cartItems,
      total: this.roundToTwoDecimals(this.total),
      balance_to_pay: this.existingBalance,
      amount_paid: this.roundToTwoDecimals(this.amountPaid),
      id: this.currentPaymentMethod === 'payOrderTwo' ? this.createForm.value.id2 : this.createForm.value.id,
      method: this.createForm.value.method,
      cashier: this.createForm.value.cashier,
      table: this.createForm.value.table,
      discount: this.createForm.value.discount,
      customer: this.createForm.value.customer,
      phone: this.createForm.value.phone,
      note: this.createForm.value.note,
      pay_all: this.currentPaymentMethod === 'payOrderAll' || this.currentPaymentMethod === 'payOrderTwoAll',
      is_balance_payment: this.isBalancePayment
    };

    switch(this.currentPaymentMethod) {
      case 'payOrder':
        this.cartService.payOrder(orderData).subscribe(
          (response) => this.handlePaymentSuccess(response),
          (error) => this.handlePaymentError(error)
        );
        break;
      case 'payOrderAll':
        this.cartService.payOrderAll(orderData).subscribe(
          (response) => this.handlePaymentSuccess(response),
          (error) => this.handlePaymentError(error)
        );
        break;
      case 'payOrderTwo':
        this.cartService.payOrderTwo(orderData).subscribe(
          (response) => this.handlePaymentSuccess(response),
          (error) => this.handlePaymentError(error)
        );
        break;
      case 'payOrderTwoAll':
        this.cartService.payOrderTwoAll(orderData).subscribe(
          (response) => this.handlePaymentSuccess(response),
          (error) => this.handlePaymentError(error)
        );
        break;
      default:
        this.toastr.error('Invalid payment method', 'Error');
    }
  }

  handlePaymentSuccess(response: any): void {
    const orderId = response.id || response.order_id || null;
    const balance = response.balance || 0;
    const orderResponse = response;
    
    this.clearCart();
    this.loadHeldCarts();
    this.closePopup();
    this.closePaymentModal();
    this.createForm.get('username')?.reset();
    
    this.existingBalance = 0;
    this.holdOrderId = null;
    this.isBalancePayment = false;
    
    this.printBillAfterPayment(orderResponse, orderId);
    
    this.admin = false;
    this.cashier = false;
    this.cdr.detectChanges();
    
    if (balance > 0) {
      this.toastr.success(`Payment successful! Balance: ₵${this.formatCurrency(balance)}`, 'Partial Payment');
    } else {
      this.toastr.success(`Payment successful! Order #${orderId || ''}`, 'Success');
    }
  }

  handlePaymentError(error: any): void {
    this.toastr.error(error.error?.error || 'Payment failed', 'Error');
  }

  // ===================== HELD CARTS =====================

  loadHeldCarts(): void {
    this.cartService.getHeldCarts().subscribe(
      (carts: any) => {
        if (carts && carts.orders) {
          this.heldCarts = carts.orders;
        } else if (Array.isArray(carts)) {
          this.heldCarts = carts;
        } else {
          this.heldCarts = [];
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error("Error loading held carts:", error);
        this.heldCarts = [];
      }
    );
  }

  loadHeldCart(cartId: any): void {
    this.createForm.patchValue({ id2: cartId });
    this.holdOrderId = cartId;

    this.cartService.loadHeldOrder(cartId).subscribe(
      (response) => {
        if (response && response.items) {
          this.total = this.roundToTwoDecimals(response.total || 0);
          this.isHeldOrder = response.onetime ? true : false;
          this.cartService.updateCart(response.items);
          
          this.existingBalance = response.balance ? this.roundToTwoDecimals(parseFloat(response.balance)) : 0;
          
          if (this.existingBalance > 0) {
            this.isBalancePayment = true;
          } else {
            this.isBalancePayment = false;
          }
          
          this.createForm.patchValue({
            customer: response.customer || '',
            note: response.note || '',
            table: response.table || ''
          });
          
          if (this.existingBalance > 0) {
            this.total = this.existingBalance;
          }
          
        } else {
          this.toastr.warning('Cart is empty', 'Warning');
          this.cartService.updateCart([]);
          this.total = 0;
          this.isHeldOrder = false;
          this.existingBalance = 0;
          this.holdOrderId = null;
          this.isBalancePayment = false;
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error("Error loading cart:", error);
        this.toastr.error(error.error?.error || 'Failed to load cart', 'Error');
        this.isHeldOrder = false;
        this.existingBalance = 0;
        this.holdOrderId = null;
        this.isBalancePayment = false;
      }
    );
  }

  searchItemsOrder(): void {
    const cartId = this.createForm.value.search_order;
    
    if (cartId && cartId !== '') {
      this.cartService.loadHeldOrder(parseInt(cartId)).subscribe(
        (response) => {
          if (response && response.items) {
            this.createForm.patchValue({ id2: cartId });
            this.holdOrderId = cartId;
            this.total = this.roundToTwoDecimals(response.total || 0);
            this.isHeldOrder = response.onetime ? true : false;
            this.cartService.updateCart(response.items);
            
            this.existingBalance = response.balance ? this.roundToTwoDecimals(parseFloat(response.balance)) : 0;
            
            if (this.existingBalance > 0) {
              this.isBalancePayment = true;
            } else {
              this.isBalancePayment = false;
            }
            
            this.createForm.patchValue({
              customer: response.customer || '',
              note: response.note || '',
              table: response.table || ''
            });
            
            if (this.existingBalance > 0) {
              this.toastr.info(`This order has an outstanding balance of ₵${this.formatCurrency(this.existingBalance)}`, 'Balance Due');
              this.total = this.existingBalance;
            }
            
            this.toastr.success(`Order #${cartId} loaded`, 'Success');
          } else {
            this.toastr.warning('Order not found or empty', 'Warning');
            this.cartService.updateCart([]);
            this.total = 0;
            this.isHeldOrder = false;
            this.existingBalance = 0;
            this.holdOrderId = null;
            this.isBalancePayment = false;
          }
        },
        (error) => {
          console.error("Error loading order:", error);
          this.toastr.error(error.error?.error || 'Failed to load order', 'Error');
          this.isHeldOrder = false;
          this.existingBalance = 0;
          this.holdOrderId = null;
          this.isBalancePayment = false;
        }
      );
    } else {
      this.clearCart();
    }
  }

  loadHeldCartAll(): void {
    this.cartService.loadHeldCartAll().subscribe(
      (response: any[]) => {
        if (Array.isArray(response) && response.length > 0) {
          this.heldCarts = response;
          this.total = this.heldCarts.reduce((sum, cart) => this.roundToTwoDecimals(sum + (cart.total || 0)), 0);
          this.isHeldOrder = true;
          this.cartService.updateCart(this.heldCarts.map(cart => cart.items).flat());
          this.toastr.success(`Loaded ${response.length} orders`, 'Success');
        } else {
          this.toastr.info('No held orders found', 'Info');
          this.cartService.updateCart([]);
          this.total = 0;
          this.isHeldOrder = false;
        }
        this.cdr.detectChanges();
      },
      (error) => {
        console.error("Error loading held orders:", error);
        this.toastr.error('Failed to load held orders', 'Error');
        this.isHeldOrder = false;
      }
    );
  }

  holdOrder(): void {
    const note = this.createForm.value.note;
    const tot = this.roundToTwoDecimals(this.total);
    const table = this.createForm.value.table;
    const customer = this.createForm.value.customer;
    const amountPaid = this.roundToTwoDecimals(this.amountPaid || 0);
    const holdId = this.holdOrderId || null;
    
    this.cartService.holdCartWithPayment(holdId, tot, table, note, customer, amountPaid).subscribe({
      next: (response: any) => {
        const orderId = response.id || response.order_id || null;
        const balance = this.roundToTwoDecimals(response.balance || 0);
        
        this.loadHeldCarts();
        this.clearCart();
        this.total = 0;
        this.createForm.reset();
        this.existingBalance = 0;
        this.amountPaid = 0;
        this.holdOrderId = null;
        this.isBalancePayment = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error holding cart:', error);
        this.toastr.error(error.error?.error || 'Failed to hold cart', 'Error');
      }
    });
  }

  toggleSelection(cartId: number): void {
    if (this.selectedCartIds.includes(cartId)) {
      this.selectedCartIds = this.selectedCartIds.filter(id => id !== cartId);
    } else {
      this.selectedCartIds.push(cartId);
    }
  }

  mergeSelectedOrders(): void {
    if (!this.user[0]?.id) {
      this.toastr.error('User not identified', 'Error');
      return;
    }

    if (this.selectedCartIds.length === 0) {
      this.toastr.warning('Select at least one order', 'Warning');
      return;
    }

    this.cartService.mergeSelectedOrders(this.selectedCartIds).subscribe(
      (response) => {
        this.toastr.success('Orders merged successfully', 'Success');
        this.selectedCartIds = [];
        this.loadHeldCarts();
        this.cdr.detectChanges();
      },
      (error) => {
        console.error("Error merging orders:", error);
        this.toastr.error('Failed to merge orders', 'Error');
      }
    );
  }

  // ===================== PAYMENT METHODS =====================

  payOrder() {
    this.openPaymentModal('payOrder');
  }

  payOrderAll() {
    this.openPaymentModal('payOrderAll');
  }

  payOrderTwo() {
    this.openPaymentModal('payOrderTwo');
  }

  payOrderTwoAll() {
    this.openPaymentModal('payOrderTwoAll');
  }

  // ===================== DISCOUNT =====================

  calDiscount(formValue: any): void {
    const discount = Number(formValue.discount) || 0;
    const totalWithoutDiscount = this.cartItems.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
    const discountAmount = (discount / 100) * totalWithoutDiscount;
    this.total = this.roundToTwoDecimals(totalWithoutDiscount - discountAmount);
    this.cdr.detectChanges();
  }

  // ===================== SESSION MANAGEMENT =====================

  async startSession() {
    const s = { date: "" };
    try {
      const res = await this.guestService.startSession(s);
      if (res) this.getCurrentSession();
    } catch (err) {
      this.toastr.error('Failed to start session', 'Error');
    }
  }

  async closeSession(id: any) {
    const s = { id: id };
    try {
      const res = await this.guestService.closeSession(s);
      if (res) this.getCurrentSession();
    } catch (err) {
      this.toastr.error('Failed to close session', 'Error');
    }
  }

  async getCurrentSession() {
    try {
      const res = await this.guestService.getCurrentSession();
      if (res) {
        this.sessionList = res;
        this.status = res[0]?.status;
        this.id = res[0]?.id;
      }
    } catch (err) {
      this.toastr.error('Failed to get session', 'Error');
    }
  }

  // ===================== USER MANAGEMENT =====================

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.user = res;
        this.loadHeldCarts();
        this.clearCart();
      }
    } catch (err) {
      console.error("Error loading user:", err);
      this.toastr.error('Failed to load user', 'Error');
    }
  }

  async checkCashier() {
    const ask: string = this.createForm.value.username;
    this.createForm.patchValue({ cashier: ask });
    const password = { username: ask };
    try {
      const res = await this.userService.findCashier(password);
      if (res) {
        this.cashier = true;
        this.closePopup();
        this.toastr.success('Cashier authenticated', 'Success');
      }
    } catch (err) {
      this.toastr.error('Invalid username', 'Error');
    }
  }

  async checkManager() {
    const ask: string = this.createForm.value.username;
    this.createForm.patchValue({ cashier: ask });
    const password = { username: ask };
    try {
      const res = await this.userService.findManager(password);
      if (res) {
        this.admin = true;
        this.closePopup();
        this.toastr.success('Manager authenticated', 'Success');
      }
    } catch (err) {
      this.toastr.error('Invalid username', 'Error');
    }
  }

  logOut() {
    this.cashier = false;
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  // ===================== CUSTOMER MANAGEMENT =====================

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
      this.toastr.error('Failed to load customers', 'Error');
    }
  }

  async addCustomer(record: any) {
    try {
      const res = await this.guestService.addCustomer(record);
      if (res) {
        this.toastr.success('Customer added successfully', 'Success');
        this.getCustomers();
        this.closePopup();
      }
    } catch (err) {
      this.toastr.error('Failed to add customer', 'Error');
    }
  }

  generateId() {
    try {
      const count = this.customers && this.customers.length ? this.customers.length + 1 : 1;
      this.createForm.patchValue({ customer_new_id: count });
    } catch (err) {
      console.log(err);
    }
  }

  selectCustomer(customerId: number) {
    this.createForm.patchValue({ customer: customerId });
  }

  // ===================== SALES REPORT METHODS =====================

  getSalesReport(): void {
    if (!this.salesDateFrom && !this.salesDateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }

    this.isLoadingSales = true;
    
    const payload = {
      date_from: this.salesDateFrom,
      date_to: this.salesDateTo
    };

    this.guestService.getSalesReport(payload).subscribe(
      (response: any) => {
        if (response.success) {
          this.salesReport = response;
          this.totalSales = this.roundToTwoDecimals(response.summary.total_sales);
          this.totalOrders = response.summary.total_orders;
          this.averageOrder = this.roundToTwoDecimals(response.summary.average_order);
          this.uniqueCustomers = response.summary.unique_customers || 0;
          this.totalBalance = this.roundToTwoDecimals(response.summary.total_balance || 0);
          this.totalCollected = this.roundToTwoDecimals(response.summary.total_collected || 0);
          
          this.showSalesReport = true;
        }
        this.isLoadingSales = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error getting sales report:', error);
        this.toastr.error(error.error?.error || 'Failed to get sales report', 'Error');
        this.isLoadingSales = false;
      }
    );
  }

  setSalesDateFilter(type: string): void {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch(type) {
      case 'today':
        from = new Date(today);
        to = new Date(today);
        break;
      case 'yesterday':
        from = new Date(today);
        from.setDate(today.getDate() - 1);
        to = new Date(from);
        break;
      case 'week':
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        to = new Date(today);
        break;
      case 'month':
        from = new Date(today);
        from.setDate(today.getDate() - 30);
        to = new Date(today);
        break;
      default:
        return;
    }

    this.salesDateFrom = this.formatDateInput(from);
    this.salesDateTo = this.formatDateInput(to);
    this.salesFilterType = type;
    
    this.getSalesReport();
  }

  formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleSalesReport(): void {
    this.showSalesReport = !this.showSalesReport;
    if (this.showSalesReport && !this.salesReport) {
      this.setSalesDateFilter('today');
    }
  }

  printSalesReport(): void {
    if (!this.salesReport) {
      this.toastr.warning('No report to print', 'Warning');
      return;
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      const dateRange = `${this.salesDateFrom} to ${this.salesDateTo}`;
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Sales Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .shop-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .report-title { font-size: 18px; margin: 10px 0; color: #555; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .summary-item { padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; }
            .summary-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .summary-item .value { font-size: 22px; font-weight: bold; color: #27ae60; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #2c3e50; color: white; }
            .total-row { font-weight: bold; background: #f8f9fa; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-name">Assempahfie Graphics</div>
            <div class="report-title">Sales Report</div>
            <p>Date Range: ${dateRange}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="label">Total Sales</div>
              <div class="value">₵${this.totalSales.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Total Orders</div>
              <div class="value">${this.totalOrders}</div>
            </div>
            <div class="summary-item">
              <div class="label">Average Order</div>
              <div class="value">₵${this.averageOrder.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="label">Unique Customers</div>
              <div class="value">${this.uniqueCustomers}</div>
            </div>
          </div>

          <h3>Order Details</h3>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.salesReport.orders.map((order: any) => `
                <tr>
                  <td>#${order.id}</td>
                  <td>${order.customer || 'Walk-in'}</td>
                  <td>₵${this.roundToTwoDecimals(order.total).toFixed(2)}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.paid_status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by ${this.user[0]?.firstname || ''} ${this.user[0]?.lastname || ''}</p>
            <p>© ${new Date().getFullYear()} Asempahfie Graphics - All Rights Reserved</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  // ===================== UPDATED PRINTING METHODS WITH BARCODE =====================

  printBillAfterPayment(order: any, orderId?: any): void {
    let items: any[] = [];
    
    try {
      if (order && order.items) {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      } else {
        items = this.cartItems;
      }
    } catch (error) {
      console.error("Error parsing order items:", error);
      items = this.cartItems;
    }

    const selectedCustomerId = this.createForm?.value?.customer;
    let customer = null;
    if (selectedCustomerId && this.customers) {
      customer = this.customers.find((c: any) => c.id == selectedCustomerId);
    }

    const balance = this.roundToTwoDecimals(order?.balance || 0);
    const amountPaid = this.roundToTwoDecimals(order?.amount_paid || (order?.total - balance) || this.amountPaid || this.total);
    const totalAmount = this.roundToTwoDecimals(order?.total || this.total);
    const currentDate = new Date().toLocaleString();
    const discount = this.createForm?.value?.discount || 0;
    const note = this.createForm?.value?.note || '';

    const receiptContent = this.buildReceiptHTML(
      items, 
      customer, 
      balance, 
      amountPaid, 
      totalAmount, 
      currentDate, 
      discount, 
      note, 
      orderId, 
      order
    );

    setTimeout(() => {
      this.openPrintWindow(receiptContent);
    }, 100);
  }

  buildReceiptHTML(
    items: any[], 
    customer: any, 
    balance: number, 
    amountPaid: number, 
    totalAmount: number, 
    currentDate: string, 
    discount: number, 
    note: string, 
    orderId: any, 
    order: any
  ): string {
    const orderIdString = orderId || order?.id || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; }
          }
          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 13px;
            padding: 5px;
            width: 80mm;
            box-sizing: border-box;
          }
          .header { text-align: center; margin-bottom: 2px; }
          .logo-container { text-align: center; margin-bottom: 5px; }
          .logo { max-width: 80px; height: auto; display: inline-block; }
          .shop-name { font-size: 16px; font-weight: bold; }
          .info, .footer { text-align: center; margin: 2px 0; }
          .customer-info {
            background: #f5f5f5;
            padding: 5px;
            margin: 5px 0;
            border-radius: 3px;
            font-size: 12px;
          }
          .customer-info .label { font-weight: bold; }
          .customer-info .customer-name { font-size: 14px; font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          .barcode-container {
            text-align: center;
            margin: 5px 0;
            padding: 3px 0;
            background: #ffffff;
          }
          .barcode-container svg {
            max-width: 100%;
            height: auto;
          }
          table { width: 100%; font-size: 13px; border-collapse: collapse; }
          th, td { padding: 2px 0; word-break: break-word; }
          th { text-align: left; border-bottom: 1px solid #ccc; }
          th:last-child, td:last-child { text-align: right; }
          .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 4px; }
          .balance-info { 
            text-align: right; 
            font-size: 12px; 
            margin-top: 2px;
            padding: 5px;
            background: ${(balance > 0) ? '#fff3cd' : '#d4edda'};
            border-radius: 3px;
          }
          .discount { text-align: right; font-size: 12px; margin-top: 2px; }
          .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
          .order-id { text-align: center; font-size: 12px; color: #555; }
          .note-section {
            text-align: center;
            font-size: 12px;
            margin: 5px 0;
            padding: 5px;
            background: #f9f9f9;
            border-radius: 3px;
          }
          .payment-method { text-align: right; font-size: 12px; margin-top: 2px; }
          .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-warning { background: #fff3cd; color: #856404; }
          .barcode-label {
            font-size: 9px;
            color: #666;
            text-align: center;
            margin-top: 2px;
          }
          /* Thermal printer optimization */
          @media print and (max-width: 80mm) {
            body { font-size: 12px; }
            .barcode-container svg { max-width: 70mm; }
            .customer-info { font-size: 11px; }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="logo-container">
            <img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" />
          </div>
          <div class="shop-name">Asempahfie Graphics</div>
          <div class="info">📍 Kokomlemle, Accra</div>
          <div class="info">📞 0243210009</div>
          <div class="info">📧 asempahfie@gmail.com</div>
          <div class="info">👤 Attendant: ${this.user[0]?.firstname || ''} ${this.user[0]?.lastname || ''}</div>
        </div>
        
        <div class="customer-info">
          ${customer ? `
            <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
            <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
            ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ${customer.email ? `<div><span class="label">✉️ Email:</span> ${customer.email}</div>` : ''}
          ` : `
            <div>👤 <span class="label">Customer:</span> Walk-in Customer</div>
          `}
        </div>
        
        <div class="info"><strong>🧾 PAYMENT RECEIPT</strong></div>
        <div class="order-id">Order #: ${orderIdString}</div>
        <div class="info">📅 Date: ${currentDate}</div>
        
        <!-- BARCODE SECTION -->
        <div class="barcode-container">
          ${barcodeSVG}
          <div class="barcode-label">Scan to verify order #${orderIdString}</div>
        </div>
        
        ${note ? `
          <div class="note-section">
            <strong>📝 Note:</strong> ${note}
          </div>
        ` : ''}
        
        <hr class="divider" />

        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>
                  ${item.name || item.item_name || 'N/A'}
                  ${item.description ? '<br><small style="color:#666;font-size:11px;">' + item.description + '</small>' : ''}
                  ${item.width && item.height ? '<br><small style="color:#888;font-size:10px;">📐 ' + item.width + ' x ' + item.height + ' ' + (item.unit || 'inches') + '</small>' : ''}
                </td>
                <td>${item.qty || 1}</td>
                <td>₵${((+item.price || 0) * (+item.qty || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr class="divider" />
        <div class="total">💰 Total: ₵${this.formatCurrency(totalAmount)}</div>
        
        ${discount > 0 ? `
          <div class="discount">🏷️ Discount: ${discount}%</div>
          <div class="discount">💵 Discount Amount: ₵${this.formatCurrency((discount / 100) * totalAmount)}</div>
        ` : ''}
        
        <div class="payment-method">💳 Payment Method: ${this.createForm?.value?.method || 'Cash'}</div>
        
        ${(balance > 0) ? `
          <div class="balance-info">
            💳 Amount Paid: ₵${this.formatCurrency(amountPaid)}<br>
            ⏳ Balance Due: ₵${this.formatCurrency(balance)}
            <br>
            <span class="badge badge-warning">Partial Payment</span>
          </div>
        ` : `
          <div class="balance-info" style="background: #d4edda;">
            ✅ Fully Paid: ₵${this.formatCurrency(totalAmount)}
            <br>
            <span class="badge badge-success">Paid in Full</span>
          </div>
        `}
        
        <hr class="divider" />
        
        <div class="thankyou">🙏 Thank you for your patronage!</div>
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 5px;">
          This is your official payment receipt
        </div>
        ${balance > 0 ? `
          <div class="footer" style="font-size: 10px; color: #e74c3c; font-weight: bold;">
            ⚠️ Outstanding balance of ₵${this.formatCurrency(balance)}
          </div>
          <div class="footer" style="font-size: 10px; color: #e74c3c;">
            Please settle the balance on your next visit
          </div>
        ` : ''}
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 3px;">
          Visit us again at Asempahfie Graphics
        </div>
        <div class="footer" style="font-size: 8px; color: #999;">
          This is a computer-generated receipt | ${new Date().toLocaleDateString()}
          <br>Order #${orderIdString}
        </div>
      </body>
      </html>
    `;
  }

  openPrintWindow(content: string): void {
    let printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    
    if (!printWindow) {
      printWindow = window.open('', 'printWindow', 'width=400,height=600,scrollbars=yes');
      
      if (!printWindow) {
        this.printUsingIframe(content);
        return;
      }
    }
    
    try {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
    } catch (error) {
      console.error('Error writing to print window:', error);
      this.printUsingIframe(content);
    }
  }

  printUsingIframe(content: string): void {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(content);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            iframe.remove();
          }, 1000);
        }, 200);
      } else {
        this.showPrintableDialog(content);
      }
    } catch (error) {
      console.error('Error using iframe print:', error);
      this.toastr.error('Unable to open print window. Please check your browser popup settings.', 'Error');
    }
  }

  showPrintableDialog(content: string): void {
    const printContainer = document.createElement('div');
    printContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const printContent = document.createElement('div');
    printContent.style.cssText = `
      background: white;
      max-width: 400px;
      max-height: 80vh;
      overflow: auto;
      padding: 20px;
      border-radius: 8px;
      position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      border: none;
      background: #f44336;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
    `;
    closeBtn.onclick = () => printContainer.remove();
    
    const printBtn = document.createElement('button');
    printBtn.textContent = '🖨️ Print Receipt';
    printBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    `;
    printBtn.onclick = () => {
      const printWin = window.open('', '_blank', 'width=400,height=600');
      if (printWin) {
        printWin.document.write(content);
        printWin.document.close();
        printWin.print();
        printContainer.remove();
      } else {
        alert('Please enable popups for this site or copy the receipt manually.');
        console.log('Receipt content:', content);
      }
    };
    
    const contentPreview = document.createElement('div');
    contentPreview.style.cssText = `
      max-height: 400px;
      overflow: auto;
      font-size: 12px;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      background: #f9f9f9;
    `;
    contentPreview.innerHTML = content;
    
    printContent.appendChild(closeBtn);
    printContent.appendChild(printBtn);
    printContent.appendChild(contentPreview);
    printContainer.appendChild(printContent);
    
    document.body.appendChild(printContainer);
  }

  printHoldReceipt(order: any, orderId: any, amountPaid: number, balance: number): void {
    let items: any[] = [];
    try {
      if (order && order.items) {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      } else {
        items = this.cartItems;
      }
    } catch (error) {
      console.error("Error parsing order items:", error);
      items = this.cartItems;
    }

    const orderIdString = orderId || order?.id || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);

    const printWindow = window.open('', '', 'width=300,height=800');

    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Held Order Receipt</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; }
            }
            body {
              font-family: monospace, 'Courier New', sans-serif;
              font-size: 13px;
              padding: 5px;
              width: 80mm;
              box-sizing: border-box;
            }
            .header { text-align: center; margin-bottom: 2px; }
            .logo-container { text-align: center; margin-bottom: 5px; }
            .logo { max-width: 80px; height: auto; display: inline-block; }
            .shop-name { font-size: 16px; font-weight: bold; }
            .info, .footer { text-align: center; margin: 2px 0; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .barcode-container {
              text-align: center;
              margin: 5px 0;
              padding: 3px 0;
              background: #ffffff;
            }
            .barcode-container svg {
              max-width: 100%;
              height: auto;
            }
            table { width: 100%; font-size: 13px; border-collapse: collapse; }
            td { padding: 2px 0; }
            .item-name { width: 60%; }
            .item-price { width: 40%; text-align: right; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 4px; }
            .balance-info {
              text-align: right;
              font-size: 12px;
              margin-top: 2px;
              padding: 5px;
              background: #fff3cd;
              border-radius: 3px;
            }
            .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
            .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
            .order-id { text-align: center; font-size: 12px; color: #555; }
            .hold-badge {
              background: #ffc107;
              color: #856404;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              display: inline-block;
              margin: 5px 0;
            }
            .barcode-label {
              font-size: 9px;
              color: #666;
              text-align: center;
              margin-top: 2px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="logo-container">
              <img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" />
            </div>
            <div class="shop-name">Asempahfie Graphics</div>
            <div class="info">📍 Kokomlemle, Accra</div>
            <div class="info">📞 0243210009</div>
            <div class="info">👤 Attendant: ${this.user[0]?.firstname || ''} ${this.user[0]?.lastname || ''}</div>
          </div>
          
          <div class="info"><strong>🧾 HELD ORDER RECEIPT</strong></div>
          <div class="order-id">Order #: ${orderIdString}</div>
          <div class="info">📅 Date: ${new Date().toLocaleString()}</div>
          <div style="text-align: center;">
            <span class="hold-badge">⏳ HELD ORDER</span>
          </div>
          
          <!-- BARCODE SECTION -->
          <div class="barcode-container">
            ${barcodeSVG}
            <div class="barcode-label">Order #${orderIdString}</div>
          </div>
          
          <hr class="divider" />

          <table>
            ${items.map((item: any) => `
              <tr>
                <td class="item-name">
                  ${item.name || item.item_name || 'N/A'}
                  ${item.description ? '<br><small style="color:#666;font-size:11px;">' + item.description + '</small>' : ''}
                </td>
                <td class="item-price">
                  ₵${parseFloat(item.price).toFixed(2)} x ${item.qty}<br>
                  <strong>₵${((+item.price || 0) * (+item.qty || 0)).toFixed(2)}</strong>
                </td>
              </tr>
            `).join('')}
          </table>

          <hr class="divider" />
          <div class="total">💰 Total: ₵${this.formatCurrency(order.total || 0)}</div>
          
          ${amountPaid > 0 ? `
            <div class="balance-info">
              💳 Amount Paid: ₵${this.formatCurrency(amountPaid)}<br>
              ⏳ Balance Due: ₵${this.formatCurrency(balance)}
            </div>
          ` : `
            <div class="balance-info">
              ⏳ Full Balance: ₵${this.formatCurrency(order.total || 0)}
            </div>
          `}
          
          <hr class="divider" />
          <div class="thankyou">🙏 Thank you for your purchase!</div>
          <div class="footer" style="font-size: 10px; color: #666; margin-top: 5px;">
            Please present this receipt when picking up your order
          </div>
          ${balance > 0 ? `
            <div class="footer" style="font-size: 10px; color: #e74c3c; font-weight: bold;">
              ⚠️ Balance of ₵${this.formatCurrency(balance)} is outstanding
            </div>
          ` : ''}
          <div class="footer" style="font-size: 10px; color: #666;">
            Visit us again at Asempahfie Graphics
          </div>
          <div class="footer" style="font-size: 8px; color: #999;">
            Order #${orderIdString}
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  }

  printBill(orderId?: any): void {
    const currentDate = new Date().toLocaleString();
    const selectedCustomerId = this.createForm?.value?.customer;
    let customer = null;
    if (selectedCustomerId && this.customers) {
      customer = this.customers.find((c: any) => c.id == selectedCustomerId);
    }

    const orderIdString = orderId || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);

    const printWindow = window.open('', '', 'width=300,height=800');

    if (printWindow) {
      let receiptContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>INVOICE</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; }
            }
            body {
              font-family: monospace, 'Courier New', sans-serif;
              font-size: 13px;
              padding: 5px;
              width: 80mm;
              box-sizing: border-box;
            }
            .header { text-align: center; margin-bottom: 4px; }
            .logo-container { text-align: center; margin-bottom: 5px; }
            .logo { max-width: 80px; height: auto; display: inline-block; }
            .shop-name { font-weight: bold; font-size: 16px; }
            .info { text-align: center; font-size: 12px; margin: 2px 0; }
            .customer-info {
              background: #f5f5f5;
              padding: 5px;
              margin: 5px 0;
              border-radius: 3px;
              font-size: 12px;
            }
            .customer-info .label { font-weight: bold; }
            .customer-info .customer-name { font-size: 14px; font-weight: bold; }
            .line { border-top: 1px dashed black; margin: 6px 0; }
            .barcode-container {
              text-align: center;
              margin: 5px 0;
              padding: 3px 0;
              background: #ffffff;
            }
            .barcode-container svg {
              max-width: 100%;
              height: auto;
            }
            .hold-badge {
              background: #ffc107;
              color: #856404;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              display: inline-block;
              margin: 5px 0;
            }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { padding: 2px 0; word-break: break-word; }
            th { text-align: left; }
            td:last-child, th:last-child { text-align: right; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 5px; }
            .discount { text-align: right; font-size: 12px; margin-top: 2px; }
            .footer { text-align: center; font-size: 12px; margin-top: 8px; }
            .note {
              text-align: center;
              font-size: 13px;
              margin: 5px 0;
              padding: 5px;
              background: #f9f9f9;
              border-radius: 3px;
            }
            .divider {
              border: none;
              border-top: 2px dashed #000;
              margin: 8px 0;
            }
            .thankyou {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
            }
            .barcode-label {
              font-size: 9px;
              color: #666;
              text-align: center;
              margin-top: 2px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="logo-container">
              <img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" />
            </div>
            <div class="shop-name">Assempahfie Graphics</div>
            <div class="info">📍 Kokomlemle, Accra</div>
            <div class="info">📞 0243210009</div>
            <div class="info">👤 Attendant: ${this.user[0]?.firstname + ' ' + this.user[0]?.lastname}</div>
          </div>
          
          <div class="customer-info">
            ${customer ? `
              <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
              <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
              ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ` : `
              <div>👤 <span class="label">Customer:</span> Walk-in Customer</div>
            `}
          </div>
          
          <div class="info"><strong>🧾 INVOICE</strong></div>
          <div class="info">📅 Date: ${currentDate}</div>
          ${orderId ? `
            <div class="info"><strong>Order #: ${orderId}</strong></div>
            <div style="text-align: center;">
              <span class="hold-badge">⏳ HELD ORDER</span>
            </div>
          ` : ''}
          
          <!-- BARCODE SECTION -->
          <div class="barcode-container">
            ${barcodeSVG}
            <div class="barcode-label">Order #${orderIdString}</div>
          </div>
          
          ${this.createForm?.value?.note ? `
            <div class="note">
              <strong>📝 Note:</strong> ${this.createForm.value.note}
            </div>
          ` : ''}
          
          <hr class="divider" />

          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
            </thead>
            <tbody>
      `;

      this.cartItems.forEach((item: any) => {
        receiptContent += `
          <tr>
            <td>
              ${item.name}
              ${item.description ? '<br><small style="color:#666;font-size:11px;">' + item.description + '</small>' : ''}
            </td>
            <td>${item.qty}</td>
            <td>₵${(item.price * item.qty).toFixed(2)}</td>
          </tr>
        `;
      });

      receiptContent += `
            </tbody>
          </table>

          <hr class="divider" />
          <div class="total">💰 Total: ₵${this.formatCurrency(this.total)}</div>
          ${this.createForm?.value?.discount > 0 ? `
            <div class="discount">🏷️ Discount: ${this.createForm.value.discount}%</div>
          ` : ''}
          
          <hr class="divider" />
          <div class="thankyou">🙏 Thank you for your purchase!</div>
          <div class="footer">━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="footer" style="font-size: 10px; color: #666;">
            Visit us again at Asempahfie Graphics
          </div>
          ${orderId ? `
            <div class="footer" style="font-size: 10px; color: #856404; margin-top: 5px;">
              ⏳ This order has been held. Order #${orderId}
            </div>
          ` : ''}
          <div class="footer" style="font-size: 8px; color: #999;">
            Order #${orderIdString}
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  }

  printReceipts(order: any, orderId?: any): void {
    this.printBillAfterPayment(order, orderId);
  }

  // ===================== MODALS =====================

  openPopup() {
    this.displayStyle = "block";
  }

  openPopup2() {
    this.displayStyleManager = "block";
  }

  openPopup4() {
    this.displayStyleCustomer = "block";
  }

  closePopup() {
    this.displayStyle = "none";
    this.displayStyleManager = "none";
    this.displayStyleCustomer = "none";
  }

  // ===================== NAVIGATION =====================

  openSales() {
    this.router.navigate(['/daily-income']);
  }
}