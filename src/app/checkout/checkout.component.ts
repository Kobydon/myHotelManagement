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
import { ThisReceiver } from '@angular/compiler';
import { normalize } from 'path';

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

  // ===================== MULTI-ORDER PROPERTIES =====================
  multiOrders: any[] = [];
  activeMultiOrder: any = null;
  showMultiOrderPanel: boolean = false;
  completedOrders: any[] = [];
  isProcessingMultiOrder: boolean = false;
  showBatchPrintModal: boolean = false;
  batchPrinting: boolean = false;
  isMultiOrderPayment: boolean = false;
  pendingMultiOrderId: string | null = null;
  
  // Batch processing
  private _remainingBatchOrders: any[] = [];
  private _currentBatchIndex: number = 0;
  private _batchCompletedCount: number = 0;
  private _batchFailedCount: number = 0;
  private _isBatchProcessing: boolean = false;
  private _batchTotalOrders: number = 0;
  private _isProcessingNext: boolean = false;

  // Customer existence check
  customerExists: boolean = false;
  existingCustomer: any = null;
  isUpdatingCustomer: boolean = false;

  // Measurement Products
  measurementProducts: string[] = [
    'SAV', 'SAV WITH LAMINATION', 'FLEXY', 'ONE WAY',
    'REFLECTIVE', 'TRANSPARENT', 'SAV PRINT & CUT',
    'PP LABEL PRINT & CUT', 'TRANSPARENT PRINT & CUT',
    'BANNER WITH LAMINATION'
  ];

  // ===================== PAYMENT CART PROPERTIES =====================
  paymentCart: any[] = [];
  showPaymentCart: boolean = false;
  isProcessingPaymentCart: boolean = false;
  paymentCartTotal: number = 0;
  paymentCartDiscount: number = 0;
  
  // Individual payment amounts for each order in the cart
  paymentCartAmounts: { [key: string]: number } = {};
  paymentCartBalances: { [key: string]: number } = {};
  
  // Payment cart payment method
  paymentCartPaymentMethod: string = 'Cash';

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
    this.loadSavedCarts();
    this.loadMultiOrders();
    this.loadCompletedOrders();
    
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

  calDiscount(formValue: any): void {
    this.recalculateTotal();
  }

  recalculateTotal(): void {
    const subtotal = this.cartItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      return sum + (price * qty);
    }, 0);

    let discount = Number(this.createForm?.get('discount')?.value) || 0;
    discount = Math.max(0, Math.min(100, discount));
    const discountAmount = (discount / 100) * subtotal;
    const finalTotal = subtotal - discountAmount;

    this.total = this.roundToTwoDecimals(finalTotal);

    if (this.activeMultiOrder && this.cartItems.length > 0) {
      this.saveCartToActiveOrder();
    }
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
      if (this.activeMultiOrder) {
        this.saveCartToActiveOrder();
      }
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
    if (this.activeMultiOrder) {
      this.saveCartToActiveOrder();
    }
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
    const cartItem = items.find(i => i.cart_item_id === item.cart_item_id);
    if (cartItem) {
      cartItem.qty = newQty;
      this.cartService.updateCart(items);
      this.recalculateTotal();
      if (this.activeMultiOrder) {
        this.saveCartToActiveOrder();
      }
    }
  }

  private updateItemQtyWithDebounce(item: any, value: number, index: number): void {
    const items = this.cartService.getCart();
    const cartItem = items.find(i => i.cart_item_id === item.cart_item_id);
    if (cartItem) {
      cartItem.qty = value;
      this.cartService.updateCart(items);
      this.recalculateTotal();
      if (this.activeMultiOrder) {
        this.saveCartToActiveOrder();
      }
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
    if (this.activeMultiOrder) {
      this.saveCartToActiveOrder();
    }
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
    if (this.activeMultiOrder) {
      this.saveCartToActiveOrder();
    }
    this.cdr.detectChanges();
  }

  clearCart(): void {
    if (this.cartItems.length === 0) {
      return;
    }
    this.cartService.clearCart();
    this.isHeldOrder = false;
    this.existingBalance = 0;
    this.holdOrderId = null;
    this.isBalancePayment = false;
    this.total = 0;
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
    if (this.activeMultiOrder) {
      this.saveCartToActiveOrder();
    }
    this.toastr.success('Product added to cart', 'Success');
  }

  closeMeasurementModal(): void {
    this.showMeasurementModal = false;
    this.selectedProduct = null;
  }

  // ===================== HOLD & PAY =====================
 holdAndPay(amountPaid: number = 0, isFullPayment: boolean = false): void {

  // Allow balance payment even when cart is empty
  if (this.cartItems.length === 0 && !this.isBalancePayment) {
    this.toastr.warning('Cart is empty', 'Warning');
    return;
  }

  const subtotal = this.cartItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;

    return sum + (price * qty);
  }, 0);

  let discount =
    Number(this.createForm?.get('discount')?.value) || 0;

  discount = Math.max(0, Math.min(100, discount));

  const discountAmount = this.roundToTwoDecimals(
    (discount / 100) * subtotal
  );

  const normalTotal = this.roundToTwoDecimals(
    subtotal - discountAmount
  );

  let finalAmountPaid: number;
  let finalTotal: number;

  // ==========================================================
  // EXISTING BALANCE PAYMENT
  // ==========================================================
  if (this.isBalancePayment) {

    /*
     * IMPORTANT:
     *
     * existingBalance is only used by the frontend to determine
     * how much the customer is allowed to pay.
     *
     * The backend/database remains the source of truth.
     */

    const balance = this.roundToTwoDecimals(
      Number(this.existingBalance) || 0
    );

    if (isFullPayment) {
      finalAmountPaid = balance;
    } else {
      finalAmountPaid = this.roundToTwoDecimals(
        Number(amountPaid) || 0
      );
    }

    // Never pay more than outstanding balance
    finalAmountPaid = Math.min(
      finalAmountPaid,
      balance
    );

    // Never allow negative payment
    finalAmountPaid = Math.max(
      finalAmountPaid,
      0
    );

    /*
     * We send the balance as an informational value.
     * Backend should NOT trust this value.
     */
    finalTotal = balance;

    console.log('💳 BALANCE PAYMENT');
    console.log('Outstanding balance:', balance);
    console.log('Payment:', finalAmountPaid);

  } else {

    // ========================================================
    // NORMAL ORDER
    // ========================================================

    finalTotal = normalTotal;

    if (isFullPayment) {
      finalAmountPaid = finalTotal;
    } else {
      finalAmountPaid = this.roundToTwoDecimals(
        Number(amountPaid) || 0
      );

      finalAmountPaid = Math.min(
        finalAmountPaid,
        finalTotal
      );

      finalAmountPaid = Math.max(
        finalAmountPaid,
        0
      );
    }
  }

  // ==========================================================
  // PREPARE ORDER DATA
  // ==========================================================

  const orderData = {

    // Existing held order ID
    id: this.holdOrderId || null,

    // Cart can be empty during balance payment
    cartItems: this.cartItems.map(item => ({
      ...item,

      name:
        item.name ||
        item.item_name ||
        'Unknown Item',

      price:
        Number(item.price) || 0,

      qty:
        Number(item.qty) || 1,

      total:
        this.roundToTwoDecimals(
          (Number(item.price) || 0) *
          (Number(item.qty) || 1)
        )
    })),

    // ========================================================
    // NORMAL ORDER VALUES
    // ========================================================

    subtotal: this.isBalancePayment
      ? 0
      : this.roundToTwoDecimals(subtotal),

    discount: this.isBalancePayment
      ? 0
      : discount,

    discount_amount: this.isBalancePayment
      ? 0
      : discountAmount,

    // For normal order = actual order total
    // For balance payment = current outstanding balance
    //
    // Backend must NOT use this to overwrite the original
    // order total during a balance payment.
    total: finalTotal,

    // This is the actual amount customer is paying NOW
    amount_paid: finalAmountPaid,

    is_balance_payment:
      this.isBalancePayment,

    // Informational only.
    // Backend should use database balance.
    existing_balance:
      this.existingBalance,

    customer:
      this.createForm.value.customer || '',

    note:
      this.createForm.value.note || '',

    table:
      this.createForm.value.table || '',

    method:
      this.createForm.value.method || 'Cash'
  };

  console.log(
    '💰 PAYMENT DATA SENT:',
    orderData
  );

  this.toastr.info(
    'Processing payment...',
    'Please wait'
  );

  // ==========================================================
  // SEND TO BACKEND
  // ==========================================================

  this.cartService.holdAndPay(orderData).subscribe({

    next: (response: any) => {

      const orderId =
        response.id ||
        response.order_id ||
        'N/A';

      const balance =
        Number(response.balance) || 0;

      const paid =
        Number(response.amount_paid) || 0;

      const orderTotal =
        Number(response.total) || 0;

      console.log('✅ PAYMENT SUCCESS');

      console.log({
        orderId,
        paid,
        balance,
        orderTotal,
        isBalancePayment:
          this.isBalancePayment
      });

      // ======================================================
      // SUCCESS MESSAGE
      // ======================================================

      if (this.isBalancePayment) {

        if (balance <= 0) {

          this.toastr.success(
            `Balance cleared. Order #${orderId} is fully paid.`,
            'Payment Complete'
          );

        } else {

          this.toastr.success(
            `₵${paid.toFixed(2)} paid. ` +
            `Remaining balance: ₵${balance.toFixed(2)}`,
            'Payment Received'
          );
        }

      } else {

        if (balance <= 0) {

          this.toastr.success(
            `Order #${orderId} paid successfully.`,
            'Payment Complete'
          );

        } else {

          this.toastr.success(
            `Order #${orderId} held with balance ` +
            `of ₵${balance.toFixed(2)}`,
            'Partial Payment'
          );
        }
      }

      // ======================================================
      // REFRESH
      // ======================================================

      this.clearCart();

      this.loadHeldCarts();
      this.holdOrderId = null;
      this.existingBalance = 0;
      this.total = 0;
      this.isBalancePayment = false;
        

      this.closePaymentModal();
  this.printHoldAndPayReceipt(response, orderId);
  this.createForm.patchValue({customer:"",phone:"",note:""})
        this.clearCustomerSelection();
      this.cdr.detectChanges();


    },

    error: (error) => {

      console.error(
        '❌ Error in holdAndPay:',
        error
      );

      this.toastr.error(
        error.error?.error ||
        'Failed to process payment',
        'Error'
      );

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
    this.isMultiOrderPayment = false;
    this.pendingMultiOrderId = null;
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    this.amountPaid = 0;
    this.isPartialPayment = false;
    this.isFullPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
  }

  processHoldAndPayFromModal(): void {
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    const amountToPay = this.amountPaid || 0;
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
    this.isMultiOrderPayment = false;
    this.pendingMultiOrderId = null;
    
    if (this.isBalancePayment && this.existingBalance > 0) {
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
      let totalDue: number;
      
      if (this.isBalancePayment && this.existingBalance > 0) {
        totalDue = this.existingBalance;
      } else {
        totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
      }
      
      this.amountPaid = totalDue;
      this.balance = 0;
      this.isPartialPayment = false;
    } else {
      if (this.isBalancePayment && this.existingBalance > 0) {
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
    let totalDue: number;
    
    if (this.isBalancePayment && this.existingBalance > 0) {
      totalDue = this.existingBalance;
    } else {
      totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    }
    
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
      
      // if (enteredAmount > totalDue) {
      //   this.toastr.warning('Amount cannot exceed balance', 'Warning');
      //   this.amountPaid = totalDue;
      //   this.balance = 0;
      //   this.isPartialPayment = false;
      //   return;
      // }
      this.balance = this.roundToTwoDecimals(totalDue - enteredAmount);
      this.isPartialPayment = this.balance > 0;
    } else {
      const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
      
      // if (enteredAmount > totalDue) {
      //   this.toastr.warning('Amount cannot exceed total', 'Warning');
      //   this.amountPaid = totalDue;
      //   this.balance = 0;
      //   this.isPartialPayment = false;
      //   return;
      // }
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
    this.isMultiOrderPayment = false;
    this.pendingMultiOrderId = null;
  }

  processPayment(): void {
      if (!this.createForm.value.customer) {
    this.toastr.warning('Please select a customer', 'Warning');
    return;
  }
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
    
    if (this.isMultiOrderPayment && this.pendingMultiOrderId) {
      const receipt = this.cartService.completeMultiOrder({
        ...response,
        customer: this.createForm.value.customer || '',
        note: this.createForm.value.note || '',
        table: this.createForm.value.table || '',
        method: this.createForm.value.method || 'Cash'
      });
      
      if (receipt) {
        this.cartService.addCompletedMultiOrder(receipt);
        this.loadCompletedOrders();
        this.loadMultiOrders();
        this._batchCompletedCount++;
      }
      
      this.isMultiOrderPayment = false;
      this.pendingMultiOrderId = null;
      this.activeMultiOrder = null;
      this.cartService.activeOrderId = null;
    }
    
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
    this.createForm.patchValue({note:"",customer:"",phone:""})
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
    this.isMultiOrderPayment = false;
    this.pendingMultiOrderId = null;
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
          
          if (this.isBalancePayment) {
            this.total = this.existingBalance;
          } else {
            this.recalculateTotal();
          }
          
          this.createForm.patchValue({
            customer: response.customer || '',
          });
          
          if (this.existingBalance > 0) {
            // Show balance info
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
      // this.toastr.error('Failed to get session', 'Error');
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
    }
  }

  
  // ===================== CUSTOMER EXISTENCE CHECK =====================

checkCustomerExists(): void {
  const phone = this.createForm.value.phone?.trim() || '';
  const email = this.createForm.value.email?.trim() || '';

  // Reset customer status
  this.customerExists = false;
  this.existingCustomer = null;

  // Nothing to check
  if (!phone && !email) {
    return;
  }

  // Check existing customers
  if (this.customers && this.customers.length > 0) {
    let foundCustomer = null;

    // Check by phone first
    if (phone) {
      foundCustomer = this.customers.find((customer: any) =>
        customer.phone &&
        customer.phone.toString().trim() === phone.toString().trim()
      );
    }

    // If not found by phone, check by email
    if (!foundCustomer && email) {
      foundCustomer = this.customers.find((customer: any) =>
        customer.email &&
        customer.email.toString().trim().toLowerCase() ===
        email.toString().trim().toLowerCase()
      );
    }

    // Customer found
    if (foundCustomer) {
      this.customerExists = true;
      this.existingCustomer = foundCustomer;

      // Fill the form with existing customer details
      this.createForm.patchValue({
        firstname: foundCustomer.firstname || '',
        lastname: foundCustomer.lastname || '',
        phone: foundCustomer.phone || '',
        email: foundCustomer.email || '',
        dob: foundCustomer.dob || ''
      }, { emitEvent: false });

      this.toastr.info(
        `Customer already exists: ${foundCustomer.firstname || ''} ${foundCustomer.lastname || ''}`,
        'Customer Found'
      );
    }
  }
}


  onCustomerFieldChange(): void {
    this.checkCustomerExists();
  }

  async addCustomer(record: any) {
    try {
      this.checkCustomerExists();

      if (this.customerExists && this.existingCustomer) {
        const updateData = {
          customer_id: this.existingCustomer.id,
          firstname: record.firstname || '',
          lastname: record.lastname || '',
          phone: record.phone || '',
          email: record.email || '',
          dob: record.dob || ''
        };

        this.isUpdatingCustomer = true;
        const res = await this.guestService.updateCustomer(updateData);
        
        if (res) {
          this.toastr.success('Customer updated successfully', 'Success');
          this.getCustomers();
          this.closePopup();
          this.resetCustomerForm();
        } else {
          this.toastr.error('Failed to update customer', 'Error');
        }
      } else {
        const res = await this.guestService.addCustomer(record);
        if (res) {
          this.toastr.success('Customer added successfully', 'Success');
          this.getCustomers();
          this.closePopup();
          this.resetCustomerForm();
        }
      }
    } catch (err) {
      console.error('Error adding/updating customer:', err);
      this.toastr.error('Failed to process customer', 'Error');
    } finally {
      this.isUpdatingCustomer = false;
    }
  }

  resetCustomerForm(): void {
    this.customerExists = false;
    this.existingCustomer = null;
    this.isUpdatingCustomer = false;
    this.createForm.patchValue({
      customer_new_id: '',
      firstname: '',
      lastname: '',
      phone: '',
      email: ''
    });
  }

  generateId() {
    try {
      const count = this.customers && this.customers.length ? this.customers.length + 1 : 1;
      this.createForm.patchValue({ customer_new_id: count });
    } catch (err) {
      console.log(err);
    }
  }

  // ===================== MULTI-ORDER METHODS =====================

  loadMultiOrders(): void {
    const allOrders = this.cartService.getMultiOrders();
    this.multiOrders = allOrders.filter(order => order.status !== 'paid');
    
    if (this.activeMultiOrder) {
      const stillExists = this.multiOrders.some(
        o => o.local_id === this.activeMultiOrder.local_id
      );
      if (!stillExists) {
        this.activeMultiOrder = null;
        this.cartService.activeOrderId = null;
      } else {
        const updatedOrder = this.multiOrders.find(
          o => o.local_id === this.activeMultiOrder.local_id
        );
        if (updatedOrder) {
          this.activeMultiOrder = updatedOrder;
        }
      }
    }
    
    console.log(`📊 Loaded ${this.multiOrders.length} active orders`);
    this.cdr.detectChanges();
  }

  loadCompletedOrders(): void {
    this.completedOrders = this.cartService.getCompletedMultiOrders();
    this.cdr.detectChanges();
  }

  createNewMultiOrder(): void {
    if (this.cartItems.length > 0 && this.activeMultiOrder) {
      this.cartService.updateActiveMultiOrder({
        customer: this.createForm.value.customer || this.activeMultiOrder.customer || '',
        note: this.createForm.value.note || this.activeMultiOrder.note || '',
        table: this.createForm.value.table || this.activeMultiOrder.table || '',
        method: this.createForm.value.method || this.activeMultiOrder.method || 'Cash'
      });
      this.cartService.saveActiveMultiOrder();
    } else if (this.cartItems.length > 0) {
      const customerName = this.createForm.value.customer || 'Walk-in Customer';
      const note = this.createForm.value.note || '';
      const table = this.createForm.value.table || '';
      
      const tempOrder = this.cartService.startNewMultiOrder(customerName, note, table);
      const orders = this.cartService.getMultiOrders();
      const orderIndex = orders.findIndex(o => o.local_id === tempOrder.local_id);
      if (orderIndex !== -1) {
        orders[orderIndex].cartItems = [...this.cartItems];
        orders[orderIndex].total = this.cartService.getTotal();
        this.cartService['saveMultiOrders'](orders);
      }
      this.activeMultiOrder = tempOrder;
      this.cartService.activeOrderId = tempOrder.local_id;
    }
    
    const customerName = this.createForm.value.customer || 'Walk-in Customer';
    const note = this.createForm.value.note || '';
    const table = this.createForm.value.table || '';
    
    const order = this.cartService.startNewMultiOrder(customerName, note, table);
    
    this.activeMultiOrder = order;
    this.cartService.activeOrderId = order.local_id;
    
    this.cartService.updateCart([]);
    this.cartItems = [];
    this.total = 0;
    
    this.createForm.patchValue({
      customer: customerName,
      note: note,
      table: table,
      method: 'Cash'
    });
    
    this.loadMultiOrders();
    this.toastr.success(`New order created for ${customerName || 'Customer'}`, 'Success');
    this.cdr.detectChanges();
  }

  switchToMultiOrder(localId: string): void {
    if (this.cartItems.length > 0 && this.activeMultiOrder) {
      this.cartService.updateActiveMultiOrder({
        customer: this.createForm.value.customer || this.activeMultiOrder.customer || '',
        note: this.createForm.value.note || this.activeMultiOrder.note || '',
        table: this.createForm.value.table || this.activeMultiOrder.table || '',
        method: this.createForm.value.method || this.activeMultiOrder.method || 'Cash'
      });
      this.cartService.saveActiveMultiOrder();
    }
    
    const order = this.cartService.switchMultiOrder(localId);
    
    if (order) {
      this.activeMultiOrder = order;
      this.cartService.activeOrderId = order.local_id;
      
      this.createForm.patchValue({
        customer: order.customer || '',
        note: order.note || '',
        table: order.table || '',
        method: order.method || 'Cash'
      });
      
      const orderItems = order.cartItems || [];
      this.cartService.updateCart(orderItems);
      
      this.cartService.cartItems$.subscribe((items) => {
        this.cartItems = items;
        this.recalculateTotal();
        this.cdr.detectChanges();
      });
      
      this.loadMultiOrders();
      
      this.toastr.info(
        `Switched to: ${order.customer || 'Customer'} (${orderItems.length} items)`,
        'Info'
      );
      this.cdr.detectChanges();
    } else {
      this.toastr.error('Failed to switch order', 'Error');
    }
  }

  saveCurrentMultiOrder(): void {
    if (!this.activeMultiOrder) {
      this.toastr.warning('No active order to save', 'Warning');
      return;
    }
    
    this.cartService.updateActiveMultiOrder({
      customer: this.createForm.value.customer || this.activeMultiOrder.customer || '',
      note: this.createForm.value.note || this.activeMultiOrder.note || '',
      table: this.createForm.value.table || this.activeMultiOrder.table || '',
      method: this.createForm.value.method || this.activeMultiOrder.method || 'Cash'
    });
    
    this.cartService.saveActiveMultiOrder();
    this.loadMultiOrders();
    this.toastr.success('Order saved successfully', 'Success');
  }

  deleteMultiOrder(localId: string): void {
    if (confirm('Are you sure you want to delete this order?')) {
      const deleted = this.cartService.deleteMultiOrder(localId);
      if (deleted) {
        this.loadMultiOrders();
        if (this.activeMultiOrder?.local_id === localId) {
          this.activeMultiOrder = null;
          this.cartItems = [];
          this.total = 0;
          this.cartService.updateCart([]);
        }
        this.toastr.success('Order deleted', 'Success');
      }
    }
  }

  completeMultiOrderWithPayment(): void {
    if (this.cartItems.length === 0) {
      this.toastr.warning('Cart is empty', 'Warning');
      return;
    }

    if (!this.activeMultiOrder) {
      this.toastr.warning('No active order', 'Warning');
      return;
    }

    this.saveCartToActiveOrder();

    this.isMultiOrderPayment = true;
    this.pendingMultiOrderId = this.activeMultiOrder.local_id;
    
    this.currentPaymentMethod = 'holdAndPay';
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    this.amountPaid = totalDue;
    this.isFullPayment = true;
    this.isPartialPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
  }

  completeAllMultiOrders(): void {
    const openOrders = this.cartService.getOpenMultiOrders();
    
    if (openOrders.length === 0) {
      this.toastr.warning('No open orders to complete', 'Warning');
      return;
    }

    if (this.cartItems.length > 0) {
      this.toastr.warning('Please clear current cart first', 'Warning');
      return;
    }

    const totalAmount = openOrders.reduce((sum, order) => {
      return sum + this.roundToTwoDecimals(order.total || 0);
    }, 0);

    if (!confirm(`You have ${openOrders.length} order(s) totaling ₵${totalAmount.toFixed(2)}. Process all now?`)) {
      return;
    }

    this._remainingBatchOrders = [];
    this._currentBatchIndex = 0;
    this._batchCompletedCount = 0;
    this._batchFailedCount = 0;
    this._batchTotalOrders = openOrders.length;
    this._isBatchProcessing = true;
    this.isProcessingMultiOrder = true;
    this._isProcessingNext = false;
    
    this._remainingBatchOrders = [...openOrders];
    
    console.log(`📊 Starting batch processing for ${this._batchTotalOrders} orders`);
    
    this.processNextBatchOrder();
  }

  private processNextBatchOrder(): void {
    if (this._isProcessingNext) {
      console.log('⚠️ Already processing next order, skipping...');
      return;
    }

    console.log(`📊 processNextBatchOrder called. Index: ${this._currentBatchIndex}, Total: ${this._remainingBatchOrders.length}`);
    
    if (this._currentBatchIndex >= this._remainingBatchOrders.length || this._remainingBatchOrders.length === 0) {
      console.log('📊 All orders processed in batch!');
      this._remainingBatchOrders = [];
      this._currentBatchIndex = 0;
      this.isProcessingMultiOrder = false;
      this._isBatchProcessing = false;
      this.finishBatchProcessing(this._batchCompletedCount, this._batchFailedCount);
      return;
    }

    const order = this._remainingBatchOrders[this._currentBatchIndex];
    console.log(`📊 Processing order ${this._currentBatchIndex + 1}/${this._remainingBatchOrders.length}: ${order.customer || 'Customer'}`);
    
    this.cartService.switchMultiOrder(order.local_id);
    this.activeMultiOrder = order;
    
    const orderItems = order.cartItems || [];
    this.cartService.updateCart(orderItems);
    this.cartItems = orderItems;
    this.total = this.roundToTwoDecimals(order.total || 0);
    this.existingBalance = this.roundToTwoDecimals(order.balance || 0);
    
    this.createForm.patchValue({
      customer: order.customer || '',
      note: order.note || '',
      table: order.table || '',
      method: order.method || 'Cash'
    });
    
    this.isMultiOrderPayment = true;
    this.pendingMultiOrderId = order.local_id;
    
    this.currentPaymentMethod = 'holdAndPay';
    const totalDue = this.roundToTwoDecimals(this.total + this.existingBalance);
    this.amountPaid = totalDue;
    this.isFullPayment = true;
    this.isPartialPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
    
    console.log(`📊 Payment modal opened for order ${this._currentBatchIndex + 1}`);
  }

  finishBatchProcessing(completed: number, failed: number): void {
    console.log(`📊 Batch processing finished: ${completed} completed, ${failed} failed`);
    
    this.loadMultiOrders();
    this.loadCompletedOrders();
    this.isProcessingMultiOrder = false;
    this._isBatchProcessing = false;
    this._isProcessingNext = false;
    
    this.activeMultiOrder = null;
    this.cartService.activeOrderId = null;
    this.cartService.updateCart([]);
    this.total = 0;
    
    this.cdr.detectChanges();
    
    if (failed > 0) {
      this.toastr.warning(
        `${completed} order(s) completed, ${failed} failed`,
        'Batch Complete'
      );
    } else {
      this.toastr.success(
        `All ${completed} order(s) completed successfully!`,
        'Batch Complete'
      );
    }
    
    const completedOrders = this.cartService.getCompletedMultiOrders();
    if (completedOrders && completedOrders.length > 0) {
      console.log(`📊 Auto-printing ${completedOrders.length} receipts`);
      setTimeout(() => {
        this.printAllCompletedReceipts();
      }, 600);
    }
  }

  printAllCompletedReceipts(): void {
    const completed = this.cartService.getCompletedMultiOrders();
    
    if (!completed || completed.length === 0) {
      this.toastr.warning('No completed orders to print', 'Warning');
      return;
    }

    this.batchPrinting = true;
    this.showBatchPrintModal = true;
    
    const combinedContent = this.buildBatchReceiptHTML(completed);
    
    const printWindow = window.open('', '_blank', 'width=400,height=800,scrollbars=yes');
    
    if (!printWindow) {
      this.toastr.error('Please allow popups to print receipts', 'Print Error');
      this.batchPrinting = false;
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(combinedContent);
    printWindow.document.close();
    
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        
        this.cartService.clearCompletedMultiOrders();
        this.completedOrders = [];
        this.showBatchPrintModal = false;
        this.batchPrinting = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          try {
            printWindow.close();
          } catch (e) {
            console.warn('Could not close print window:', e);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Printing failed:', error);
        this.toastr.error('Unable to print receipts', 'Print Error');
        this.batchPrinting = false;
      }
    }, 700);
  }

  buildBatchReceiptHTML(completedOrders: any[]): string {
    let grandTotal = 0;
    let grandPaid = 0;
    let grandBalance = 0;

    let receiptsHTML = completedOrders.map((order, index) => {
      const items = order.cartItems || [];
      const orderTotal = this.roundToTwoDecimals(order.total || 0);
      const balance = this.roundToTwoDecimals(order.balance || 0);
      const amountPaid = this.roundToTwoDecimals(order.amount_paid || 0);
      const orderId = order.id || order.order_id || 'N/A';
      const customer = order.customer || 'Walk-in';
      const method = order.method || 'Cash';
      const note = order.note || '';
      const date = order.completed_at || order.created_at || new Date().toISOString();
      const attendant = order.waiter || this.user?.[0]?.firstname || '';

      grandTotal += orderTotal;
      grandPaid += amountPaid;
      grandBalance += balance;

      let itemsHTML = '';
      items.forEach((item: any) => {
        const itemName = item.name || item.item_name || 'N/A';
        const qty = item.qty || 1;
        const price = this.roundToTwoDecimals(item.price || 0);
        const itemTotal = this.roundToTwoDecimals(price * qty);
        const description = item.description || '';
        const measurement = item.measurement || {};
        const width = measurement.width || item.measurementWidth;
        const height = measurement.height || item.measurementHeight;
        const unit = measurement.unit || item.measurementUnit || 'inches';

        let measurementHTML = '';
        if (width && height) {
          measurementHTML = `
            <br>
            <small class="measurement">
              📐 ${width} × ${height} ${unit}
            </small>
          `;
        }

        itemsHTML += `
          <tr>
            <td class="item-name">
              ${itemName}
              ${description ? `<br><small class="description">${description}</small>` : ''}
              ${measurementHTML}
            </td>
            <td class="qty">${qty}</td>
            <td class="price">₵${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      const isFullyPaid = balance <= 0;
      const statusClass = isFullyPaid ? 'paid' : 'partial';
      const statusText = isFullyPaid ? '✅ PAID IN FULL' : '⏳ PARTIAL PAYMENT';

      let barcodeSVG = '';
      try {
        barcodeSVG = this.generateBarcode(orderId);
      } catch (error) {
        barcodeSVG = `<div class="barcode-label">Order #${orderId}</div>`;
      }

      return `
        <div class="receipt-container ${index < completedOrders.length - 1 ? 'page-break' : ''}">
          <div class="header">
            <div class="logo-container">
              <img src="../../assets/img/asempa.jpg" alt="Asempahfie Graphics" class="logo" />
            </div>
            <div class="shop-name">Assempahfie Graphics</div>
            <div class="info">📍 Kokomlemle, Accra</div>
            <div class="info">📞 0243210009</div>
            <div class="info">📧 afgghana@gmail.com</div>
            <div class="info">👤 Attendant: ${attendant}</div>
          </div>

          <div class="order-number-box">
            <div class="order-id-label">ORDER NUMBER</div>
            <div class="order-id">#${orderId}</div>
          </div>

          <div class="status-badge ${statusClass}">${statusText}</div>

          <div class="customer-info">
            <div class="customer-name">👤 ${customer}</div>
            ${order.customer_id ? `<div><span class="label">Customer ID:</span> ${order.customer_id}</div>` : ''}
          </div>

          <div class="info"><strong>RECEIPT ${index + 1}</strong></div>
          <div class="info">📅 ${new Date(date).toLocaleString()}</div>

          <div class="barcode-container">
            ${barcodeSVG}
            <div class="barcode-label">Order #${orderId}</div>
          </div>

          ${note ? `<div class="note"><strong>📝 Note:</strong> ${note}</div>` : ''}

          <hr class="divider">

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <hr class="divider">

          <div class="payment-details">
            <div class="payment-row">
              <span>Total:</span>
              <strong>₵${orderTotal.toFixed(2)}</strong>
            </div>
            <div class="payment-row">
              <span>Paid:</span>
              <strong>₵${amountPaid.toFixed(2)}</strong>
            </div>
            ${balance > 0 ? `
              <div class="payment-row" style="color: #e74c3c;">
                <span>Balance:</span>
                <strong>₵${balance.toFixed(2)}</strong>
              </div>
            ` : ''}
          </div>

          <div class="payment-method">💳 Payment Method: ${method}</div>

          <div class="balance-info ${statusClass}">
            ${isFullyPaid 
              ? `✅ Fully Paid: ₵${amountPaid.toFixed(2)}` 
              : `⏳ Balance Due: ₵${balance.toFixed(2)}`}
          </div>

          <hr class="divider">

          <div class="thankyou">🙏 Thank you for your patronage!</div>
          <div class="footer">This is your official payment receipt</div>
          <div class="footer">Visit us again at Assempahfie Graphics</div>
          <div class="footer">Receipt ${index + 1} of ${completedOrders.length} | ${new Date().toLocaleDateString()}</div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Batch Receipts (${completedOrders.length})</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 12px;
            padding: 5px;
            width: 80mm;
            margin: 0 auto;
            background: #fff;
          }
          .receipt-container {
            margin-bottom: 15px;
            padding-bottom: 15px;
          }
          .batch-summary {
            text-align: center;
            padding: 10px;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
          }
          .batch-summary h2 {
            margin: 0;
            font-size: 18px;
          }
          .batch-summary .count {
            font-size: 11px;
            color: #666;
          }
          .batch-totals {
            display: flex;
            justify-content: space-around;
            padding: 8px 0;
            font-size: 11px;
          }
          .batch-totals .label { font-weight: normal; }
          .batch-totals .value { font-weight: bold; }
          .header { text-align: center; margin-bottom: 5px; }
          .logo-container { text-align: center; margin-bottom: 5px; }
          .logo { max-width: 60px; height: auto; display: inline-block; }
          .shop-name { font-size: 16px; font-weight: bold; }
          .info { text-align: center; font-size: 10px; margin: 2px 0; }
          .order-number-box {
            text-align: center;
            border: 1px dashed #000;
            padding: 5px;
            margin: 5px 0;
          }
          .order-id-label { font-size: 9px; font-weight: bold; }
          .order-id { font-size: 22px; font-weight: bold; }
          .status-badge {
            text-align: center;
            font-weight: bold;
            padding: 4px 0;
            margin: 4px 0;
            font-size: 12px;
          }
          .status-badge.paid { color: #28a745; }
          .status-badge.partial { color: #d68910; }
          .customer-info {
            background: #f5f5f5;
            padding: 4px;
            margin: 4px 0;
            font-size: 10px;
          }
          .customer-name { font-size: 12px; font-weight: bold; }
          .barcode-container { text-align: center; margin: 4px 0; }
          .barcode-container svg { max-width: 65mm; height: auto; }
          .barcode-label { font-size: 8px; margin-top: 2px; }
          .note { padding: 3px; margin: 4px 0; border: 1px dashed #999; font-size: 10px; }
          .divider { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
          td { padding: 3px 0; vertical-align: top; }
          .item-name { width: 55%; word-break: break-word; }
          .description { color: #555; font-size: 9px; }
          .measurement { color: #777; font-size: 9px; }
          .qty { width: 12%; text-align: center; }
          .price { width: 33%; text-align: right; white-space: nowrap; }
          .payment-details { font-size: 11px; margin: 3px 0; }
          .payment-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .payment-method { text-align: center; font-size: 10px; margin: 4px 0; padding: 3px; border: 1px dashed #999; }
          .balance-info {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin: 4px 0;
            padding: 4px;
          }
          .balance-info.paid { background: #d4edda; color: #155724; }
          .balance-info.partial { background: #fff3cd; color: #856404; }
          .thankyou { text-align: center; font-weight: bold; margin-top: 6px; font-size: 11px; }
          .footer { text-align: center; font-size: 8px; color: #666; margin-top: 3px; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <div class="batch-summary">
          <h2>📋 BATCH RECEIPTS</h2>
          <div class="count">${completedOrders.length} receipt(s) • ${new Date().toLocaleString()}</div>
          <div class="batch-totals">
            <span><span class="label">Total:</span> <span class="value">₵${grandTotal.toFixed(2)}</span></span>
            <span><span class="label">Paid:</span> <span class="value">₵${grandPaid.toFixed(2)}</span></span>
            ${grandBalance > 0 ? `<span><span class="label">Balance:</span> <span class="value">₵${grandBalance.toFixed(2)}</span></span>` : ''}
          </div>
        </div>
        ${receiptsHTML}
      </body>
      </html>
    `;
  }

  toggleMultiOrderPanel(): void {
    this.showMultiOrderPanel = !this.showMultiOrderPanel;
    if (this.showMultiOrderPanel) {
      this.loadMultiOrders();
      this.loadCompletedOrders();
    }
  }

  refreshMultiOrders(): void {
    console.log('🔄 Refreshing multi-orders...');
    
    if (this.activeMultiOrder) {
      const orders = this.cartService.getMultiOrders();
      const stillExists = orders.some(o => o.local_id === this.activeMultiOrder.local_id);
      if (!stillExists) {
        this.activeMultiOrder = null;
        this.cartService.activeOrderId = null;
      }
    }
    
    this.loadMultiOrders();
    this.loadCompletedOrders();
    
    if (this.cartItems.length === 0 && this.activeMultiOrder) {
      const order = this.cartService.getActiveMultiOrder();
      if (order) {
        this.cartService.updateCart(order.cartItems || []);
      }
    }
    
    this.cdr.detectChanges();
  }

  saveCartToActiveOrder(): void {
    if (!this.activeMultiOrder) {
      console.warn('⚠️ No active order to save cart to');
      return;
    }
    
    const orders = this.cartService.getMultiOrders();
    const index = orders.findIndex(o => o.local_id === this.activeMultiOrder.local_id);
    
    if (index !== -1) {
      orders[index].cartItems = [...this.cartItems];
      orders[index].total = this.total;
      this.cartService['saveMultiOrders'](orders);
      console.log('💾 Cart saved to active order:', this.activeMultiOrder.local_id);
    }
  }

  // ===================== SALES REPORT =====================

  getSalesReport(): void {
    if (!this.salesDateFrom && !this.salesDateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }
    
    this.isLoadingSales = true;
    const payload: any = { 
      date_from: this.salesDateFrom, 
      date_to: this.salesDateTo 
    };
    
    if (this.salesCustomerFilter) {
      payload.customer = this.salesCustomerFilter;
    }
    
    this.guestService.getSalesReport(payload).subscribe(
      (response: any) => {
        console.log('📊 Sales Report Response:', response);
        
        if (response.success) {
          this.salesReport = response;
          
          if (this.salesReport.data && this.salesReport.data.length > 0) {
            this.salesReport.orders = this.sortOrdersByDateDescending(this.salesReport.data);
          } else if (this.salesReport.orders && this.salesReport.orders.length > 0) {
            this.salesReport.orders = this.sortOrdersByDateDescending(this.salesReport.orders);
          } else {
            this.salesReport.orders = [];
          }
          
          if (this.salesReport.summary) {
            this.totalSales = this.roundToTwoDecimals(this.salesReport.summary.total_sales || 0);
            this.totalOrders = this.salesReport.summary.total_orders || 0;
            this.averageOrder = this.roundToTwoDecimals(this.salesReport.summary.average_order || 0);
            this.uniqueCustomers = this.salesReport.summary.unique_customers || 0;
            this.totalBalance = this.roundToTwoDecimals(this.salesReport.summary.total_balance || 0);
            this.totalCollected = this.roundToTwoDecimals(this.salesReport.summary.total_collected || 0);
            
            if (this.salesReport.summary.date_stats) {
              const dateStats = this.salesReport.summary.date_stats;
              if (typeof dateStats === 'object') {
                const formattedStats: any = {};
                for (const [key, value] of Object.entries(dateStats)) {
                  if (typeof value === 'object' && value !== null) {
                    formattedStats[key] = value;
                  } else if (typeof value === 'number') {
                    formattedStats[key] = {
                      total: value,
                      balance: 0,
                      collected: value,
                      count: 1
                    };
                  }
                }
                this.salesReport.summary.date_stats = this.sortDailyBreakdownByDateDescending(formattedStats);
              }
            } else {
              this.salesReport.summary.date_stats = this.buildDateStatsFromOrders(this.salesReport.orders);
            }
          }
          
          this.showSalesReport = true;
          console.log('✅ Sales Report processed:', this.salesReport);
          
          if (this.salesCustomerFilter) {
            const customer = this.customers?.find((c: any) => c.id == this.salesCustomerFilter);
            if (customer) {
              this.toastr.success(`Showing orders for ${customer.firstname} ${customer.lastname}`, 'Filter Applied');
            }
          }
        } else {
          this.toastr.warning(response.message || 'No data available', 'Info');
        }
        this.isLoadingSales = false;
        this.cdr.detectChanges();
      },
      (error) => {
        console.error('Error getting sales report:', error);
        this.toastr.error(error.error?.error || 'Failed to get sales report', 'Error');
        this.isLoadingSales = false;
        this.cdr.detectChanges();
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
        <div class="info"><strong>RECEIPT</strong></div>
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
    if (!orderId) {
      this.toastr.warning('Order ID is missing', 'Warning');
      return;
    }

    console.log('🖨️ Printing order:', orderId);

    const parsedOrderId = Number(orderId);

    if (!parsedOrderId || parsedOrderId <= 0) {
      this.toastr.error('Invalid order ID', 'Error');
      return;
    }

    this.cartService.loadHeldOrder(parsedOrderId).subscribe(
      (response: any) => {
        console.log('📦 Order received for printing:', response);

        if (!response) {
          this.toastr.error(`Order #${parsedOrderId} could not be found`, 'Print Error');
          return;
        }

        let items: any[] = [];
        try {
          if (response.items) {
            if (Array.isArray(response.items)) {
              items = response.items;
            } else if (typeof response.items === 'string') {
              items = JSON.parse(response.items);
            } else if (typeof response.items === 'object') {
              items = Array.isArray(response.items) ? response.items : [];
            }
          }
        } catch (error) {
          console.error('❌ Error parsing order items:', error);
          items = [];
        }

        console.log('🛒 Items being printed:', items);

        if (!items || items.length === 0) {
          console.warn(`⚠️ Order #${parsedOrderId} has no items`, response);
          this.toastr.warning(`No items were found for order #${parsedOrderId}`, 'Cannot Print');
          return;
        }

        let customer: any = null;
        const customerId = response.customer || response.customer_id || response.customerId;
        if (customerId && this.customers) {
          customer = this.customers.find((c: any) => c.id == customerId);
        }
        if (!customer && response.customer_data) {
          customer = response.customer_data;
        }

        const currentDate = response.created_at || response.date || response.session || new Date().toISOString();
        const orderIdString = response.id || response.order_id || parsedOrderId;
        const paymentMethod = response.method || response.payment_method || response.paymentMethod || this.createForm?.value?.method || 'Cash';
        const note = response.note || response.notes || '';

        let totalAmount = Number(response.total ?? response.amount ?? response.grand_total ?? 0);
        if (!totalAmount || totalAmount <= 0) {
          totalAmount = items.reduce((sum: number, item: any) => {
            const price = Number(item.price ?? item.unit_price ?? item.amount ?? 0);
            const qty = Number(item.qty ?? item.quantity ?? 1);
            return sum + (price * qty);
          }, 0);
        }

        const discount = Number(response.discount ?? response.discount_percent ?? response.discount_percentage ?? 0);
        let discountAmount = 0;
        if (discount > 0) {
          discountAmount = (discount / 100) * totalAmount;
        }
        const finalTotal = totalAmount - discountAmount;

        let amountPaid = Number(response.amount_paid ?? response.amountPaid ?? response.paid ?? response.collected ?? 0);
        let balance = Number(response.balance ?? response.balance_due ?? response.balanceDue ?? 0);

        if ((response.balance === undefined || response.balance === null) && amountPaid > 0) {
          balance = Math.max(0, finalTotal - amountPaid);
        }
        if (balance <= 0 && amountPaid <= 0 && response.paid_status === 'Success') {
          amountPaid = finalTotal;
        }

        const subtotal = items.reduce((sum: number, item: any) => {
          const price = Number(item.price ?? item.unit_price ?? item.amount ?? 0);
          const qty = Number(item.qty ?? item.quantity ?? 1);
          return sum + (price * qty);
        }, 0);

        let barcodeSVG = '';
        try {
          barcodeSVG = this.generateBarcode(orderIdString);
        } catch (error) {
          console.error('Barcode generation error:', error);
          barcodeSVG = `<div style="text-align:center;font-weight:bold;font-size:11px;">Order #${orderIdString}</div>`;
        }

        let customerHTML = '';
        if (customer) {
          const customerName = `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
          customerHTML = `
            <div class="customer-name">👤 ${customerName || 'Customer'}</div>
            ${customer.customer_id ? `<div><span class="label">Customer ID:</span> ${customer.customer_id}</div>` : ''}
            ${customer.id && !customer.customer_id ? `<div><span class="label">Customer ID:</span> ${customer.id}</div>` : ''}
            ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
            ${customer.email ? `<div><span class="label">✉️ Email:</span> ${customer.email}</div>` : ''}
          `;
        } else {
          const customerName = response.customer_name || response.customerName || (typeof response.customer === 'string' ? response.customer : '');
          customerHTML = `<div class="customer-name">👤 ${customerName || 'Walk-in Customer'}</div>`;
        }

        const itemsHTML = items.map((item: any, index: number) => {
          const itemName = item.name || item.item_name || item.itemName || item.product_name || item.productName || 'N/A';
          const description = item.description || '';
          const qty = Number(item.qty ?? item.quantity ?? 1);
          const price = Number(item.price ?? item.unit_price ?? item.unitPrice ?? item.amount ?? 0);
          const itemTotal = price * qty;

          let measurementHTML = '';
          if (item.width !== undefined && item.width !== null && item.height !== undefined && item.height !== null) {
            measurementHTML = `<br><small class="measurement">📐 ${item.width} x ${item.height} ${item.unit || 'inches'}</small>`;
          }

          return `
            <tr>
              <td class="item-name">
                <strong>${index + 1}. ${itemName}</strong>
                ${description ? `<br><small class="description">${description}</small>` : ''}
                ${measurementHTML}
              </td>
              <td class="qty">${qty}</td>
              <td class="price">₵${itemTotal.toFixed(2)}</td>
            </tr>
          `;
        }).join('');

        const isFullyPaid = balance <= 0;
        const statusHTML = isFullyPaid
          ? `<div class="status-badge paid">✅ PAID IN FULL</div>`
          : `<div class="status-badge partial">⏳ PARTIAL PAYMENT</div>`;

        const receiptContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Receipt - Order #${orderIdString}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              * { box-sizing: border-box; }
              html, body { margin: 0; padding: 0; width: 80mm; }
              body {
                font-family: monospace, 'Courier New', sans-serif;
                font-size: 12px;
                padding: 5px;
                color: #000;
                background: #fff;
              }
              .header { text-align: center; margin-bottom: 5px; }
              .logo-container { text-align: center; margin-bottom: 5px; }
              .logo { max-width: 70px; height: auto; display: inline-block; }
              .shop-name { font-weight: bold; font-size: 16px; margin-bottom: 2px; }
              .info { text-align: center; font-size: 10px; margin: 2px 0; }
              .order-number-box { text-align: center; border: 1px dashed #000; padding: 5px; margin: 5px 0; }
              .order-id-label { font-size: 9px; font-weight: bold; }
              .order-id { font-size: 22px; font-weight: bold; }
              .status-badge { text-align: center; font-weight: bold; padding: 5px 0; margin: 5px 0; }
              .status-badge.paid { color: #28a745; }
              .status-badge.partial { color: #d68910; }
              .customer-info { background: #f5f5f5; padding: 5px; margin: 5px 0; font-size: 10px; border-radius: 3px; }
              .customer-name { font-size: 12px; font-weight: bold; margin-bottom: 3px; }
              .label { font-weight: bold; }
              .barcode-container { text-align: center; margin: 5px 0; padding: 3px 0; }
              .barcode-container svg { max-width: 65mm; height: auto; }
              .barcode-label { font-size: 8px; margin-top: 2px; }
              .note { padding: 4px; margin: 5px 0; border: 1px dashed #999; font-size: 10px; }
              .divider { border: 0; border-top: 1px dashed #000; margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { text-align: left; border-bottom: 1px solid #000; padding: 3px 0; }
              td { padding: 4px 0; vertical-align: top; }
              .item-name { width: 55%; word-break: break-word; }
              .qty { width: 12%; text-align: center; }
              .price { width: 33%; text-align: right; white-space: nowrap; }
              .description { color: #555; font-size: 9px; }
              .measurement { color: #777; font-size: 9px; }
              .payment-details { font-size: 11px; margin: 3px 0; }
              .payment-row { display: flex; justify-content: space-between; margin: 3px 0; }
              .payment-row strong { font-weight: bold; }
              .discount-line { text-align: right; font-size: 10px; color: #666; }
              .total-row { font-size: 14px; font-weight: bold; text-align: right; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
              .payment-method { text-align: center; font-size: 10px; margin: 5px 0; padding: 4px; border: 1px dashed #999; }
              .balance-info { text-align: center; font-weight: bold; font-size: 11px; margin: 5px 0; }
              .outstanding { color: #e74c3c; font-weight: bold; }
              .thankyou { text-align: center; font-weight: bold; margin-top: 8px; font-size: 11px; }
              .footer { text-align: center; font-size: 8px; color: #666; margin-top: 4px; }
              @media print {
                body { width: 80mm; margin: 0; padding: 5px; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-container">
                <img src="../../assets/img/asempa.jpg" alt="Asempahfie Graphics" class="logo">
              </div>
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
            ${statusHTML}
            <div class="customer-info">${customerHTML}</div>
            <div class="info"><strong>RECEIPT</strong></div>
            <div class="info">📅 Date: ${new Date(currentDate).toLocaleString()}</div>
            <div class="barcode-container">${barcodeSVG}<div class="barcode-label">Order #${orderIdString}</div></div>
            ${note ? `<div class="note"><strong>📝 Note:</strong> ${note}</div>` : ''}
            <hr class="divider">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
            <hr class="divider">
            <div class="payment-details">
              <div class="payment-row">
                <span>Subtotal:</span>
                <strong>₵${subtotal.toFixed(2)}</strong>
              </div>
              ${discount > 0 ? `<div class="discount-line">🏷️ Discount (${discount}%): -₵${discountAmount.toFixed(2)}</div>` : ''}
              <div class="total-row">💰 TOTAL: ₵${finalTotal.toFixed(2)}</div>
            </div>
            <div class="payment-method">💳 Payment Method: <strong>${paymentMethod}</strong></div>
            <div class="balance-info">
              ${balance > 0
                ? `💵 Amount Paid: ₵${amountPaid.toFixed(2)}<br>⏳ Balance Due: ₵${balance.toFixed(2)}<br><span class="outstanding">Outstanding Balance</span>`
                : `✅ Fully Paid: ₵${finalTotal.toFixed(2)}<br><span>Paid in Full</span>`
              }
            </div>
            <hr class="divider">
            <div class="thankyou">🙏 Thank you for your patronage!</div>
            ${balance > 0
              ? `<div class="footer outstanding">⚠️ Outstanding balance: ₵${balance.toFixed(2)}</div><div class="footer">Please settle the balance on your next visit.</div>`
              : ''
            }
            <div class="footer">This is your official payment receipt</div>
            <div class="footer">Visit us again at Assempahfie Graphics</div>
            <div class="footer">Payment Receipt | ${new Date().toLocaleDateString()}<br>Order #${orderIdString}</div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=800');
        if (!printWindow) {
          this.toastr.error('Please allow popups to print the receipt', 'Print Error');
          return;
        }
        printWindow.document.open();
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => {
              try { printWindow.close(); } catch (e) { console.warn('Could not close print window:', e); }
            }, 1000);
          } catch (error) {
            console.error('❌ Printing failed:', error);
            this.toastr.error('Unable to print receipt', 'Print Error');
          }
        }, 700);
      },
      (error: any) => {
        console.error(`❌ Failed to load order #${parsedOrderId}:`, error);
        this.toastr.error(error?.error?.error || error?.error?.message || `Failed to retrieve order #${parsedOrderId}`, 'Print Error');
      }
    );
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
    if (!this.customerSearchTerm.trim()) {
      this.filteredCustomers = [...this.customers];
    }
  }

  selectCustomer(customerId: any): void {
    const customer = this.customers.find((c: any) => String(c.id) === String(customerId));
    if (!customer) return;
    this.selectedCustomer = customer;
    this.createForm.patchValue({
      customer: customer.id,
      phone: customer.phone || '',
      firstname: customer.firstname || '',
      lastname: customer.lastname || '',
      email: customer.email || ''
    });
    this.customerSearchTerm = `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
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

  // Sales Report Customer Filter
  salesCustomerFilter: string = '';
  salesCustomerSearchTerm: string = '';
  showSalesCustomerDropdown: boolean = false;
  filteredSalesCustomers: any[] = [];

  filterSalesCustomers(): void {
    const search = (this.salesCustomerSearchTerm || '').trim().toLowerCase();
    if (!search) {
      this.filteredSalesCustomers = this.customers || [];
      return;
    }
    this.filteredSalesCustomers = (this.customers || []).filter((customer: any) => {
      const firstname = String(customer.firstname || '').toLowerCase();
      const lastname = String(customer.lastname || '').toLowerCase();
      const fullName = `${firstname} ${lastname}`.trim();
      const phone = String(customer.phone || '').toLowerCase();
      const email = String(customer.email || '').toLowerCase();
      return (
        firstname.includes(search) ||
        lastname.includes(search) ||
        fullName.includes(search) ||
        phone.includes(search) ||
        email.includes(search)
      );
    });
  }

  selectSalesCustomer(customer: any): void {
    this.salesCustomerFilter = customer.id;
    this.salesCustomerSearchTerm = `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
    this.showSalesCustomerDropdown = false;
    this.getSalesReport();
  }

  clearSalesCustomerFilter(): void {
    this.salesCustomerFilter = '';
    this.salesCustomerSearchTerm = '';
    this.filteredSalesCustomers = this.customers || [];
    this.showSalesCustomerDropdown = false;
    this.getSalesReport();
  }

  openSalesCustomerDropdown(): void {
    this.showSalesCustomerDropdown = true;
    if (!this.salesCustomerSearchTerm.trim()) {
      this.filteredSalesCustomers = this.customers || [];
    }
  }

  getCustomerName(customerId: string): string {
    if (!customerId || !this.customers) return 'Walk-in';
    const customer = this.customers.find((c: any) => c.id == customerId);
    return customer ? `${customer.firstname || ''} ${customer.lastname || ''}`.trim() : 'Walk-in';
  }

  buildDateStatsFromOrders(orders: any[]): any {
    const stats: any = {};
    if (!orders || orders.length === 0) return stats;
    orders.forEach((order: any) => {
      const dateKey = order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : 'Unknown';
      if (!stats[dateKey]) {
        stats[dateKey] = { total: 0, balance: 0, collected: 0, count: 0 };
      }
      const orderTotal = this.roundToTwoDecimals(order.total || 0);
      const orderBalance = this.roundToTwoDecimals(order.balance || 0);
      stats[dateKey].total += orderTotal;
      stats[dateKey].balance += orderBalance;
      stats[dateKey].collected += (orderTotal - orderBalance);
      stats[dateKey].count += 1;
    });
    return this.sortDailyBreakdownByDateDescending(stats);
  }

  sortDailyBreakdownByDateDescending(dateStats: any): any {
    if (!dateStats || typeof dateStats !== 'object') return dateStats;
    const sortedEntries = Object.entries(dateStats).sort((a, b) => b[0].localeCompare(a[0]));
    return Object.fromEntries(sortedEntries);
  }

  sortOrdersByDateDescending(orders: any[]): any[] {
    if (!orders || orders.length === 0) return orders;
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.created_at || a.session || a.date || 0);
      const dateB = new Date(b.created_at || b.session || b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  getSortedDateKeys(dateStats: any): string[] {
    if (!dateStats) return [];
    return Object.keys(dateStats).sort((a, b) => b.localeCompare(a));
  }

  getSortedOrders(): any[] {
    if (!this.salesReport || !this.salesReport.orders) return [];
    return this.sortOrdersByDateDescending(this.salesReport.orders);
  }

  // ===================== PAYMENT CART METHODS =====================

  /**
   * Add current cart to payment cart with all details
   */
addToPaymentCart(): void {
  if (!this.cartItems || this.cartItems.length === 0) {
    this.toastr.warning('Cart is empty', 'Warning');
    return;
  }

  // Calculate subtotal
  const subtotal = this.cartItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;

    return sum + (price * qty);
  }, 0);

  const roundedSubtotal =
    this.roundToTwoDecimals(subtotal);

  // Get discount
  let discount =
    Number(this.createForm?.get('discount')?.value) || 0;

  discount = Math.max(
    0,
    Math.min(100, discount)
  );

  const discountAmount =
    this.roundToTwoDecimals(
      (discount / 100) * roundedSubtotal
    );

  // Final total
  const finalTotal =
    this.roundToTwoDecimals(
      roundedSubtotal - discountAmount
    );

  // Generate unique payment-cart ID
  const orderId =
    'PC_' +
    Date.now() +
    '_' +
    Math.random()
      .toString(36)
      .substring(2, 6);

  const paymentEntry = {
    id: orderId,

    cartItems: this.cartItems.map(item => ({
      ...item,

      description:
        item.description || '',

      measurement:
        item.measurement || null,

      name:
        item.name ||
        item.item_name ||
        'Unknown Item',

      price:
        this.roundToTwoDecimals(
          Number(item.price) || 0
        ),

      qty:
        Number(item.qty) || 1
    })),

    subtotal: roundedSubtotal,

    discount: discount,

    discountAmount: discountAmount,

    total: finalTotal,

    customer:
      this.createForm.value.customer ||
      '',

    note:
      this.createForm.value.note || '',

    table:
      this.createForm.value.table || '',

    method:
      this.createForm.value.method ||
      'Cash',

    holdOrderId:
      this.holdOrderId,

    existingBalance:
      this.roundToTwoDecimals(
        Number(this.existingBalance) || 0
      ),

    isBalancePayment:
      this.isBalancePayment,

    addedAt:
      new Date().toISOString(),

    // Start with FULL payment
    amountToPay: finalTotal,

    isFullPayment: true
  };

  // Add order
  this.paymentCart.push(paymentEntry);

  // Store payment amount
  this.paymentCartAmounts[orderId] =
    finalTotal;

  // Store balance
  this.paymentCartBalances[orderId] = 0;

  // Recalculate cart total
  this.updatePaymentCartTotal();

  // Clear shopping cart
  this.clearCart();

  // Reset order-specific values
  this.holdOrderId = null;
  this.existingBalance = 0;
  this.isBalancePayment = false;

  this.createForm.patchValue({
    discount: 0,
    note: '',
    customer: ''
  });

  // Show payment cart
  this.showPaymentCart = true;

  this.toastr.success(
    `Order added to payment cart. ${this.paymentCart.length} order(s) pending.`,
    'Added to Payment Cart'
  );

  this.cdr.detectChanges();
}
  /**
   * Update amount to pay for a specific order in payment cart
   */
/**
 * Update amount to pay for a specific order in payment cart
 */
/**
 * Update amount to pay for a specific order
 */
updatePaymentCartOrderAmount(orderId: string, amount: any): void {

  const order = this.paymentCart.find(
    (o: any) => o.id === orderId
  );

  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }

  const total = Number(order.total);

  if (!Number.isFinite(total)) {
    console.error('Invalid order total:', order.total);
    return;
  }

  // Convert input to number
  let enteredAmount = parseFloat(String(amount));

  // Empty input
  if (!Number.isFinite(enteredAmount)) {
    enteredAmount = 0;
  }

  // Round to 2 decimal places
  enteredAmount = Math.round(enteredAmount * 100) / 100;

  const totalCents = Math.round(total * 100);
  const enteredCents = Math.round(enteredAmount * 100);

  console.log('================ PAYMENT DEBUG ================');
  console.log('Order ID:', orderId);
  console.log('Order Total:', total);
  console.log('Entered Amount:', enteredAmount);
  console.log('Total Cents:', totalCents);
  console.log('Entered Cents:', enteredCents);
  console.log('===============================================');

  /*
   * ZERO / EMPTY
   */
  if (enteredCents <= 0) {

    this.paymentCartAmounts[orderId] = 0;
    order.amountToPay = 0;
    order.isFullPayment = false;

    this.paymentCartBalances[orderId] =
      Math.round(total * 100) / 100;

    this.updatePaymentCartTotal();
    this.cdr.detectChanges();

    return;
  }

  /*
   * AMOUNT GREATER THAN ORDER TOTAL
   */
  if (enteredCents > totalCents) {

    console.warn('PAYMENT AMOUNT EXCEEDS ORDER TOTAL', {
      orderId,
      total,
      enteredAmount,
      totalCents,
      enteredCents
    });

    this.toastr.warning(
      `Maximum payment for this order is ₵${total.toFixed(2)}`,
      'Warning'
    );

    // Force maximum allowed amount
    enteredAmount = total;

    this.paymentCartAmounts[orderId] = total;
    order.amountToPay = total;
    order.isFullPayment = true;

    this.paymentCartBalances[orderId] = 0;

    this.updatePaymentCartTotal();
    this.cdr.detectChanges();

    return;
  }

  /*
   * VALID PAYMENT
   */
  this.paymentCartAmounts[orderId] = enteredAmount;

  order.amountToPay = enteredAmount;

  order.isFullPayment =
    enteredCents === totalCents;

  /*
   * BALANCE
   */
  const balanceCents =
    Math.max(0, totalCents - enteredCents);

  this.paymentCartBalances[orderId] =
    balanceCents / 100;

  this.updatePaymentCartTotal();

  this.cdr.detectChanges();
}

  /**
   * Set full payment for a specific order
   */
/**
 * Set full payment for a specific order
 */
setOrderFullPayment(orderId: string): void {
  const order = this.paymentCart.find(o => o.id === orderId);

  if (!order) {
    return;
  }

  const total = this.roundToTwoDecimals(
    Number(order.total) || 0
  );

  this.paymentCartAmounts[orderId] = total;
  order.amountToPay = total;
  order.isFullPayment = true;

  this.updatePaymentCartTotal();
  this.cdr.detectChanges();
}
  /**
   * Set half payment for a specific order
   */
 /**
 * Set half payment for a specific order
 */
setOrderHalfPayment(orderId: string): void {
  const order = this.paymentCart.find(o => o.id === orderId);

  if (!order) {
    return;
  }

  const total = this.roundToTwoDecimals(
    Number(order.total) || 0
  );

  const halfAmount = this.roundToTwoDecimals(
    total / 2
  );

  this.paymentCartAmounts[orderId] = halfAmount;
  order.amountToPay = halfAmount;
  order.isFullPayment = false;

  this.updatePaymentCartTotal();
  this.cdr.detectChanges();
}

  /**
   * Get the amount to pay for a specific order
   */
  getOrderAmountToPay(orderId: string): number {
    return this.paymentCartAmounts[orderId] || 0;
  }

  /**
   * Get the balance for a specific order
   */
  getOrderBalance(orderId: string): number {
    const order = this.paymentCart.find(o => o.id === orderId);
    if (!order) return 0;
    const amountToPay = this.paymentCartAmounts[orderId] || 0;
    return this.roundToTwoDecimals(order.total - amountToPay);
  }

  /**
   * Check if an order is fully paid
 /**
 * Check if an order is fully paid
 */
isOrderFullyPaid(orderId: string): boolean {
  const order = this.paymentCart.find(o => o.id === orderId);

  if (!order) {
    return false;
  }

  const totalCents = Math.round(
    this.roundToTwoDecimals(Number(order.total) || 0) * 100
  );

  const amountCents = Math.round(
    this.roundToTwoDecimals(
      Number(this.paymentCartAmounts[orderId]) || 0
    ) * 100
  );

  return amountCents >= totalCents;
}
  /**
   * Remove order from payment cart
   */
  removeFromPaymentCart(index: number): void {
    const order = this.paymentCart[index];
    if (order) {
      delete this.paymentCartAmounts[order.id];
      delete this.paymentCartBalances[order.id];
    }
    this.paymentCart.splice(index, 1);
    this.updatePaymentCartTotal();
    if (this.paymentCart.length === 0) {
      this.showPaymentCart = false;
    }
    this.toastr.info('Order removed from payment cart', 'Removed');
    this.cdr.detectChanges();
  }

  /**
   * Update payment cart total
   */
  updatePaymentCartTotal(): void {
    // Total of all orders (full amounts)
    const totalDue = this.paymentCart.reduce((sum, entry) => {
      return sum + (entry.total || 0);
    }, 0);
    this.paymentCartTotal = this.roundToTwoDecimals(totalDue);
    
    // Also update the payment modal amount if it's open
    if (this.currentPaymentMethod === 'paymentCart') {
      const totalAmounts = this.paymentCart.reduce((sum, order) => {
        const amount = this.paymentCartAmounts[order.id] || 0;
        return sum + amount;
      }, 0);
      this.amountPaid = this.roundToTwoDecimals(totalAmounts);
      this.calculateBalance();
    }
  }

  /**
   * Clear entire payment cart
   */
  clearPaymentCart(): void {
    if (this.paymentCart.length === 0) return;
 
      this.paymentCart = [];
      this.paymentCartAmounts = {};
      this.paymentCartBalances = {};
      this.paymentCartTotal = 0;
      this.showPaymentCart = false;
      this.toastr.info('Payment cart cleared', 'Cleared');
      this.cdr.detectChanges();
    
  }

  /**
   * Process all orders in payment cart - opens payment modal
   */
  processPaymentCart(): void {
    if (this.paymentCart.length === 0) {
      this.toastr.warning('Payment cart is empty', 'Warning');
      return;
    }

    // Calculate total amount to pay based on individual amounts
    let totalAmountToPay = 0;
    let hasZeroAmount = false;
    
    this.paymentCart.forEach(order => {
      const amount = this.paymentCartAmounts[order.id] || 0;
      if (amount <= 0) {
        hasZeroAmount = true;
      }
      totalAmountToPay += amount;
    });
    
    totalAmountToPay = this.roundToTwoDecimals(totalAmountToPay);
    
    if (hasZeroAmount) {
      this.toastr.warning('Some orders have zero amount. Please set amounts for all orders.', 'Warning');
      return;
    }
    
    if (totalAmountToPay <= 0) {
      this.toastr.warning('Total amount to pay must be greater than 0', 'Warning');
      return;
    }
    
    // Show payment modal for the total
    this.currentPaymentMethod = 'paymentCart';
    this.isMultiOrderPayment = true;
    this.pendingMultiOrderId = 'payment_cart_' + Date.now();
    this.amountPaid = totalAmountToPay;
    this.isFullPayment = true;
    this.isPartialPayment = false;
    this.showPaymentModal = true;
    this.calculateBalance();
    this.cdr.detectChanges();
  }

  /**
   * Process payment cart from modal
   */
  processPaymentCartFromModal(): void {
    if (this.paymentCart.length === 0) {
      this.toastr.warning('No orders to process', 'Warning');
      return;
    }

    // Calculate total amount to pay based on individual amounts
    let totalAmountToPay = 0;
    let hasZeroAmount = false;
    const ordersWithAmounts: any[] = [];
    
    this.paymentCart.forEach(order => {
      const amount = this.paymentCartAmounts[order.id] || 0;
      if (amount <= 0) {
        hasZeroAmount = true;
      }
      totalAmountToPay += amount;
      ordersWithAmounts.push({
        order: order,
        amountToPay: amount
      });
    });
    
    totalAmountToPay = this.roundToTwoDecimals(totalAmountToPay);
    
    if (hasZeroAmount) {
      this.toastr.warning('Some orders have zero amount. Please set amounts for all orders.', 'Warning');
      return;
    }
    
    if (totalAmountToPay <= 0) {
      this.toastr.warning('Total amount to pay must be greater than 0', 'Warning');
      return;
    }

    const amountFromModal = this.amountPaid || 0;
    
    // If the modal amount is different, adjust proportionally
    let finalAmounts: { [key: string]: number } = {};
    
    if (amountFromModal !== totalAmountToPay && amountFromModal > 0) {
      // Adjust amounts proportionally
      let remaining = amountFromModal;
      this.paymentCart.forEach((order, index) => {
        const originalAmount = this.paymentCartAmounts[order.id] || 0;
        if (index === this.paymentCart.length - 1) {
          finalAmounts[order.id] = this.roundToTwoDecimals(remaining);
        } else {
          const proportion = originalAmount / totalAmountToPay;
          const adjustedAmount = this.roundToTwoDecimals(amountFromModal * proportion);
          finalAmounts[order.id] = adjustedAmount;
          remaining -= adjustedAmount;
        }
      });
    } else {
      // Use the individual amounts
      this.paymentCart.forEach(order => {
        finalAmounts[order.id] = this.paymentCartAmounts[order.id] || 0;
      });
    }

    this.isProcessingPaymentCart = true;
   
    this.closePaymentModal();

    // Process each order
    const ordersToProcess = [...this.paymentCart];
    let processedCount = 0;
    let failedCount = 0;
    const completedOrders: any[] = [];

    // Show processing toast
    this.toastr.info(`Processing ${ordersToProcess.length} order(s)...`, 'Please wait');

    // Process orders sequentially with their individual amounts
    this.processNextPaymentCartOrderWithAmounts(
      ordersToProcess, 
      0, 
      completedOrders, 
      processedCount, 
      failedCount, 
      finalAmounts
    );
  }

  /**
   * Process payment cart orders sequentially with individual amounts
   */
  private processNextPaymentCartOrderWithAmounts(
    orders: any[],
    index: number,
    completedOrders: any[],
    processedCount: number,
    failedCount: number,
    amounts: { [key: string]: number }
  ): void {
    if (index >= orders.length) {
      // All orders processed
      this.isProcessingPaymentCart = false;
      this.paymentCart = [];
      this.paymentCartAmounts = {};
      this.paymentCartBalances = {};
      this.paymentCartTotal = 0;
      this.showPaymentCart = false;

      // Show results
      if (failedCount > 0) {
        this.toastr.warning(
          `${processedCount} order(s) completed, ${failedCount} failed`,
          'Batch Complete'
        );
      } else {
        this.toastr.success(
          `All ${processedCount} order(s) processed successfully!`,
          'Batch Complete'
        );
      }

      // Print all receipts if there are completed orders
      if (completedOrders.length > 0) {
        setTimeout(() => {
          this.printAllPaymentCartReceipts(completedOrders);
        }, 600);
      }

      this.cdr.detectChanges();
      return;
    }

    const order = orders[index];
    const orderAmount = amounts[order.id] || 0;
    
    console.log(`📊 Processing payment cart order ${index + 1}/${orders.length}: ₵${orderAmount.toFixed(2)}`);

    if (orderAmount <= 0) {
      // Skip this order if amount is 0
      console.log(`⚠️ Skipping order ${index + 1} (amount = 0)`);
      this.processNextPaymentCartOrderWithAmounts(
        orders,
        index + 1,
        completedOrders,
        processedCount,
        failedCount,
        amounts
      );
      return;
    }

    // Prepare order data for backend
    const orderData = {
      id: order.holdOrderId || null,
      cartItems: order.cartItems.map((item: any) => ({
        ...item,
        name: item.name || item.item_name || 'Unknown Item',
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
        description: item.description || '',
        measurement: item.measurement || null,
        total: this.roundToTwoDecimals((Number(item.price) || 0) * (Number(item.qty) || 1))
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      discount_amount: order.discountAmount,
      total: order.total,
      amount_paid: this.roundToTwoDecimals(orderAmount),
      customer: order.customer || '',
      note: order.note || '',
      table: order.table || '',
      method: order.method || 'Cash',
      is_balance_payment: order.isBalancePayment || false,
      existing_balance: order.existingBalance || 0
    };

    console.log(`📤 Sending order ${index + 1} to backend:`, orderData);

    // Send to backend
    this.cartService.holdAndPay(orderData).subscribe({
      next: (response: any) => {
        const orderId = response.id || response.order_id || 'N/A';
        const balance = parseFloat(response.balance) || 0;
        const amountPaidResponse = parseFloat(response.amount_paid) || orderAmount;

        console.log(`✅ Order ${index + 1} processed:`, { orderId, balance });

        // Add to completed orders for printing
        completedOrders.push({
          ...order,
          ...response,
          order_id: orderId,
          amount_paid: amountPaidResponse,
          balance: balance,
          completed_at: new Date().toISOString()
        });

        processedCount++;

        // Process next order
        this.processNextPaymentCartOrderWithAmounts(
          orders,
          index + 1,
          completedOrders,
          processedCount,
          failedCount,
          amounts
        );
      },
      error: (error: any) => {
        console.error(`❌ Failed to process order ${index + 1}:`, error);
        failedCount++;
        this.toastr.error(`Failed to process order ${index + 1}: ${error.error?.error || 'Unknown error'}`, 'Error');

        // Continue with next order
        this.processNextPaymentCartOrderWithAmounts(
          orders,
          index + 1,
          completedOrders,
          processedCount,
          failedCount,
          amounts
        );
      }
    });
  }

  /**
   * Print all payment cart receipts
   */
  printAllPaymentCartReceipts(completedOrders: any[]): void {
    if (!completedOrders || completedOrders.length === 0) {
      this.toastr.warning('No completed orders to print', 'Warning');
      return;
    }

    const combinedContent = this.buildPaymentCartReceiptHTML(completedOrders);
    
    const printWindow = window.open('', '_blank', 'width=400,height=800,scrollbars=yes');
    
    if (!printWindow) {
      this.toastr.error('Please allow popups to print receipts', 'Print Error');
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(combinedContent);
    printWindow.document.close();
    
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
          try {
            printWindow.close();
          } catch (e) {
            console.warn('Could not close print window:', e);
          }
        }, 1000);
      } catch (error) {
        console.error('Printing failed:', error);
        this.toastr.error('Unable to print receipts', 'Print Error');
      }
    }, 700);
  }

  /**
   * Build combined receipt HTML for payment cart orders
   */
  buildPaymentCartReceiptHTML(completedOrders: any[]): string {
    let grandTotal = 0;
    let grandPaid = 0;
    let grandBalance = 0;

    let receiptsHTML = completedOrders.map((order, index) => {
      const items = order.cartItems || [];
      const orderTotal = this.roundToTwoDecimals(order.total || 0);
      const balance = this.roundToTwoDecimals(order.balance || 0);
      const amountPaid = this.roundToTwoDecimals(order.amount_paid || 0);
      const orderId = order.id || order.order_id || 'N/A';
    const customerId = order.customer_id || order.customer || order.customerId;
    const customer = this.getCustomerName(customerId);  
      const method = order.method || 'Cash';
      const note = order.note || '';
      const date = order.completed_at || order.created_at || new Date().toISOString();

      grandTotal += orderTotal;
      grandPaid += amountPaid;
      grandBalance += balance;

      let itemsHTML = '';
      items.forEach((item: any) => {
        const itemName = item.name || item.item_name || 'N/A';
        const qty = item.qty || 1;
        const price = this.roundToTwoDecimals(item.price || 0);
        const itemTotal = this.roundToTwoDecimals(price * qty);
        const description = item.description || '';
        const measurement = item.measurement || {};
        const width = measurement.width || item.measurementWidth;
        const height = measurement.height || item.measurementHeight;
        const unit = measurement.unit || item.measurementUnit || 'inches';

        let measurementHTML = '';
        if (width && height) {
          measurementHTML = `
            <br>
            <small class="measurement">
              📐 ${width} × ${height} ${unit}
            </small>
          `;
        }

        itemsHTML += `
          <tr>
            <td class="item-name">
              ${itemName}
              ${description ? `<br><small class="description">${description}</small>` : ''}
              ${measurementHTML}
            </td>
            <td class="qty">${qty}</td>
            <td class="price">₵${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      const isFullyPaid = balance <= 0;
      const statusText = isFullyPaid ? '✅ PAID IN FULL' : '⏳ PARTIAL PAYMENT';
      const statusClass = isFullyPaid ? 'paid' : 'partial';

      let barcodeSVG = '';
      try {
        barcodeSVG = this.generateBarcode(orderId);
      } catch (error) {
        barcodeSVG = `<div class="barcode-label">Order #${orderId}</div>`;
      }

      const discountAmount = order.discountAmount || 0;
      const subtotal = order.subtotal || 0;

      return `
        <div class="receipt-container ${index < completedOrders.length - 1 ? 'page-break' : ''}">
          <div class="header">
            <div class="shop-name">Assempahfie Graphics</div>
            <div class="info">📍 Kokomlemle, Accra</div>
            <div class="info">📞 0243210009</div>
            <div class="info">📧 afgghana@gmail.com</div>
          </div>

          <div class="order-number-box">
            <div class="order-id-label">ORDER NUMBER</div>
            <div class="order-id">#${orderId}</div>
          </div>

          <div class="status-badge ${statusClass}">${statusText}</div>

          <div class="customer-info">
            <div class="customer-name">👤 ${customer}</div>
          </div>

          <div class="info"><strong>RECEIPT ${index + 1}</strong></div>
          <div class="info">📅 ${new Date(date).toLocaleString()}</div>

          <div class="barcode-container">
            ${barcodeSVG}
            <div class="barcode-label">Order #${orderId}</div>
          </div>

          ${note ? `<div class="note"><strong>📝 Note:</strong> ${note}</div>` : ''}

          <hr class="divider">

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <hr class="divider">

          <div class="payment-details">
            ${discountAmount > 0 ? `
              <div class="payment-row">
                <span>Subtotal:</span>
                <strong>₵${subtotal.toFixed(2)}</strong>
              </div>
              <div class="payment-row" style="color: #666;">
                <span>Discount (${order.discount || 0}%):</span>
                <strong>-₵${discountAmount.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div class="payment-row total-row">
              <span>Total:</span>
              <strong>₵${orderTotal.toFixed(2)}</strong>
            </div>
            <div class="payment-row">
              <span>Paid:</span>
              <strong>₵${amountPaid.toFixed(2)}</strong>
            </div>
            ${balance > 0 ? `
              <div class="payment-row" style="color: #e74c3c;">
                <span>Balance:</span>
                <strong>₵${balance.toFixed(2)}</strong>
              </div>
            ` : ''}
          </div>

          <div class="payment-method">💳 Payment Method: ${method}</div>

          <div class="balance-info ${statusClass}">
            ${isFullyPaid 
              ? `✅ Fully Paid: ₵${amountPaid.toFixed(2)}` 
              : `⏳ Balance Due: ₵${balance.toFixed(2)}`}
          </div>

          <hr class="divider">

          <div class="thankyou">🙏 Thank you for your patronage!</div>
          <div class="footer">This is your official payment receipt</div>
          <div class="footer">Receipt ${index + 1} of ${completedOrders.length}</div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Cart Receipts (${completedOrders.length})</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 12px;
            padding: 5px;
            width: 80mm;
            margin: 0 auto;
            background: #fff;
          }
          .receipt-container {
            margin-bottom: 15px;
            padding-bottom: 15px;
          }
          .header { text-align: center; margin-bottom: 5px; }
          .shop-name { font-size: 16px; font-weight: bold; }
          .info { text-align: center; font-size: 10px; margin: 2px 0; }
          .order-number-box {
            text-align: center;
            border: 1px dashed #000;
            padding: 5px;
            margin: 5px 0;
          }
          .order-id-label { font-size: 9px; font-weight: bold; }
          .order-id { font-size: 22px; font-weight: bold; }
          .status-badge {
            text-align: center;
            font-weight: bold;
            padding: 4px 0;
            margin: 4px 0;
            font-size: 12px;
          }
          .status-badge.paid { color: #28a745; }
          .status-badge.partial { color: #d68910; }
          .customer-info {
            background: #f5f5f5;
            padding: 4px;
            margin: 4px 0;
            font-size: 10px;
          }
          .customer-name { font-size: 12px; font-weight: bold; }
          .barcode-container { text-align: center; margin: 4px 0; }
          .barcode-container svg { max-width: 65mm; height: auto; }
          .barcode-label { font-size: 8px; margin-top: 2px; }
          .note { padding: 3px; margin: 4px 0; border: 1px dashed #999; font-size: 10px; }
          .divider { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
          td { padding: 3px 0; vertical-align: top; }
          .item-name { width: 55%; word-break: break-word; }
          .description { color: #555; font-size: 9px; }
          .measurement { color: #777; font-size: 9px; }
          .qty { width: 12%; text-align: center; }
          .price { width: 33%; text-align: right; white-space: nowrap; }
          .payment-details { font-size: 11px; margin: 3px 0; }
          .payment-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total-row { font-weight: bold; border-top: 1px solid #000; padding-top: 3px; }
          .payment-method { text-align: center; font-size: 10px; margin: 4px 0; padding: 3px; border: 1px dashed #999; }
          .balance-info {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin: 4px 0;
            padding: 4px;
          }
          .balance-info.paid { background: #d4edda; color: #155724; }
          .balance-info.partial { background: #fff3cd; color: #856404; }
          .thankyou { text-align: center; font-weight: bold; margin-top: 6px; font-size: 11px; }
          .footer { text-align: center; font-size: 8px; color: #666; margin-top: 3px; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <div style="text-align:center;padding:10px;border-bottom:2px solid #000;margin-bottom:15px;">
          <h2 style="margin:0;font-size:18px;">📋 PAYMENT CART RECEIPTS</h2>
          <div style="font-size:11px;color:#666;">${completedOrders.length} receipt(s) • ${new Date().toLocaleString()}</div>
          <div style="display:flex;justify-content:space-around;padding:8px 0;font-size:11px;">
            <span>Total: <strong>₵${grandTotal.toFixed(2)}</strong></span>
            <span>Paid: <strong>₵${grandPaid.toFixed(2)}</strong></span>
            ${grandBalance > 0 ? `<span>Balance: <strong>₵${grandBalance.toFixed(2)}</strong></span>` : ''}
          </div>
        </div>
        ${receiptsHTML}
      </body>
      </html>
    `;
  }

  /**
   * Toggle payment cart visibility
   */
  togglePaymentCart(): void {
    this.showPaymentCart = !this.showPaymentCart;
    if (this.showPaymentCart) {
      this.updatePaymentCartTotal();
    }
    this.cdr.detectChanges();
  }

  /**
   * Get count of orders in payment cart
   */
  getPaymentCartCount(): number {
    return this.paymentCart.length;
  }


  // Add these helper methods for the payment cart

/**
 * Get total amount to pay for all orders in payment cart
 */
getPaymentCartTotalToPay(): number {
  let total = 0;
  this.paymentCart.forEach(order => {
    total += this.paymentCartAmounts[order.id] || 0;
  });
  return this.roundToTwoDecimals(total);
}

/**
 * Get total balance for all orders in payment cart
 */
getPaymentCartTotalBalance(): number {
  let total = 0;
  this.paymentCart.forEach(order => {
    total += this.getOrderBalance(order.id);
  });
  return this.roundToTwoDecimals(total);




  
}
// ===================== SAVED CARTS (FOR LATER) =====================

showSavedCarts: boolean = false;
savedCarts: any[] = [];
savedCartSearchTerm: string = '';
filteredSavedCarts: any[] = [];

/**
 * Save current cart for later retrieval
 */
saveCartForLater(): void {
  if (this.cartItems.length === 0) {
    this.toastr.warning('Cart is empty', 'Warning');
    return;
  }

  // Get customer info
  const customerId = this.createForm.value.customer || '';
  let customerName = 'Walk-in Customer';
  let customerPhone = '';

  if (customerId && this.customers) {
    const customer = this.customers.find((c: any) => c.id == customerId);
    if (customer) {
      customerName = `${customer.firstname || ''} ${customer.lastname || ''}`.trim();
      customerPhone = customer.phone || '';
    }
  }

  // If no customer selected, ask for a name
  if (!customerId) {
    const manualName = prompt('Enter customer name for this saved cart:');
    if (!manualName || !manualName.trim()) {
      this.toastr.warning('Customer name is required to save cart', 'Warning');
      return;
    }
    customerName = manualName.trim();
  }

  // Calculate totals
  const subtotal = this.cartItems.reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * (Number(item.qty) || 0));
  }, 0);

  let discount = Number(this.createForm.value.discount) || 0;
  discount = Math.max(0, Math.min(100, discount));
  const discountAmount = (discount / 100) * subtotal;
  const finalTotal = this.roundToTwoDecimals(subtotal - discountAmount);

  const saved = this.cartService.saveCartForLater({
    customerId: customerId || undefined,
    customerName: customerName,
    customerPhone: customerPhone,
    note: this.createForm.value.note || '',
    table: this.createForm.value.table || '',
    discount: discount,
    cartItems: this.cartItems,
    subtotal: this.roundToTwoDecimals(subtotal),
    total: finalTotal,
    existingBalance: this.existingBalance || 0,
    holdOrderId: this.holdOrderId || null
  });

  // Clear the active cart
  this.clearCart();
  this.createForm.patchValue({
    discount: 0,
    note: '',
    customer: ''
  });
  this.customerSearchTerm = '';
  this.selectedCustomer = null;

  this.loadSavedCarts();
  this.toastr.success(
    `Cart saved for ${customerName}. Retrieve it anytime from Saved Carts.`,
    'Saved for Later'
  );
  this.cdr.detectChanges();
}

/**
 * Load all saved carts
 */
loadSavedCarts(): void {
  this.savedCarts = this.cartService.getSavedCarts();
  this.filteredSavedCarts = [...this.savedCarts];
  this.cdr.detectChanges();
}

/**
 * Toggle saved carts panel
 */
toggleSavedCarts(): void {
  this.showSavedCarts = !this.showSavedCarts;
  if (this.showSavedCarts) {
    this.loadSavedCarts();
  }
  this.cdr.detectChanges();
}

/**
 * Filter saved carts by search term
 */
filterSavedCarts(): void {
  const term = (this.savedCartSearchTerm || '').trim().toLowerCase();
  if (!term) {
    this.filteredSavedCarts = [...this.savedCarts];
    return;
  }
  this.filteredSavedCarts = this.savedCarts.filter((cart: any) => {
    const name = (cart.customerName || '').toLowerCase();
    const phone = (cart.customerPhone || '').toLowerCase();
    const note = (cart.note || '').toLowerCase();
    return name.includes(term) || phone.includes(term) || note.includes(term);
  });
}

/**
 * Retrieve (load) a saved cart into the active cart
 */
retrieveSavedCart(savedCartId: string): void {
  if (this.cartItems.length > 0) {
    if (!confirm('Current cart has items. Clear and load saved cart?')) {
      return;
    }
  }

  const saved = this.cartService.loadSavedCart(savedCartId);
  if (!saved) {
    this.toastr.error('Saved cart not found', 'Error');
    return;
  }

  // Restore form values
  this.createForm.patchValue({
    customer: saved.customerId || '',
    note: saved.note || '',
    table: saved.table || '',
    discount: saved.discount || 0
  });

  // Restore customer search term
  if (saved.customerId && this.customers) {
    const customer = this.customers.find((c: any) => c.id == saved.customerId);
    if (customer) {
      this.customerSearchTerm = `${customer.firstname} ${customer.lastname}`.trim();
      this.selectedCustomer = customer;
    }
  }

  // Restore balance / held order info
  this.existingBalance = saved.existingBalance || 0;
  this.holdOrderId = saved.holdOrderId || null;
  this.isBalancePayment = this.existingBalance > 0;

  // Recalculate total
  this.recalculateTotal();

  // Delete the saved cart (since it's now active)
  this.cartService.deleteSavedCart(savedCartId);
  this.loadSavedCarts();

  this.toastr.success(
    `Loaded cart for ${saved.customerName}`,
    'Cart Retrieved'
  );
  this.cdr.detectChanges();
}

/**
 * Delete a saved cart
 */
deleteSavedCart(savedCartId: string, event?: Event): void {
  if (event) event.stopPropagation();
  if (!confirm('Delete this saved cart permanently?')) return;
  
  const deleted = this.cartService.deleteSavedCart(savedCartId);
  if (deleted) {
    this.loadSavedCarts();
    this.toastr.info('Saved cart deleted', 'Removed');
  }
}

/**
 * Clear all saved carts
 */
clearAllSavedCarts(): void {
  if (!confirm('Delete ALL saved carts? This cannot be undone.')) return;
  this.cartService.clearSavedCarts();
  this.loadSavedCarts();
  this.toastr.info('All saved carts cleared', 'Cleared');
}
}