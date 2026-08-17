import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'checkout-list',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  // Session
  sessionList: any;
  status: any;
  id: any;
  
  // Cart
  cartItems: any[] = [];
  total: number = 0;
  isHeldOrder: boolean = false;
  existingBalance: number = 0;
  
  // User
  user: any = null;
  cashier: boolean = false;
  admin: boolean = false;
  manager: boolean = false;
  customers: any;
  
  // Held Carts
  heldCarts: any[] = [];
  selectedCartIds: number[] = [];
  
  // Orders
  showOrders: boolean = false;
  orders: any[] = [];
  
  // Form
  createForm: FormGroup;

filteredCustomers: any[] = [];

customerSearchTerm: string = '';
showCustomerDropdown: boolean = false;
selectedCustomer: any = null;
  // Modals
  displayStyle: string = "none";
  displayStyleManager: string = "none";
  displayStyleCustomer: string = "none";
  
  // Measurement Modal
  showMeasurementModal: boolean = false;
  selectedProduct: any = null;
  measurementWidth: number = 0;
  measurementHeight: number = 0;
  measurementUnit: string = 'inches';
  
  // Payment Modal
  showPaymentModal: boolean = false;
  amountPaid: number = 0;
  balance: number = 0;
  isPartialPayment: boolean = false;
  currentPaymentMethod: string = 'payOrder';
  holdOrderId: number | null = null;
  isBalancePayment: boolean = false;
  isFullPayment: boolean = false;
  
  // Update Tracking
  updatingItems: { [key: number]: boolean } = {};
  updatingQty: { [key: number]: boolean } = {};
  
  // Debounce Subjects
  private descriptionUpdateSubject = new Subject<{item: any, value: string, index: number}>();
  private qtyUpdateSubject = new Subject<{item: any, value: number, index: number}>();
  private descriptionSubscription: Subscription;
  private qtySubscription: Subscription;
  
  // Auto-refresh
  private refreshInterval: any;

  // Sales Report
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

  // Search
  searchTerm: string = '';
  filteredItemList: any[] = [];
  itemList: any[] = [];

  // Measurement Products
  measurementProducts: string[] = [
    'SAV', 'SAV WITH LAMINATION', 'FLEXY', 'ONE WAY',
    'REFLECTIVE', 'TRANSPARENT', 'SAV PRINT & CUT',
    'PP LABEL PRINT & CUT', 'TRANSPARENT PRINT & CUT',
    'BANNER WITH LAMINATION', 'LAMINATION'
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

    this.descriptionSubscription = this.descriptionUpdateSubject
      .pipe(debounceTime(400), distinctUntilChanged((prev, curr) => 
        prev.value === curr.value && prev.item.id === curr.item.id && prev.index === curr.index
      ))
      .subscribe(({item, value, index}) => {
        this.updateDescription(item, value, index);
      });

    this.qtySubscription = this.qtyUpdateSubject
      .pipe(debounceTime(300), distinctUntilChanged((prev, curr) => 
        prev.value === curr.value && prev.item.id === curr.item.id && prev.index === curr.index
      ))
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
    
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.recalculateTotal();
      this.cdr.detectChanges();
    });
    
    this.createForm.get('discount')?.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });
    
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadHeldCarts();
      }
    }, 30000);
    
    this.setSalesDateFilter('today');
  }

  ngOnDestroy(): void {
    this.descriptionSubscription?.unsubscribe();
    this.qtySubscription?.unsubscribe();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===================== TRACK BY =====================

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

  // ===================== TOTAL CALCULATION =====================

  recalculateTotal(): void {
    const subtotal = this.cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + (price * qty);
    }, 0);
    
    const discount = Number(this.createForm?.value?.discount) || 0;
    const discountAmount = (discount / 100) * subtotal;
    const finalTotal = subtotal - discountAmount;
    
    this.total = this.roundToTwoDecimals(finalTotal);
  }

  // ===================== DISCOUNT =====================

  calDiscount(formValue: any): void {
    this.recalculateTotal();
  }

  // ===================== BARCODE =====================

  generateBarcode(orderId: string | number): string {
    try {
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

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

      const svgHTML = svg.outerHTML;
      container.remove();
      return svgHTML;
    } catch (error) {
      console.error('Error generating barcode:', error);
      return `<div style="text-align:center;font-size:11px;font-weight:bold;">Order #${orderId}</div>`;
    }
  }

  // ===================== ITEMS LIST =====================

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

  getCartItem(product: any) {
    return this.cartItems.find(item => item.id === product.id || item.name === product.item_name);
  }

  requiresMeasurement(product: any): boolean {
    if (!product || !product.item_name) return false;
    const productName = product.item_name.toUpperCase();
    return this.measurementProducts.some(p => productName.includes(p.toUpperCase()));
  }

  handleProductClick(product: any): void {
    if (Number(product.quantity) === 0) {
      this.toastr.warning('Product is out of stock', 'Warning');
      return;
    }

    if (this.requiresMeasurement(product)) {
      this.openMeasurementModal(product);
    } else {
      this.cartService.addToCart(product);
      this.recalculateTotal();
      this.toastr.success(`${product.item_name} added to cart`, 'Success');
    }
  }

  // ===================== DESCRIPTION =====================

  onDescriptionChange(event: any, item: any, index: number): void {
    const value = event.target.value;
    item.description = value;
    this.updatingItems[index] = true;
    this.descriptionUpdateSubject.next({item, value, index});
  }

  private updateDescription(item: any, value: string, index: number): void {
    this.cartService.updateItemDescription(item, value);
    setTimeout(() => {
      this.updatingItems[index] = false;
      this.cdr.detectChanges();
    }, 200);
  }

  // ===================== QUANTITY =====================

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
      this.cartService.updateCart(items);
      this.recalculateTotal();
    }
  }

  private updateItemQtyWithDebounce(item: any, value: number, index: number): void {
    const items = this.cartService.getCart();
    const cartItem = items.find(i => i.id === item.id);
    if (cartItem) {
      cartItem.qty = value;
      this.cartService.updateCart(items);
      this.recalculateTotal();
    }
    setTimeout(() => {
      this.updatingQty[index] = false;
      this.cdr.detectChanges();
    }, 200);
  }

  loadCartItems(): void {
    this.cartService.loadCart();
    this.recalculateTotal();
  }

  // ===================== PRICE =====================

  updateItemPrice(item: any, event: any): void {
    const newPrice = parseFloat(event.target.value) || 0;
    if (newPrice < 0) {
      this.toastr.warning('Price cannot be negative', 'Warning');
      event.target.value = item.price;
      return;
    }
    this.cartService.updateItemPrice(item, newPrice);
    this.recalculateTotal();
  }

  // ===================== STATUS =====================

  getStatusText(item: any): string {
    if (item.confirmed === true) return 'Printed';
    else if (item.confirmed === false) return 'Processing';
    else if (item.confirmed === 'cutting') return 'Cutting';
    else if (item.confirmed === 'delivered') return 'Delivered';
    else if (item.confirmed === 'in_delivery') return 'In Delivery';
     else if (item.confirmed === 'ready for pickup') return 'Ready for Pickup';
    else return 'N/A';
  }

  // ===================== CART OPERATIONS =====================

  removeFromCart(product: any): void {
    this.cartService.removeFromCart(product);
    this.recalculateTotal();
    this.cdr.detectChanges();
  }

  clearCart(): void {
    if (this.cartItems.length === 0) {
      // this.toastr.info('Cart is already empty', 'Info');
      return;
    }

      this.cartService.clearCart();
      this.isHeldOrder = false;
      this.existingBalance = 0;
      this.holdOrderId = null;
      this.isBalancePayment = false;
      this.total = 0;
      // this.toastr.success('Cart cleared', 'Success');
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
    this.recalculateTotal();
    this.toastr.success('Product added to cart', 'Success');
  }

  closeMeasurementModal(): void {
    this.showMeasurementModal = false;
    this.selectedProduct = null;
  }

  // ===================== HOLD & PAY =====================

  holdAndPay(amountPaid: number = 0, isFullPayment: boolean = false): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }

    const cartTotal = this.cartService.getTotal();
    const totalDue = this.roundToTwoDecimals(cartTotal + this.existingBalance);
    
    if (isFullPayment) {
      amountPaid = totalDue;
    }

    // if (amountPaid < 0) {
    //   this.toastr.warning('Amount cannot be negative', 'Warning');
    //   return;
    // }

    // if (amountPaid > totalDue) {
    //   this.toastr.warning('Amount cannot exceed total', 'Warning');
    //   return;
    // }

    const orderData = {
      id: this.holdOrderId || null,
      cartItems: this.cartItems.map(item => ({
        ...item,
        name: item.name || item.item_name || 'Unknown Item',
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
        total: (Number(item.price) || 0) * (Number(item.qty) || 1)
      })),
      total: totalDue,
      amount_paid: amountPaid,
      customer: this.createForm.value.customer || '',
      note: this.createForm.value.note || '',
      table: this.createForm.value.table || '',
      method: this.createForm.value.method || 'Cash'
    };

    this.toastr.info('Processing order...', 'Please wait');

    this.cartService.holdAndPay(orderData).subscribe({
      next: (response: any) => {
        const orderId = response.id || response.order_id || 'N/A';
        const balance = parseFloat(response.balance) || 0;
        const amountPaidResponse = parseFloat(response.amount_paid) || amountPaid;

        if (balance <= 0) {
          this.toastr.success(`Order #${orderId} paid successfully!`, 'Payment Complete');
        } else if (amountPaidResponse > 0) {
          this.toastr.success(
            `Order #${orderId} held with balance of ₵${balance.toFixed(2)}`, 
            'Partial Payment'
          );
        } else {
          this.toastr.success(`Order #${orderId} held successfully`, 'Order Held');
        }

        this.clearCart();
        this.loadHeldCarts();
        this.holdOrderId = null;
        this.existingBalance = 0;
        this.total = 0;
      
        this.closePaymentModal();

        if (response) {
          this.printHoldAndPayReceipt(response, orderId);
            this.createForm.patchValue({ note: '' });
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error in holdAndPay:', error);
        this.toastr.error(error.error?.error || 'Failed to process order', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  quickHold(): void {
    this.holdAndPay(0, false);
  }

  holdWithPartialPayment(): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }
    
    this.currentPaymentMethod = 'holdAndPay';
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    // this.amountPaid = this.roundToTwoDecimals(totalDue / 2);
    this.isPartialPayment = false;
    this.isFullPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
  }

  processHoldAndPayFromModal(): void {
    if (!this.amountPaid || this.amountPaid <= 0) {
      this.toastr.warning('Please enter a valid amount', 'Warning');
      return;
    }

    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    
    if (this.amountPaid > totalDue) {
      this.toastr.warning('Amount cannot exceed total', 'Warning');
      return;
    }

    const amountToPay = this.amountPaid;
    const isFullPayment = this.isFullPayment;

    this.closePaymentModal();
    this.holdAndPay(amountToPay, isFullPayment);
  }

  // ===================== PAYMENT MODAL =====================

  openPaymentModal(paymentMethod: string = 'payOrder'): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }
    
    this.currentPaymentMethod = paymentMethod;
    this.isFullPayment = false;
    
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

  toggleFullPayment(event: any): void {
    this.isFullPayment = event.target.checked;
    if (this.isFullPayment) {
      const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
      this.amountPaid = totalDue;
      this.balance = 0;
      this.isPartialPayment = false;
    } else {
      if (this.existingBalance > 0 && this.isBalancePayment) {
        this.amountPaid = this.existingBalance;
      } else {
        const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
        this.amountPaid = this.roundToTwoDecimals(totalDue / 2);
      }
      this.calculateBalance();
    }
    this.cdr.detectChanges();
  }

  setFullPayment(): void {
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    this.amountPaid = totalDue;
    this.balance = 0;
    this.isPartialPayment = false;
    this.isFullPayment = true;
    this.cdr.detectChanges();
  }

  setHalfPayment(): void {
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    this.amountPaid = this.roundToTwoDecimals(totalDue / 2);
    this.calculateBalance();
    this.isFullPayment = false;
    this.cdr.detectChanges();
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
    
    if (this.balance <= 0 && this.amountPaid > 0) {
      this.isFullPayment = true;
    } else {
      this.isFullPayment = false;
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.amountPaid = 0;
    this.balance = 0;
    this.isPartialPayment = false;
    this.isBalancePayment = false;
    this.isFullPayment = false;
  }

  processPayment(): void {
    if (!this.amountPaid || this.amountPaid <= 0) {
      this.toastr.warning('Please enter a valid amount', 'Warning');
      return;
    }
    
    if (this.currentPaymentMethod === 'holdAndPay') {
      this.processHoldAndPayFromModal();
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

    this.toastr.info('Processing payment...', 'Please wait');

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
    this.cdr.detectChanges();
    
    if (balance > 0) {
      this.toastr.success(`Payment successful! Balance: ₵${this.formatCurrency(balance)}`, 'Partial Payment');
    } else {
      this.toastr.success(`Payment successful! Order #${orderId || ''}`, 'Success');
    }
  }

  handlePaymentError(error: any): void {
    console.error('Payment error:', error);
    this.toastr.error(error.error?.error || error.message || 'Payment failed', 'Error');
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
    if (this.cartItems.length > 0) {
      this.toastr.warning('Please clear current cart first', 'Warning');
      return;
    }

    this.createForm.patchValue({ id2: cartId });
    this.holdOrderId = cartId;

    this.cartService.loadHeldOrder(cartId).subscribe(
      (response) => {
        if (response && response.items) {
          this.cartService.updateCart(response.items);
          this.isHeldOrder = response.onetime ? true : false;
          
          this.existingBalance = response.balance ? this.roundToTwoDecimals(parseFloat(response.balance)) : 0;
          this.isBalancePayment = this.existingBalance > 0;
          
          this.createForm.patchValue({
            customer: response.customer || '',
            note: response.note || '',
            table: response.table || ''
          });
          
          this.recalculateTotal();
          
          if (this.existingBalance > 0) {
            this.toastr.info(`This order has an outstanding balance of ₵${this.formatCurrency(this.existingBalance)}`, 'Balance Due');
          }
          
          this.toastr.success(`Order #${cartId} loaded`, 'Success');
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
            this.isHeldOrder = response.onetime ? true : false;
            this.cartService.updateCart(response.items);
            
            this.existingBalance = response.balance ? this.roundToTwoDecimals(parseFloat(response.balance)) : 0;
            this.isBalancePayment = this.existingBalance > 0;
            
            this.createForm.patchValue({
              customer: response.customer || '',
              note: response.note || '',
              table: response.table || ''
            });
            
            this.recalculateTotal();
            
            if (this.existingBalance > 0) {
              this.toastr.info(`This order has an outstanding balance of ₵${this.formatCurrency(this.existingBalance)}`, 'Balance Due');
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
          this.isHeldOrder = true;
          this.cartService.updateCart(this.heldCarts.map(cart => cart.items).flat());
          this.recalculateTotal();
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

  // ===================== SESSION =====================

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

  // ===================== USER =====================

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.user = res;
          this.createForm.patchValue({ cashier: this.user.username });
        
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

  // ===================== CUSTOMERS =====================

  async getCustomers() {
  try {
    const res = await this.guestService.getCustomers();

    if (res && Array.isArray(res)) {
      this.customers = res;
      this.filteredCustomers = [...res];
    } else {
      this.customers = [];
      this.filteredCustomers = [];
    }

  } catch (err) {
    console.error('Error fetching customers:', err);
    this.customers = [];
    this.filteredCustomers = [];
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

  // selectCustomer(customerId: number) {
  //   this.createForm.patchValue({ customer: customerId });
  // }

  // ===================== SALES REPORT =====================

  getSalesReport(): void {
    if (!this.salesDateFrom && !this.salesDateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }
    this.isLoadingSales = true;
    const payload = { date_from: this.salesDateFrom, date_to: this.salesDateTo };
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
      case 'today': from = new Date(today); to = new Date(today); break;
      case 'yesterday': from = new Date(today); from.setDate(today.getDate() - 1); to = new Date(from); break;
      case 'week': from = new Date(today); from.setDate(today.getDate() - 7); to = new Date(today); break;
      case 'month': from = new Date(today); from.setDate(today.getDate() - 30); to = new Date(today); break;
      default: return;
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
        <head><meta charset="UTF-8"><title>Sales Report</title>
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
            <div class="summary-item"><div class="label">Total Sales</div><div class="value">₵${this.totalSales.toFixed(2)}</div></div>
            <div class="summary-item"><div class="label">Total Orders</div><div class="value">${this.totalOrders}</div></div>
            <div class="summary-item"><div class="label">Average Order</div><div class="value">₵${this.averageOrder.toFixed(2)}</div></div>
            <div class="summary-item"><div class="label">Unique Customers</div><div class="value">${this.uniqueCustomers}</div></div>
          </div>
          <h3>Order Details</h3>
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              ${this.salesReport.orders.map((order: any) => `
                <tr><td>#${order.id}</td><td>${order.customer || 'Walk-in'}</td><td>₵${this.roundToTwoDecimals(order.total).toFixed(2)}</td><td>${new Date(order.created_at).toLocaleDateString()}</td><td>${order.paid_status}</td></tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer"><p>Generated by ${this.user[0]?.firstname || ''} ${this.user[0]?.lastname || ''}</p><p>© ${new Date().getFullYear()} Assempahfie Graphics - All Rights Reserved</p></div>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  }

  // ===================== PRINTING =====================

  printHoldAndPayReceipt(order: any, orderId: any): void {
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
    const amountPaid = this.roundToTwoDecimals(order?.amount_paid || 0);
    const totalAmount = this.roundToTwoDecimals(order?.total || this.total);
    const currentDate = new Date().toLocaleString();
    const note = this.createForm?.value?.note || '';
    const receiptContent = this.buildHoldAndPayReceiptHTML(
      items, customer, balance, amountPaid, totalAmount, currentDate, note, orderId, order
    );
    setTimeout(() => { this.openPrintWindow(receiptContent); }, 100);
  }

  buildHoldAndPayReceiptHTML(
    items: any[], customer: any, balance: number, amountPaid: number, 
    totalAmount: number, currentDate: string, note: string, orderId: any, order: any
  ): string {
    const orderIdString = orderId || order?.id || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);
    const isFullyPaid = balance <= 0;
    const paymentMethod = this.createForm?.value?.method || 'Cash';
    const discount = this.createForm?.value?.discount || 0;
    const discountAmount = discount > 0 ? (discount / 100) * totalAmount : 0;
    const finalTotal = totalAmount - discountAmount;
    const subtotal = items.reduce((sum, item) => sum + ((+item.price || 0) * (+item.qty || 1)), 0);
    return `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>${isFullyPaid ? 'Payment Receipt' : 'Hold & Pay Receipt'}</title>
      <style>
        @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
        body { font-family: monospace, 'Courier New', sans-serif; font-size: 12px; padding: 5px; width: 80mm; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 2px; }
        .logo-container { text-align: center; margin-bottom: 5px; }
        .logo { max-width: 70px; height: auto; display: inline-block; }
        .shop-name { font-size: 16px; font-weight: bold; }
        .info, .footer { text-align: center; margin: 2px 0; }
        .customer-info { background: #f5f5f5; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 11px; }
        .customer-info .label { font-weight: bold; }
        .customer-info .customer-name { font-size: 13px; font-weight: bold; }
        .barcode-container { text-align: center; margin: 5px 0; padding: 3px 0; background: #ffffff; }
        .barcode-container svg { max-width: 100%; height: auto; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; }
        th, td { padding: 2px 0; word-break: break-word; }
        th { text-align: left; border-bottom: 1px solid #ccc; }
        th:last-child, td:last-child { text-align: right; }
        .total-row { font-weight: bold; font-size: 13px; border-top: 1px solid #000; }
        .balance-info { padding: 5px; margin: 5px 0; border-radius: 3px; text-align: center; font-weight: bold; background: ${balance > 0 ? '#fff3cd' : '#d4edda'}; color: ${balance > 0 ? '#856404' : '#155724'}; }
        .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
        .order-id { text-align: center; font-size: 28px; font-weight: 900; color: #1a1a1a; padding: 5px 0; letter-spacing: 3px; background: #f8f9fa; margin: 5px 0; border-radius: 5px; }
        .order-id-label { text-align: center; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
        .note-section { text-align: center; font-size: 11px; margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; }
        .payment-method { text-align: left; font-size: 11px; margin: 3px 0; }
        .status-badge { text-align: center; font-size: 13px; font-weight: bold; padding: 4px; margin: 5px 0; border-radius: 4px; background: ${isFullyPaid ? '#d4edda' : '#fff3cd'}; color: ${isFullyPaid ? '#155724' : '#856404'}; }
        .order-number-box { border: 2px solid ${isFullyPaid ? '#28a745' : '#ffc107'}; padding: 5px 0; margin: 5px 0; border-radius: 8px; background: #ffffff; }
        .payment-details { font-size: 11px; margin: 3px 0; padding: 3px 5px; }
        .payment-details .label { display: inline-block; width: 60px; }
        .payment-details .value { font-weight: bold; }
        .barcode-label { font-size: 8px; color: #666; text-align: center; margin-top: 2px; }
        .discount-line { text-align: right; font-size: 11px; color: #666; }
        @media print and (max-width: 80mm) { body { font-size: 11px; } .barcode-container svg { max-width: 65mm; } .customer-info { font-size: 10px; } .order-id { font-size: 24px; } }
      </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="logo-container"><img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" /></div>
          <div class="shop-name">Assempahfie Graphics</div>
          <div class="info">📍 Kokomlemle, Accra</div>
          <div class="info">📞 0243210009</div>
          <div class="info">📧 afgghana@gmail.com</div>
          <div class="info">👤 Attendant: ${this.user?.[0]?.firstname || ''} ${this.user?.[0]?.lastname || ''}</div>
        </div>
        <div class="order-number-box">
          <div class="order-id-label">ORDER NUMBER</div>
          <div class="order-id">#${orderIdString}</div>
        </div>
        <div class="status-badge">${isFullyPaid ? '✅ PAID IN FULL' : '⏳ PARTIAL PAYMENT - HELD'}</div>
        <div class="customer-info">
          ${customer ? `
            <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
            <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
            ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ${customer.email ? `<div><span class="label">✉️ Email:</span> ${customer.email}</div>` : ''}
          ` : `<div>👤 <span class="label">Customer:</span> Walk-in Customer</div>`}
        </div>
        <div class="info"><strong>${isFullyPaid ? '🧾 PAYMENT RECEIPT' : '🧾 HOLD & PAY RECEIPT'}</strong></div>
        <div class="info">📅 Date: ${currentDate}</div>
        <div class="barcode-container">${barcodeSVG}<div class="barcode-label">Order #${orderIdString}</div></div>
        ${note ? `<div class="note-section"><strong>📝 Note:</strong> ${note}</div>` : ''}
        <hr class="divider" />
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.name || item.item_name || 'N/A'}${item.description ? '<br><small style="color:#666;font-size:10px;">' + item.description + '</small>' : ''}${item.width && item.height ? '<br><small style="color:#888;font-size:9px;">📐 ' + item.width + ' x ' + item.height + ' ' + (item.unit || 'inches') + '</small>' : ''}</td>
                <td>${item.qty || 1}</td>
                <td>₵${((+item.price || 0) * (+item.qty || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr class="divider" />
        <div class="payment-details">
          <div><span class="label">Subtotal:</span> <span class="value">₵${subtotal.toFixed(2)}</span></div>
          ${discount > 0 ? `<div class="discount-line">🏷️ Discount (${discount}%): -₵${discountAmount.toFixed(2)}</div>` : ''}
          <div class="total-row">💰 Total: ₵${finalTotal.toFixed(2)}</div>
        </div>
        <div class="payment-method">💳 Payment Method: ${paymentMethod}</div>
        <div class="balance-info">
          ${balance > 0 ? `💳 Amount Paid: ₵${amountPaid.toFixed(2)}<br>⏳ Balance Due: ₵${balance.toFixed(2)}<br><span style="font-size:11px;">Partial Payment - Held</span>` : `✅ Fully Paid: ₵${finalTotal.toFixed(2)}<br><span style="font-size:11px;">Paid in Full</span>`}
        </div>
        <hr class="divider" />
        <div class="thankyou">🙏 Thank you for your patronage!</div>
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 5px;">${balance > 0 ? 'This is your hold & pay receipt. Please settle balance on next visit.' : 'This is your official payment receipt.'}</div>
        ${balance > 0 ? `<div class="footer" style="font-size: 10px; color: #e74c3c; font-weight: bold;">⚠️ Outstanding balance of ₵${balance.toFixed(2)}</div>` : ''}
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 3px;">Visit us again at Assempahfie Graphics</div>
        <div class="footer" style="font-size: 8px; color: #999;">${balance > 0 ? 'Hold & Pay Receipt' : 'Payment Receipt'} | ${new Date().toLocaleDateString()}<br>Order #${orderIdString}</div>
      </body></html>
    `;
  }

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
      items, customer, balance, amountPaid, totalAmount, currentDate, discount, note, orderId, order
    );
    setTimeout(() => { this.openPrintWindow(receiptContent); }, 100);
  }

  buildReceiptHTML(
    items: any[], customer: any, balance: number, amountPaid: number, 
    totalAmount: number, currentDate: string, discount: number, note: string, orderId: any, order: any
  ): string {
    const orderIdString = orderId || order?.id || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);
    const paymentMethod = this.createForm?.value?.method || 'Cash';
    const discountAmount = discount > 0 ? (discount / 100) * totalAmount : 0;
    const finalTotal = totalAmount - discountAmount;
    const isFullyPaid = balance <= 0;
    const subtotal = items.reduce((sum, item) => sum + ((+item.price || 0) * (+item.qty || 1)), 0);
    return `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><title>Payment Receipt</title>
      <style>
        @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
        body { font-family: monospace, 'Courier New', sans-serif; font-size: 12px; padding: 5px; width: 80mm; box-sizing: border-box; }
        .header { text-align: center; margin-bottom: 2px; }
        .logo-container { text-align: center; margin-bottom: 5px; }
        .logo { max-width: 70px; height: auto; display: inline-block; }
        .shop-name { font-size: 16px; font-weight: bold; }
        .info, .footer { text-align: center; margin: 2px 0; }
        .customer-info { background: #f5f5f5; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 11px; }
        .customer-info .label { font-weight: bold; }
        .customer-info .customer-name { font-size: 13px; font-weight: bold; }
        .barcode-container { text-align: center; margin: 5px 0; padding: 3px 0; background: #ffffff; }
        .barcode-container svg { max-width: 100%; height: auto; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; }
        th, td { padding: 2px 0; word-break: break-word; }
        th { text-align: left; border-bottom: 1px solid #ccc; }
        th:last-child, td:last-child { text-align: right; }
        .total-row { font-weight: bold; font-size: 13px; border-top: 1px solid #000; }
        .balance-info { padding: 5px; margin: 5px 0; border-radius: 3px; text-align: center; font-weight: bold; background: ${balance > 0 ? '#fff3cd' : '#d4edda'}; color: ${balance > 0 ? '#856404' : '#155724'}; }
        .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
        .order-id { text-align: center; font-size: 28px; font-weight: 900; color: #1a1a1a; padding: 5px 0; letter-spacing: 3px; background: #f8f9fa; margin: 5px 0; border-radius: 5px; }
        .order-id-label { text-align: center; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
        .note-section { text-align: center; font-size: 11px; margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; }
        .payment-method { text-align: left; font-size: 11px; margin: 3px 0; }
        .order-number-box { border: 2px solid ${balance > 0 ? '#ffc107' : '#28a745'}; padding: 5px 0; margin: 5px 0; border-radius: 8px; background: #ffffff; }
        .payment-details { font-size: 11px; margin: 3px 0; padding: 3px 5px; }
        .payment-details .label { display: inline-block; width: 60px; }
        .payment-details .value { font-weight: bold; }
        .barcode-label { font-size: 8px; color: #666; text-align: center; margin-top: 2px; }
        .discount-line { text-align: right; font-size: 11px; color: #666; }
        @media print and (max-width: 80mm) { body { font-size: 11px; } .barcode-container svg { max-width: 65mm; } .customer-info { font-size: 10px; } .order-id { font-size: 24px; } }
      </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="logo-container"><img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" /></div>
          <div class="shop-name">Assempahfie Graphics</div>
          <div class="info">📍 Kokomlemle, Accra</div>
          <div class="info">📞 0243210009</div>
          <div class="info">📧 afgghana@gmail.com</div>
          <div class="info">👤 Attendant: ${this.user?.[0]?.firstname || ''} ${this.user?.[0]?.lastname || ''}</div>
        </div>
        <div class="order-number-box">
          <div class="order-id-label">ORDER NUMBER</div>
          <div class="order-id">#${orderIdString}</div>
        </div>
        <div class="customer-info">
          ${customer ? `
            <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
            <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
            ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ${customer.email ? `<div><span class="label">✉️ Email:</span> ${customer.email}</div>` : ''}
          ` : `<div>👤 <span class="label">Customer:</span> Walk-in Customer</div>`}
        </div>
        <div class="info"><strong>🧾 PAYMENT RECEIPT</strong></div>
        <div class="info">📅 Date: ${currentDate}</div>
        <div class="barcode-container">${barcodeSVG}<div class="barcode-label">Order #${orderIdString}</div></div>
        ${note ? `<div class="note-section"><strong>📝 Note:</strong> ${note}</div>` : ''}
        <hr class="divider" />
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.name || item.item_name || 'N/A'}${item.description ? '<br><small style="color:#666;font-size:10px;">' + item.description + '</small>' : ''}${item.width && item.height ? '<br><small style="color:#888;font-size:9px;">📐 ' + item.width + ' x ' + item.height + ' ' + (item.unit || 'inches') + '</small>' : ''}</td>
                <td>${item.qty || 1}</td>
                <td>₵${((+item.price || 0) * (+item.qty || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr class="divider" />
        <div class="payment-details">
          <div><span class="label">Subtotal:</span> <span class="value">₵${subtotal.toFixed(2)}</span></div>
          ${discount > 0 ? `<div class="discount-line">🏷️ Discount (${discount}%): -₵${discountAmount.toFixed(2)}</div>` : ''}
          <div class="total-row">💰 Total: ₵${finalTotal.toFixed(2)}</div>
        </div>
        <div class="payment-method">💳 Payment Method: ${paymentMethod}</div>
        <div class="balance-info">
          ${balance > 0 ? `💳 Amount Paid: ₵${amountPaid.toFixed(2)}<br>⏳ Balance Due: ₵${balance.toFixed(2)}<br><span style="font-size:11px;">Partial Payment</span>` : `✅ Fully Paid: ₵${finalTotal.toFixed(2)}<br><span style="font-size:11px;">Paid in Full</span>`}
        </div>
        <hr class="divider" />
        <div class="thankyou">🙏 Thank you for your patronage!</div>
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 5px;">This is your official payment receipt</div>
        ${balance > 0 ? `<div class="footer" style="font-size: 10px; color: #e74c3c; font-weight: bold;">⚠️ Outstanding balance of ₵${balance.toFixed(2)}</div><div class="footer" style="font-size: 10px; color: #e74c3c;">Please settle the balance on your next visit</div>` : ''}
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 3px;">Visit us again at Assempahfie Graphics</div>
        <div class="footer" style="font-size: 8px; color: #999;">Payment Receipt | ${new Date().toLocaleDateString()}<br>Order #${orderIdString}</div>
      </body></html>
    `;
  }

  openPrintWindow(content: string): void {
    let printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    if (!printWindow) {
      printWindow = window.open('', 'printWindow', 'width=400,height=600,scrollbars=yes');
      if (!printWindow) { this.printUsingIframe(content); return; }
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
          setTimeout(() => { iframe.remove(); }, 1000);
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
    printContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;';
    const printContent = document.createElement('div');
    printContent.style.cssText = 'background:white;max-width:400px;max-height:80vh;overflow:auto;padding:20px;border-radius:8px;position:relative;';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;border:none;background:#f44336;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;';
    closeBtn.onclick = () => printContainer.remove();
    const printBtn = document.createElement('button');
    printBtn.textContent = '🖨️ Print Receipt';
    printBtn.style.cssText = 'display:block;width:100%;padding:10px;margin:10px 0;background:#4CAF50;color:white;border:none;border-radius:4px;font-size:16px;cursor:pointer;';
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
    contentPreview.style.cssText = 'max-height:400px;overflow:auto;font-size:12px;border:1px solid #ddd;padding:10px;margin:10px 0;background:#f9f9f9;';
    contentPreview.innerHTML = content;
    printContent.appendChild(closeBtn);
    printContent.appendChild(printBtn);
    printContent.appendChild(contentPreview);
    printContainer.appendChild(printContent);
    document.body.appendChild(printContainer);
  }

  printBill(orderId?: any): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }
    const currentDate = new Date().toLocaleString();
    const selectedCustomerId = this.createForm?.value?.customer;
    let customer = null;
    if (selectedCustomerId && this.customers) {
      customer = this.customers.find((c: any) => c.id == selectedCustomerId);
    }
    const orderIdString = orderId || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);
    const paymentMethod = this.createForm?.value?.method || 'Cash';
    const discount = this.createForm?.value?.discount || 0;
    const totalAmount = this.total;
    const discountAmount = discount > 0 ? (discount / 100) * totalAmount : 0;
    const finalTotal = totalAmount - discountAmount;
    const note = this.createForm?.value?.note || '';
    const subtotal = this.cartItems.reduce((sum, item) => sum + ((+item.price || 0) * (+item.qty || 1)), 0);
    const printWindow = window.open('', '', 'width=300,height=800');
    if (printWindow) {
      let receiptContent = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>INVOICE</title>
        <style>
          @media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; } }
          body { font-family: monospace, 'Courier New', sans-serif; font-size: 12px; padding: 5px; width: 80mm; box-sizing: border-box; }
          .header { text-align: center; margin-bottom: 4px; }
          .logo-container { text-align: center; margin-bottom: 5px; }
          .logo { max-width: 70px; height: auto; display: inline-block; }
          .shop-name { font-weight: bold; font-size: 16px; }
          .info { text-align: center; font-size: 11px; margin: 2px 0; }
          .customer-info { background: #f5f5f5; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 11px; }
          .customer-info .label { font-weight: bold; }
          .customer-info .customer-name { font-size: 13px; font-weight: bold; }
          .barcode-container { text-align: center; margin: 5px 0; padding: 3px 0; background: #ffffff; }
          .barcode-container svg { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { padding: 2px 0; word-break: break-word; }
          th { text-align: left; border-bottom: 1px solid #ccc; }
          th:last-child, td:last-child { text-align: right; }
          .total-row { font-weight: bold; font-size: 13px; border-top: 1px solid #000; }
          .footer { text-align: center; font-size: 10px; margin-top: 5px; }
          .note { text-align: center; font-size: 11px; margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; }
          .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
          .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
          .barcode-label { font-size: 8px; color: #666; text-align: center; margin-top: 2px; }
          .payment-details { font-size: 11px; margin: 3px 0; padding: 3px 5px; }
          .payment-details .label { display: inline-block; width: 60px; }
          .payment-details .value { font-weight: bold; }
          .discount-line { text-align: right; font-size: 11px; color: #666; }
          .order-number-box { border: 2px solid #ffc107; padding: 5px 0; margin: 5px 0; border-radius: 8px; background: #ffffff; }
          .order-id { text-align: center; font-size: 28px; font-weight: 900; color: #1a1a1a; padding: 5px 0; letter-spacing: 3px; }
          .order-id-label { text-align: center; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; }
          .hold-badge { background: #ffc107; color: #856404; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block; margin: 5px 0; }
          @media print and (max-width: 80mm) { body { font-size: 11px; } .barcode-container svg { max-width: 65mm; } .customer-info { font-size: 10px; } .order-id { font-size: 24px; } }
        </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="logo-container"><img src="../../assets/img/asempa.jpg" alt="Asempa Graphics" class="logo" /></div>
            <div class="shop-name">Assempahfie Graphics</div>
            <div class="info">📍 Kokomlemle, Accra</div>
            <div class="info">📞 0243210009</div>
            <div class="info">👤 Attendant: ${this.user?.[0]?.firstname || ''} ${this.user?.[0]?.lastname || ''}</div>
          </div>
          <div class="order-number-box">
            <div class="order-id-label">ORDER NUMBER</div>
            <div class="order-id">#${orderIdString}</div>
          </div>
          <div style="text-align:center;"><span class="hold-badge">⏳ HELD ORDER</span></div>
          <div class="customer-info">
            ${customer ? `
              <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
              <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
              ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ` : `<div>👤 <span class="label">Customer:</span> Walk-in Customer</div>`}
          </div>
          <div class="info"><strong>🧾 INVOICE</strong></div>
          <div class="info">📅 Date: ${currentDate}</div>
          <div class="barcode-container">${barcodeSVG}<div class="barcode-label">Order #${orderIdString}</div></div>
          ${note ? `<div class="note"><strong>📝 Note:</strong> ${note}</div>` : ''}
          <hr class="divider" />
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
            <tbody>
      `;
      this.cartItems.forEach((item: any) => {
        receiptContent += `
          <tr>
            <td>${item.name || item.item_name || 'N/A'}${item.description ? '<br><small style="color:#666;font-size:10px;">' + item.description + '</small>' : ''}${item.width && item.height ? '<br><small style="color:#888;font-size:9px;">📐 ' + item.width + ' x ' + item.height + ' ' + (item.unit || 'inches') + '</small>' : ''}</td>
            <td>${item.qty || 1}</td>
            <td>₵${((+item.price || 0) * (+item.qty || 1)).toFixed(2)}</td>
          </tr>
        `;
      });
      receiptContent += `
            </tbody>
          </table>
          <hr class="divider" />
          <div class="payment-details">
            <div><span class="label">Subtotal:</span> <span class="value">₵${subtotal.toFixed(2)}</span></div>
            ${discount > 0 ? `<div class="discount-line">🏷️ Discount (${discount}%): -₵${discountAmount.toFixed(2)}</div>` : ''}
            <div class="total-row">💰 Total: ₵${finalTotal.toFixed(2)}</div>
          </div>
          <div class="payment-method">💳 Payment Method: ${paymentMethod}</div>
          <hr class="divider" />
          <div class="thankyou">🙏 Thank you for your purchase!</div>
          <div class="footer" style="font-size: 10px; color: #666;">This order has been held. Please complete payment on pickup.</div>
          <div class="footer" style="font-size: 10px; color: #856404; margin-top: 5px;">⏳ Order #${orderIdString} - Held</div>
          <div class="footer" style="font-size: 10px; color: #666; margin-top: 3px;">Visit us again at Assempahfie Graphics</div>
          <div class="footer" style="font-size: 8px; color: #999;">Invoice | ${new Date().toLocaleDateString()}<br>Order #${orderIdString}</div>
        </body></html>
      `;
      printWindow.document.open();
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    }
  }

  // ===================== MODALS =====================

  openPopup() { this.displayStyle = "block"; }
  openPopup2() { this.displayStyleManager = "block"; }
  openPopup4() { this.displayStyleCustomer = "block"; }
  closePopup() {
    this.displayStyle = "none";
    this.displayStyleManager = "none";
    this.displayStyleCustomer = "none";
  }

  // ===================== NAVIGATION =====================
filterCustomers(): void {
  const search = (this.customerSearchTerm || '').trim().toLowerCase();

  if (!search) {
    this.filteredCustomers = [...this.customers];
    return;
  }

  this.filteredCustomers = this.customers.filter((customer: any) => {

    const firstname = String(customer.firstname || '').toLowerCase();
    const lastname = String(customer.lastname || '').toLowerCase();
    const customerId = String(customer.customer_id || '').toLowerCase();
    const id = String(customer.id || '').toLowerCase();
    const phone = String(customer.phone || '').toLowerCase();
    const email = String(customer.email || '').toLowerCase();

    const fullName = `${firstname} ${lastname}`.trim();

    return (
      firstname.includes(search) ||
      lastname.includes(search) ||
      fullName.includes(search) ||
      customerId.includes(search) ||
      id.includes(search) ||
      phone.includes(search) ||
      email.includes(search)
    );
  });
}


openCustomerDropdown(): void {
  this.showCustomerDropdown = true;

  // Show all customers when the field is opened
  if (!this.customerSearchTerm.trim()) {
    this.filteredCustomers = [...this.customers];
  }
}


selectCustomer(customerId: any): void {

  const customer = this.customers.find(
    (c: any) => String(c.id) === String(customerId)
  );

  if (!customer) {
    return;
  }

  this.selectedCustomer = customer;

  this.createForm.patchValue({
    customer: customer.id,
    phone: customer.phone || '',
    firstname: customer.firstname || '',
    lastname: customer.lastname || '',
    email: customer.email || ''
  });

  this.customerSearchTerm =
    `${customer.firstname || ''} ${customer.lastname || ''}`.trim();

  this.showCustomerDropdown = false;

  this.cdr.detectChanges();
}


clearCustomerSelection(): void {
  this.selectedCustomer = null;
  this.customerSearchTerm = '';

  this.createForm.patchValue({
    customer: '',
    phone: '',
    firstname: '',
    lastname: '',
    email: ''
  });

  this.filteredCustomers = [...this.customers];

  this.showCustomerDropdown = false;
}
  openSales() { this.router.navigate(['/daily-income']); }
}