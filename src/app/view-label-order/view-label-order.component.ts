import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'view-label-order',
  templateUrl: './view-label-order.component.html',
  styleUrls: ['./view-label-order.component.css']
})
export class ViewLabelOrderComponent implements OnInit, OnDestroy {
  // Data Properties
  itemList: any[] = [];
  processedOrders: any[] = [];
  filteredProcessedOrders: any[] = [];
  cartItems: any[] = [];
  orderList: any[] = [];
  user: any;
  customers: any[] = [];
  
  // UI State
  isLoading: boolean = false;
  expandedOrderId: number | null = null;
  expandedProcessedOrderId: number | null = null;
  searchTerm: string = '';
  filteredOrders: any[] = [];
  selectedStatus: string = 'all';
  
  // Date Filter Properties
  dateFrom: string = '';
  dateTo: string = '';
  
  // Confirm Modal Properties
  showConfirmModal: boolean = false;
  confirmName: string = '';
  orderToConfirm: any = null;
  showNameError: boolean = false;
  
  // Subscriptions
  heldOrderSub: Subscription;
  intervalId: any;
  
  // Date/Time Properties
  currentDate: Date = new Date();
  currentMonth: string;
  currentTime: string;
  daysInMonth: { date: number }[] = [];
  
  // Status Options
  statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' }
  ];

  constructor(
    private guestService: GuestService,
    private cartService: CartService,
    private userService: userService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Load customers first
    this.loadCustomers();
    
    // Initial load
    this.loadHeldOrders();
    this.loadProcessedOrders();
    this.getUser();
    this.getOrders();
    this.updateTime();
    this.generateCalendar();
    
    // Set default date range (last 7 days)
    this.setDefaultDateRange();
    
    // Auto-refresh every 60 seconds
    this.intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log("🕒 Auto-refreshing label orders...");
        this.loadHeldOrders();
        this.loadProcessedOrders();
      }
    }, 60000);
    
    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.heldOrderSub) {
      this.heldOrderSub.unsubscribe();
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ===================== CUSTOMER METHODS =====================

  /**
   * Load customers from service
   */
  async loadCustomers() {
    try {
      const res = await this.guestService.getCustomers();
      if (res && Array.isArray(res)) {
        this.customers = res;
        console.log("✅ Customers loaded:", this.customers.length);
      } else {
        this.customers = [];
      }
    } catch (err) {
      console.error("❌ Error loading customers:", err);
      this.customers = [];
    }
  }

  /**
   * Get customer name by ID
   */
  getCustomerName(customerId: any): string {
    if (!customerId || !this.customers || this.customers.length === 0) {
      return 'Walk-in';
    }
    
    const customer = this.customers.find((c: any) => c.id == customerId);
    if (customer) {
      return `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 'Walk-in';
    }
    return 'Walk-in';
  }

  /**
   * Get customer details by ID
   */
  getCustomerDetails(customerId: any): any {
    if (!customerId || !this.customers || this.customers.length === 0) {
      return null;
    }
    return this.customers.find((c: any) => c.id == customerId) || null;
  }

  // ===================== DATE FILTER METHODS =====================

  /**
   * Set default date range (last 7 days)
   */
  setDefaultDateRange(): void {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(sevenDaysAgo);
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Filter processed orders by date range
   */
  filterProcessedOrders(): void {
    if (!this.processedOrders || this.processedOrders.length === 0) {
      return;
    }

    let filtered = [...this.processedOrders];

    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(this.dateFrom);
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59);

      filtered = filtered.filter(order => {
        if (!order.created_at) return false;
        const orderDate = new Date(order.created_at);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    this.filteredProcessedOrders = filtered;
    this.cdr.detectChanges();
    console.log(`📅 Filtered processed orders: ${filtered.length} of ${this.processedOrders.length}`);
  }

  /**
   * Set date filter with quick shortcuts
   */
  setDateFilter(period: string): void {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch(period) {
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

    this.dateFrom = this.formatDate(from);
    this.dateTo = this.formatDate(to);
    this.filterProcessedOrders();
    this.toastr.info(`Showing orders for: ${period}`, 'Filter Applied');
  }

  /**
   * Clear date filter
   */
  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.filteredProcessedOrders = [...this.processedOrders];
    this.cdr.detectChanges();
    this.toastr.info('Date filter cleared', 'Info');
  }

  // ===================== LOAD DATA METHODS =====================

  /**
   * Load held label orders from the server
   */
  async loadHeldOrders() {
    try {
      this.isLoading = true;
      const res = await this.guestService.getHeldOrdersLabel();
      
      if (res && Array.isArray(res)) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
          
          items = items.sort((a, b) => {
            return (b.is_vip === "yes" ? 1 : 0) - (a.is_vip === "yes" ? 1 : 0);
          });

          const customerName = this.getCustomerName(order.customer);
          
          return { 
            ...order, 
            items, 
            expanded: false,
            customer_name: customerName,
            customer_details: this.getCustomerDetails(order.customer)
          };
        });

        parsedOrders = parsedOrders.sort((a, b) => {
          const aHasVip = a.items.some(item => item.is_vip === "yes");
          const bHasVip = b.items.some(item => item.is_vip === "yes");
          return (bHasVip ? 1 : 0) - (aHasVip ? 1 : 0);
        });

        this.itemList = parsedOrders;
        this.filteredOrders = [...parsedOrders];
        this.applyFilters();
        console.log("✅ Label Orders Loaded:", this.itemList.length, "orders");
      }
    } catch (error) {
      console.error("❌ Error loading label orders:", error);
      this.toastr.error('Failed to load label orders', 'Error');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Load processed label orders from the server
   */
  async loadProcessedOrders() {
    try {
      const res = await this.guestService.getHeldOrdersLabelProcessed();
      
      if (res && Array.isArray(res)) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
          
          const customerName = this.getCustomerName(order.customer);
          
          return { 
            ...order, 
            items, 
            expanded: false,
            customer_name: customerName,
            customer_details: this.getCustomerDetails(order.customer)
          };
        });

        this.processedOrders = parsedOrders;
        this.filteredProcessedOrders = [...parsedOrders];
        
        if (this.dateFrom && this.dateTo) {
          this.filterProcessedOrders();
        }
        
        console.log("✅ Processed Label Orders Loaded:", this.processedOrders.length, "orders");
      }
    } catch (error) {
      console.error("❌ Error loading processed label orders:", error);
      this.toastr.error('Failed to load processed label orders', 'Error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  /**
   * Load regular orders
   */
  async getOrders() {
    try {
      const res = await this.guestService.getOrdersList();
      if (res) {
        this.orderList = res;
        console.log("✅ Orders loaded:", this.orderList.length);
      }
    } catch (err) {
      console.error("❌ Error loading orders:", err);
    }
  }

  /**
   * Get current user information
   */
  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) {
        this.user = res;
        console.log("👤 User loaded:", this.user[0]?.firstname, this.user[0]?.lastname);
      }
    } catch (err) {
      console.error("❌ Error loading user:", err);
      this.toastr.error('Failed to load user data', 'Error');
    }
  }

  // ===================== CONFIRM ORDER WITH RECEIPT =====================

  /**
   * Confirm order with name prompt
   */
  confirmOrderWithName(orderId: any): void {
    const order = this.itemList.find(o => o.id === orderId);
    if (!order) {
      this.toastr.error('Order not found', 'Error');
      return;
    }

    this.orderToConfirm = order;
    this.showConfirmModal = true;
    this.confirmName = '';
    this.showNameError = false;
  }

  /**
   * Submit confirmation with name
   */
  async submitConfirmation(): Promise<void> {
    if (!this.confirmName || this.confirmName.trim() === '') {
      this.showNameError = true;
      this.toastr.warning('Please enter your full name', 'Required');
      return;
    }

    this.showNameError = false;

    try {
      const orderId = this.orderToConfirm.id;
      const order = { 
        id: orderId,
        confirmed_by: this.confirmName.trim()
      };
      
      const res = await this.guestService.confirmOrder(order);
      
      if (res) {
        this.toastr.success(`Order #${orderId} confirmed by ${this.confirmName}`, 'Success');
        this.printConfirmedOrder(this.orderToConfirm, this.confirmName);
        this.closeConfirmModal();
        this.loadHeldOrders();
        this.loadProcessedOrders();
        this.getOrders();
      }
    } catch (err) {
      console.error("❌ Error confirming order:", err);
      this.toastr.error('Failed to confirm order', 'Error');
    }
  }

  /**
   * Close confirm modal
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.orderToConfirm = null;
    this.confirmName = '';
    this.showNameError = false;
  }

  // ===================== RECEIPT PRINTING =====================

  /**
   * Print confirmed order receipt
   */
  printConfirmedOrder(order: any, confirmedBy: string): void {
    const currentDate = new Date().toLocaleString();
    const customer = order.customer_details || null;

    const printWindow = window.open('', '', 'width=300,height=800');

    if (printWindow) {
      let receiptContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>CONFIRMED LABEL ORDER</title>
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
            .confirmed-info {
              background: #d4edda;
              padding: 8px;
              margin: 5px 0;
              border-radius: 3px;
              text-align: center;
              border: 1px solid #28a745;
            }
            .confirmed-info .label { font-weight: bold; color: #155724; }
            .confirmed-info .name { font-size: 14px; font-weight: bold; color: #155724; }
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
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { padding: 2px 0; word-break: break-word; }
            th { text-align: left; }
            td:last-child, th:last-child { text-align: right; }
            .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 5px; }
            .footer { text-align: center; font-size: 12px; margin-top: 8px; }
            .divider { border: none; border-top: 2px dashed #000; margin: 8px 0; }
            .status-badge {
              display: inline-block;
              background: #28a745;
              color: white;
              padding: 3px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
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
          
          <div class="confirmed-info">
            <div><span class="label">✅ CONFIRMED BY:</span></div>
            <div class="name">${confirmedBy}</div>
            <div style="font-size: 11px; margin-top: 3px;">
              <span class="status-badge">CONFIRMED</span>
            </div>
          </div>
          
          <div class="customer-info">
            ${customer ? `
              <div class="customer-name">👤 ${customer.firstname || ''} ${customer.lastname || ''}</div>
              <div><span class="label">Customer ID:</span> ${customer.id || 'N/A'}</div>
              ${customer.phone ? `<div><span class="label">📱 Phone:</span> ${customer.phone}</div>` : ''}
              ${customer.email ? `<div><span class="label">📧 Email:</span> ${customer.email}</div>` : ''}
            ` : `
              <div>👤 <span class="label">Customer:</span> Walk-in Customer</div>
            `}
          </div>
          
          <div class="info"><strong>🏷️ LABEL ORDER CONFIRMATION</strong></div>
          <div class="info">Order #: ${order.id}</div>
          <div class="info">📅 Date: ${currentDate}</div>
          
          ${order.note ? `
            <div style="text-align:center;font-size:12px;padding:3px;background:#f9f9f9;border-radius:3px;">
              <strong>📝 Note:</strong> ${order.note}
            </div>
          ` : ''}
          
          <hr class="divider" />

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
      `;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
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
      }

      receiptContent += `
            </tbody>
          </table>

          <hr class="divider" />
          <div class="total">💰 Total: ₵${order.total}</div>
          
          <hr class="divider" />
          <div class="footer" style="font-size: 10px; color: #666;">
            Confirmed by: ${confirmedBy}
          </div>
          <div class="footer">━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div class="footer" style="font-size: 10px; color: #666;">
            Thank you for your order!
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    } else {
      console.error('Failed to open print window');
      this.toastr.error('Failed to print receipt', 'Error');
    }
  }

  /**
   * Print order receipt (for processed orders)
   */
  printOrder(order: any): void {
    const confirmedBy = prompt('Enter your full name to print this receipt:');
    
    if (confirmedBy === null) return;
    
    if (!confirmedBy || confirmedBy.trim() === '') {
      this.toastr.warning('Name is required to print receipt', 'Required');
      this.printOrder(order);
      return;
    }

    this.printConfirmedOrder(order, confirmedBy.trim());
  }

  // ===================== TABLE INTERACTION METHODS =====================

  /**
   * Toggle expanded state of an order row
   */
  toggleOrderExpand(order: any, type: string = 'incoming'): void {
    if (type === 'incoming') {
      if (this.expandedOrderId === order.id) {
        this.expandedOrderId = null;
        order.expanded = false;
      } else {
        if (this.expandedOrderId !== null) {
          const prevOrder = this.itemList.find(o => o.id === this.expandedOrderId);
          if (prevOrder) prevOrder.expanded = false;
        }
        this.expandedOrderId = order.id;
        order.expanded = true;
      }
    } else {
      if (this.expandedProcessedOrderId === order.id) {
        this.expandedProcessedOrderId = null;
        order.expanded = false;
      } else {
        if (this.expandedProcessedOrderId !== null) {
          const prevOrder = this.processedOrders.find(o => o.id === this.expandedProcessedOrderId);
          if (prevOrder) prevOrder.expanded = false;
        }
        this.expandedProcessedOrderId = order.id;
        order.expanded = true;
      }
    }
    this.cdr.detectChanges();
  }

  /**
   * Get item names for preview
   */
  getItemNames(items: any[], limit?: number): string {
    if (!items || items.length === 0) return '';
    const names = items.map(item => item.name || item.item_name || 'Unknown');
    if (limit) {
      return names.slice(0, limit).join(', ');
    }
    return names.join(', ');
  }

  /**
   * Get formatted status text
   */
  getStatusText(order: any): string {
    if (order.label_status === 'yes') {
      return 'Pending';
    } else if (order.label_status === 'no') {
      return 'Confirmed';
    } else if (order.status === 'completed' || order.order_status === 'completed') {
      return 'Completed';
    }
    return order.status || order.order_status || 'Unknown';
  }

  /**
   * Get CSS class for status badge
   */
  getStatusClass(order: any): string {
    const status = this.getStatusText(order);
    switch(status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Get total items count
   */
  getTotalItems(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce((total: number, item: any) => total + (item.qty || 0), 0);
  }

  /**
   * Get formatted date
   */
  getFormattedDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // ===================== FILTER & SEARCH METHODS =====================

  /**
   * Apply search and status filters
   */
  applyFilters(): void {
    let filtered = [...this.itemList];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => {
        const status = this.getStatusText(order).toLowerCase();
        return status === this.selectedStatus;
      });
    }
    
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        if (order.id.toString().includes(term)) return true;
        if (order.waiter?.toLowerCase().includes(term)) return true;
        if (order.customer_name?.toLowerCase().includes(term)) return true;
        if (order.items && Array.isArray(order.items)) {
          return order.items.some((item: any) => 
            item.name?.toLowerCase().includes(term) || 
            item.item_name?.toLowerCase().includes(term)
          );
        }
        return false;
      });
    }
    
    this.filteredOrders = filtered;
    this.cdr.detectChanges();
  }

  /**
   * Handle search input change
   */
  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  /**
   * Handle status filter change
   */
  onStatusChange(event: any): void {
    this.selectedStatus = event.target.value;
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.applyFilters();
    this.toastr.info('Filters cleared', 'Info');
  }

  // ===================== ACTION METHODS =====================

  /**
   * Confirm/Print order
   */
  async confirmOrder(id: any): Promise<void> {
    this.confirmOrderWithName(id);
  }

  /**
   * Delete/cancel order
   */
  async deleteOrder(orderId: any): Promise<void> {
    if (!confirm(`Are you sure you want to cancel Order #${orderId}?`)) {
      return;
    }
    
    try {
      this.toastr.success(`Order #${orderId} cancelled`, 'Success');
      this.loadHeldOrders();
    } catch (err) {
      console.error("❌ Error deleting order:", err);
      this.toastr.error('Failed to cancel order', 'Error');
    }
  }

  /**
   * Navigate to today's orders
   */
  checkOrder(): void {
    this.router.navigate(['/todays-order']);
  }

  /**
   * Refresh orders manually
   */
  refreshOrders(): void {
    this.toastr.info('Refreshing orders...', 'Loading');
    this.loadHeldOrders();
    this.loadProcessedOrders();
    this.getOrders();
  }

  // ===================== DATE/TIME METHODS =====================

  /**
   * Update current time
   */
  updateTime(): void {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.toLocaleString('en-GB', { 
      month: 'long', 
      year: 'numeric' 
    });
    this.currentTime = this.currentDate.toLocaleTimeString('en-GB');
    setTimeout(() => this.updateTime(), 1000);
  }

  /**
   * Generate calendar days
   */
  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => ({ date: i + 1 }));
  }

  /**
   * Check if order is today
   */
  isToday(dateString: string): boolean {
    if (!dateString) return false;
    const orderDate = new Date(dateString);
    const today = new Date();
    return orderDate.getDate() === today.getDate() &&
           orderDate.getMonth() === today.getMonth() &&
           orderDate.getFullYear() === today.getFullYear();
  }

  // ===================== UTILITY METHODS =====================

  /**
   * Logout user
   */
  logOut(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
    this.toastr.info('Logged out successfully', 'Goodbye');
  }

  /**
   * Track by function for ngFor
   */
  trackByOrderId(index: number, order: any): number {
    return order.id;
  }

  /**
   * Track by function for items
   */
  trackByItemId(index: number, item: any): number {
    return item.id || index;
  }

  /**
   * Get icon for status
   */
  getStatusIcon(status: string): string {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'fa-clock-o';
      case 'confirmed':
        return 'fa-check-circle';
      case 'completed':
        return 'fa-check-circle-o';
      default:
        return 'fa-circle-o';
    }
  }

  /**
   * Check if order has VIP items
   */
  hasVipItems(order: any): boolean {
    if (!order.items) return false;
    return order.items.some((item: any) => item.is_vip === "yes");
  }
}