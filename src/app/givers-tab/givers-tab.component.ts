import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'givers-tab',
  templateUrl: './givers-tab.component.html',
  styleUrls: ['./givers-tab.component.css']
})
export class GiversTabComponent implements OnInit, OnDestroy, AfterViewInit {
  // Data Properties
  giversOrders: any[] = [];
  filteredGiversOrders: any[] = [];
  processedOrders: any[] = [];
  filteredProcessedOrders: any[] = [];
  user: any;
  customers: any[] = [];
  
  // UI State
  isLoading: boolean = false;
  expandedOrderId: number | null = null;
  expandedProcessedOrderId: number | null = null;
  searchTerm: string = '';
  selectedStatus: string = 'all';
  
  // Delivery Properties
  showDeliveryModal: boolean = false;
  deliveryOrder: any = null;
  deliveryName: string = '';
  deliveryContact: string = '';
  deliveryAddress: string = '';
  deliveryNote: string = '';
  deliveryStatus: string = 'pending';
  
  // Date Filter Properties
  dateFrom: string = '';
  dateTo: string = '';
  
  // Stats
  totalPending: number = 0;
  totalInDelivery: number = 0;
  totalDelivered: number = 0;
  
  // Barcode Scanner Properties
  barcodeInput: string = '';
  isScanning: boolean = false;
  scannedOrder: any = null;
  showScanResult: boolean = false;
  
  // Auto-refresh
  private refreshInterval: any;

  // Status Options
  statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_delivery', label: 'In Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // Delivery Status Options
  deliveryStatusOptions = [
    { value: 'pending', label: '📋 Pending', color: '#ffc107' },
    { value: 'in_delivery', label: '🚚 In Delivery', color: '#17a2b8' },
    { value: 'delivered', label: '✅ Delivered', color: '#28a745' },
    { value: 'cancelled', label: '❌ Cancelled', color: '#dc3545' }
  ];

  @ViewChild('barcodeInputElement') barcodeInputElement!: ElementRef;

  constructor(
    private guestService: GuestService,
    private userService: userService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadGiversOrders();
    this.loadProcessedOrders();
    this.getUser();
    this.setDefaultDateRange();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log("🔄 Auto-refreshing Givers orders...");
        this.loadGiversOrders();
        this.loadProcessedOrders();
      }
    }, 30000);
  }

  ngAfterViewInit(): void {
    // Focus the barcode input on load
    setTimeout(() => {
      if (this.barcodeInputElement) {
        this.barcodeInputElement.nativeElement.focus();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // ===================== CUSTOMER METHODS =====================

  async loadCustomers() {
    try {
      const res = await this.guestService.getCustomers();
      if (res && Array.isArray(res)) {
        this.customers = res;
      } else {
        this.customers = [];
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      this.customers = [];
    }
  }

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

  getCustomerDetails(customerId: any): any {
    if (!customerId || !this.customers || this.customers.length === 0) {
      return null;
    }
    return this.customers.find((c: any) => c.id == customerId) || null;
  }

  // ===================== DATE FILTER METHODS =====================

  setDefaultDateRange(): void {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(sevenDaysAgo);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
    this.updateStats();
    this.cdr.detectChanges();
  }

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
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.filteredProcessedOrders = [...this.processedOrders];
    this.cdr.detectChanges();
    this.toastr.info('Date filter cleared', 'Info');
  }

  // ===================== LOAD DATA METHODS =====================

  async loadGiversOrders() {
    try {
      this.isLoading = true;
      const res = await this.guestService.getHeldOrdersGivers();
      
      if (res && Array.isArray(res)) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
          
          const customerName = this.getCustomerName(order.customer);
          
          // Set delivery status if not set
          if (!order.delivery_status) {
            order.delivery_status = 'pending';
          }
          
          return { 
            ...order, 
            items, 
            expanded: false,
            customer_name: customerName,
            customer_details: this.getCustomerDetails(order.customer)
          };
        });

        this.giversOrders = parsedOrders;
        this.filteredGiversOrders = [...parsedOrders];
        this.applyFilters();
        this.updateStats();
        console.log("✅ Givers Orders Loaded:", this.giversOrders.length);
      }
    } catch (error) {
      console.error("Error loading Givers orders:", error);
      this.toastr.error('Failed to load Givers orders', 'Error');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async loadProcessedOrders() {
    try {
      const res = await this.guestService.getHeldOrdersGiversProcessed();
      
      if (res && Array.isArray(res)) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
          
          const customerName = this.getCustomerName(order.customer);
          
          if (!order.delivery_status) {
            order.delivery_status = 'delivered';
          }
          
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
        
        this.updateStats();
        console.log("✅ Processed Givers Orders Loaded:", this.processedOrders.length);
      }
    } catch (error) {
      console.error("Error loading processed Givers orders:", error);
      this.toastr.error('Failed to load processed Givers orders', 'Error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) {
        this.user = res;
        console.log("👤 User loaded:", this.user[0]?.firstname);
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }

  // ===================== BARCODE SCANNING METHODS =====================

  /**
   * Handle barcode input from scanner
   * This method is called when a barcode is scanned
   */
  async onBarcodeScanned(event: any): Promise<void> {
    const barcodeValue = event.target.value || event;
    const orderId = barcodeValue.trim();
    
    if (!orderId) {
      return;
    }

    console.log(`📷 Barcode scanned: ${orderId}`);
    this.barcodeInput = orderId;
    this.isScanning = true;
    this.showScanResult = false;

    // Clear the input for next scan
    if (event.target) {
      event.target.value = '';
    }

    // Find the order by ID
    await this.findAndLoadOrder(orderId);
  }

  /**
   * Find an order by ID and open delivery modal
   */
  async findAndLoadOrder(orderId: string | number): Promise<void> {
    const id = Number(orderId);
    
    if (isNaN(id) || id <= 0) {
      this.toastr.warning('Invalid order ID format', 'Error');
      this.isScanning = false;
      return;
    }

    // First, try to find in pending orders
    let order = this.giversOrders.find(o => o.id === id);
    let orderType = 'pending';

    // If not found, try in processed orders
    if (!order) {
      order = this.processedOrders.find(o => o.id === id);
      orderType = 'processed';
    }

    // If still not found, try to load from server
    if (!order) {
      this.toastr.info(`Searching for order #${id}...`, 'Loading');
      
      try {
        // Try to load the held order from server
        const loadedOrder = await this.cartService.loadHeldOrder(id).toPromise();
        
        if (loadedOrder && loadedOrder.items) {
          // Order found on server
          order = {
            ...loadedOrder,
            id: id,
            items: typeof loadedOrder.items === "string" ? JSON.parse(loadedOrder.items) : loadedOrder.items,
            customer_name: this.getCustomerName(loadedOrder.customer),
            customer_details: this.getCustomerDetails(loadedOrder.customer),
            delivery_status: loadedOrder.delivery_status || 'pending',
            expanded: false
          };
          
          // Add to pending orders if not already there
          if (!this.giversOrders.find(o => o.id === id)) {
            this.giversOrders.unshift(order);
            this.filteredGiversOrders = [...this.giversOrders];
            this.applyFilters();
            this.updateStats();
            this.cdr.detectChanges();
          }
          
          this.toastr.success(`Order #${id} found and loaded`, 'Success');
          this.openDeliveryModal(order);
          this.isScanning = false;
          this.showScanResult = true;
          this.scannedOrder = order;
          return;
        } else {
          this.toastr.warning(`Order #${id} not found`, 'Not Found');
          this.isScanning = false;
          return;
        }
      } catch (error) {
        console.error('Error loading order by barcode:', error);
        this.toastr.error(`Order #${id} not found`, 'Error');
        this.isScanning = false;
        return;
      }
    }

    // If order found, open delivery modal
    if (order) {
      this.toastr.success(`Order #${id} found!`, 'Order Found ✅');
      this.scannedOrder = order;
      this.showScanResult = true;
      
      // If order is already delivered, show info
      if (order.delivery_status === 'delivered') {
        this.toastr.info(`Order #${id} was already delivered`, 'Already Delivered');
        // Still open modal to view details
        this.openDeliveryModal(order);
      } else {
        // Open delivery modal for pending or in_delivery orders
        this.openDeliveryModal(order);
      }
      
      // Scroll to the order if it's in the list
      setTimeout(() => {
        const orderElement = document.getElementById(`order-${id}`);
        if (orderElement) {
          orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          orderElement.classList.add('highlight-order');
          setTimeout(() => {
            orderElement.classList.remove('highlight-order');
          }, 3000);
        }
      }, 500);
    }

    this.isScanning = false;
  }

  /**
   * Simulate barcode scan (for testing)
   */
  simulateScan(orderId: string): void {
    if (!orderId || orderId.trim() === '') {
      this.toastr.warning('Please enter an order ID', 'Warning');
      return;
    }
    this.findAndLoadOrder(orderId);
    // Clear input
    this.barcodeInput = '';
  }

  /**
   * Manually enter order ID for scanning
   */
  manualScan(): void {
    if (!this.barcodeInput || this.barcodeInput.trim() === '') {
      this.toastr.warning('Please enter an order ID', 'Warning');
      return;
    }
    this.findAndLoadOrder(this.barcodeInput);
    this.barcodeInput = '';
  }

  /**
   * Handle enter key on barcode input
   */
  onBarcodeInputEnter(event: any): void {
    if (event.key === 'Enter') {
      const value = event.target.value;
      if (value && value.trim() !== '') {
        this.findAndLoadOrder(value);
        event.target.value = '';
      }
    }
  }

  // ===================== DELIVERY METHODS =====================

  openDeliveryModal(order: any): void {
    // Make sure order exists
    if (!order) {
      this.toastr.warning('Order not found', 'Error');
      return;
    }

    this.deliveryOrder = order;
    
    // Pre-fill delivery info if available
    this.deliveryName = order.delivered_by || '';
    this.deliveryContact = order.delivery_contact || '';
    this.deliveryAddress = order.delivery_address || '';
    this.deliveryNote = order.delivery_note || '';
    this.deliveryStatus = order.delivery_status === 'delivered' ? 'delivered' : 'in_delivery';
    
    this.showDeliveryModal = true;
    this.showScanResult = false;
    this.cdr.detectChanges();
  }

  closeDeliveryModal(): void {
    this.showDeliveryModal = false;
    this.deliveryOrder = null;
    this.deliveryName = '';
    this.deliveryContact = '';
    this.deliveryAddress = '';
    this.deliveryNote = '';
    this.deliveryStatus = 'pending';
    this.cdr.detectChanges();
  }

  async submitDelivery(): Promise<void> {
    if (!this.deliveryName || this.deliveryName.trim() === '') {
      this.toastr.warning('Please enter the delivery person\'s name', 'Required');
      return;
    }

    if (!this.deliveryContact || this.deliveryContact.trim() === '') {
      this.toastr.warning('Please enter the delivery contact number', 'Required');
      return;
    }

    try {
      const orderId = this.deliveryOrder.id;
      const deliveryData = {
        id: orderId,
        delivered_by: this.deliveryName.trim(),
        contact: this.deliveryContact.trim(),
        address: this.deliveryAddress.trim(),
        note: this.deliveryNote.trim(),
        status: this.deliveryStatus
      };
      
      const res = await this.guestService.updateDeliveryStatus(deliveryData);
      
      if (res && res.success) {
        // Update local state
        const order = this.giversOrders.find(o => o.id === orderId);
        if (order) {
          order.delivery_status = this.deliveryStatus;
          order.delivered_by = this.deliveryName.trim();
          order.delivery_contact = this.deliveryContact.trim();
          order.delivery_address = this.deliveryAddress.trim();
          order.delivery_note = this.deliveryNote.trim();
          order.delivery_date = new Date().toISOString();
          
          // If delivered, move to processed
          if (this.deliveryStatus === 'delivered') {
            this.giversOrders = this.giversOrders.filter(o => o.id !== orderId);
            this.processedOrders.unshift(order);
            this.filteredProcessedOrders = [...this.processedOrders];
            this.toastr.success(`Order #${orderId} marked as delivered!`, 'Delivered 🎉');
          } else {
            this.toastr.success(`Delivery assigned to ${this.deliveryName}`, 'Delivery Assigned 🚚');
          }
          
          this.applyFilters();
          this.updateStats();
          this.cdr.detectChanges();
        }
      } else {
        this.toastr.error(res?.message || 'Failed to update delivery status', 'Error');
      }
      
      this.closeDeliveryModal();
      await this.loadGiversOrders();
      await this.loadProcessedOrders();
    } catch (err) {
      console.error("Error processing delivery:", err);
      this.toastr.error('Failed to process delivery', 'Error');
    }
  }

  async markAsDelivered(order: any): Promise<void> {
    if (!confirm(`Mark Order #${order.id} as delivered?`)) {
      return;
    }
    
    try {
      const deliveryData = {
        id: order.id,
        delivered_by: order.delivered_by || 'System',
        contact: order.delivery_contact || 'N/A',
        address: order.delivery_address || '',
        note: order.delivery_note || '',
        status: 'delivered'
      };
      
      const res = await this.guestService.updateDeliveryStatus(deliveryData);
      
      if (res && res.success) {
        this.processedOrders.unshift({
          ...order,
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        });
        this.giversOrders = this.giversOrders.filter(o => o.id !== order.id);
        this.filteredProcessedOrders = [...this.processedOrders];
        this.applyFilters();
        this.updateStats();
        this.cdr.detectChanges();
        this.toastr.success(`Order #${order.id} delivered!`, '✅ Delivered');
        
        await this.loadGiversOrders();
        await this.loadProcessedOrders();
      } else {
        this.toastr.error(res?.message || 'Failed to mark as delivered', 'Error');
      }
    } catch (err) {
      console.error("Error marking as delivered:", err);
      this.toastr.error('Failed to mark as delivered', 'Error');
    }
  }

  // ===================== TABLE INTERACTION METHODS =====================

  toggleOrderExpand(order: any, type: string = 'incoming'): void {
    if (type === 'incoming') {
      if (this.expandedOrderId === order.id) {
        this.expandedOrderId = null;
        order.expanded = false;
      } else {
        if (this.expandedOrderId !== null) {
          const prevOrder = this.giversOrders.find(o => o.id === this.expandedOrderId);
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

  getTotalItems(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce((total: number, item: any) => total + (item.qty || 0), 0);
  }

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

  getDeliveryStatusColor(status: string): string {
    const option = this.deliveryStatusOptions.find(o => o.value === status);
    return option?.color || '#6c757d';
  }

  getDeliveryStatusLabel(status: string): string {
    const option = this.deliveryStatusOptions.find(o => o.value === status);
    return option?.label || status || 'Pending';
  }

  // ===================== FILTER & SEARCH METHODS =====================

  applyFilters(): void {
    let filtered = [...this.giversOrders];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => {
        const status = order.delivery_status || 'pending';
        return status === this.selectedStatus;
      });
    }
    
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        if (order.id.toString().includes(term)) return true;
        if (order.waiter?.toLowerCase().includes(term)) return true;
        if (order.customer_name?.toLowerCase().includes(term)) return true;
        if (order.delivered_by?.toLowerCase().includes(term)) return true;
        if (order.items && Array.isArray(order.items)) {
          return order.items.some((item: any) => 
            item.name?.toLowerCase().includes(term) || 
            item.item_name?.toLowerCase().includes(term)
          );
        }
        return false;
      });
    }
    
    this.filteredGiversOrders = filtered;
    this.updateStats();
    this.cdr.detectChanges();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onStatusChange(event: any): void {
    this.selectedStatus = event.target.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.applyFilters();
    this.toastr.info('Filters cleared', 'Info');
  }

  // ===================== STATS METHODS =====================

  updateStats(): void {
    const allOrders = this.giversOrders || [];
    this.totalPending = allOrders.filter(o => o.delivery_status === 'pending' || !o.delivery_status).length;
    this.totalInDelivery = allOrders.filter(o => o.delivery_status === 'in_delivery').length;
    this.totalDelivered = this.processedOrders?.length || 0;
  }

  // ===================== ACTION METHODS =====================

  refreshOrders(): void {
    this.toastr.info('Refreshing orders...', 'Loading');
    this.loadGiversOrders();
    this.loadProcessedOrders();
  }

  logOut(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  // ===================== UTILITY METHODS =====================

  trackByOrderId(index: number, order: any): number {
    return order.id;
  }

  trackByItemId(index: number, item: any): number {
    return item.id || index;
  }

  getDeliveryIcon(status: string): string {
    switch(status) {
      case 'pending': return 'fa-clock-o';
      case 'in_delivery': return 'fa-truck';
      case 'delivered': return 'fa-check-circle';
      default: return 'fa-circle-o';
    }
  }
}