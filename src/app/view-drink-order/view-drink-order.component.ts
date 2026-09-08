import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'view-drink-order',
  templateUrl: './view-drink-order.component.html',
  styleUrls: ['./view-drink-order.component.css']
})
export class ViewDrinkOrderComponent implements OnInit, OnDestroy {
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
  
  // Process Selection Properties - ALL NEW OPTIONS
  processCutting: boolean = false;
  processTrimming: boolean = false;
  processCreasing: boolean = false;
  processMatteLaminationOneSide: boolean = false;
  processMatteLaminationBothSides: boolean = false;
  processGlossLaminationOneSide: boolean = false;
  processGlossLaminationBothSides: boolean = false;
  processPouchLamination: boolean = false;
  
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
    // this.intervalId = setInterval(() => {
    //   if (document.visibilityState === 'visible') {
    //     console.log("🕒 Auto-refreshing large format orders...");
    //     this.loadHeldOrders();
    //     this.loadProcessedOrders();
    //   }
    // }, 80000);
    
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

  // ===================== MEASUREMENT HELPER METHODS =====================

  /**
   * Get measurement width from either nested or flat structure
   */
  getMeasurementWidth(item: any): string {
    if (!item) return 'N/A';
    // Check nested measurement object
    if (item.measurement?.width !== undefined && item.measurement?.width !== null) {
      return item.measurement.width.toString();
    }
    // Check flat measurement fields
    if (item.measurementWidth !== undefined && item.measurementWidth !== null) {
      return item.measurementWidth.toString();
    }
    return 'N/A';
  }

  /**
   * Get measurement height from either nested or flat structure
   */
  getMeasurementHeight(item: any): string {
    if (!item) return 'N/A';
    if (item.measurement?.height !== undefined && item.measurement?.height !== null) {
      return item.measurement.height.toString();
    }
    if (item.measurementHeight !== undefined && item.measurementHeight !== null) {
      return item.measurementHeight.toString();
    }
    return 'N/A';
  }

  /**
   * Get measurement unit from either nested or flat structure
   */
  getMeasurementUnit(item: any): string {
    if (!item) return '';
    if (item.measurement?.unit) return item.measurement.unit;
    if (item.measurementUnit) return item.measurementUnit;
    return '';
  }

  /**
   * Get measurement area from either nested or flat structure
   */
  getMeasurementArea(item: any): number | null {
    if (!item) return null;
    if (item.measurement?.area !== undefined && item.measurement?.area !== null) {
      return item.measurement.area;
    }
    if (item.measurementArea !== undefined && item.measurementArea !== null) {
      return item.measurementArea;
    }
    return null;
  }

  /**
   * Check if item has measurement data
   */
  hasMeasurementData(item: any): boolean {
    if (!item) return false;
    // Check if there's measurement data in either structure
    const hasNested = item.measurement && (
      item.measurement.width !== undefined || 
      item.measurement.height !== undefined ||
      item.measurement.area !== undefined
    );
    const hasFlat = (item.measurementWidth !== undefined && item.measurementWidth !== null) ||
                    (item.measurementHeight !== undefined && item.measurementHeight !== null) ||
                    (item.measurementArea !== undefined && item.measurementArea !== null);
    return !!(hasNested || hasFlat);
  }

  /**
   * Get formatted measurement display string
   */
  getMeasurementDisplay(item: any): string {
    if (!this.hasMeasurementData(item)) return '';
    const width = this.getMeasurementWidth(item);
    const height = this.getMeasurementHeight(item);
    const unit = this.getMeasurementUnit(item);
    if (width === 'N/A' && height === 'N/A') return '';
    return `${width}×${height}${unit}`;
  }

  /**
   * Get formatted area display string
   */
  getAreaDisplay(item: any): string {
    const area = this.getMeasurementArea(item);
    if (area === null) return '';
    const unit = this.getMeasurementUnit(item);
    return `${area.toFixed(2)} sq ${unit}`;
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
      this.filteredProcessedOrders = [];
      return;
    }

    let filtered = [...this.processedOrders];

    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(this.dateFrom);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter(order => {
        if (!order.created_at) {
          return false;
        }

        const orderDate = new Date(order.created_at);

        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    // Sort newest dates first
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return dateB - dateA;
    });

    this.filteredProcessedOrders = filtered;

    this.cdr.detectChanges();

    console.log(
      `📅 Filtered processed orders: ${filtered.length} of ${this.processedOrders.length}`
    );
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
   * Load held large format orders from the server
   */
  async loadHeldOrders() {
    try {
      // this.isLoading = true;
      const res = await this.guestService.getHeldOrdersDrinks();
      
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
            expanded: true,
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
        console.log("✅ Large Format Orders Loaded:", this.itemList.length, "orders");
      }
    } catch (error) {
      console.error("❌ Error loading large format orders:", error);
      this.toastr.error('Failed to load orders', 'Error');
    } finally {
      // this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Load processed large format orders from the server
   */
  async loadProcessedOrders() {
    try {
      const res = await this.guestService.getHeldOrdersProcessedDrinks();
      
      if (res && Array.isArray(res)) {
        let parsedOrders = res.map(order => {
          let items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
          
          const customerName = this.getCustomerName(order.customer);
          
          return { 
            ...order, 
            items, 
            expanded: true,
            customer_name: customerName,
            customer_details: this.getCustomerDetails(order.customer)
          };
        });

        this.processedOrders = parsedOrders;
        this.filteredProcessedOrders = [...parsedOrders];
        
        if (this.dateFrom && this.dateTo) {
          this.filterProcessedOrders();
        }
        
        console.log("✅ Processed Large Format Orders Loaded:", this.processedOrders.length, "orders");
      }
    } catch (error) {
      console.error("❌ Error loading processed orders:", error);
      this.toastr.error('Failed to load processed orders', 'Error');
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
   * Confirm order with name prompt - Reset all checkboxes
   */
  confirmOrderWithName(orderId: any): void {
    const order = this.itemList.find(o => o.id === orderId);

    if (!order) {
      this.toastr.error('Order not found', 'Error');
      return;
    }

    this.orderToConfirm = order;
    this.showConfirmModal = true;

    // Reset confirmation fields
    this.confirmName = '';
    // Reset ALL process checkboxes
    this.processCutting = false;
    this.processTrimming = false;
    this.processCreasing = false;
    this.processMatteLaminationOneSide = false;
    this.processMatteLaminationBothSides = false;
    this.processGlossLaminationOneSide = false;
    this.processGlossLaminationBothSides = false;
    this.processPouchLamination = false;
    this.showNameError = false;
  }

  /**
   * Submit confirmation - Processes are now OPTIONAL
   */
  async submitConfirmation(): Promise<void> {
    if (!this.confirmName || this.confirmName.trim() === '') {
      this.showNameError = true;
      this.toastr.warning('Please enter your full name', 'Required');
      return;
    }

    // Build selected processes from checkboxes - ALL OPTIONAL
    const processes: string[] = [];

    if (this.processCutting) {
      processes.push('Cutting');
    }

    if (this.processTrimming) {
      processes.push('Trimming');
    }

    if (this.processCreasing) {
      processes.push('Creasing');
    }

    if (this.processMatteLaminationOneSide) {
      processes.push('Matte Lamination (1 Side)');
    }

    if (this.processMatteLaminationBothSides) {
      processes.push('Matte Lamination (Both Sides)');
    }

    if (this.processGlossLaminationOneSide) {
      processes.push('Gloss Lamination (1 Side)');
    }

    if (this.processGlossLaminationBothSides) {
      processes.push('Gloss Lamination (Both Sides)');
    }

    if (this.processPouchLamination) {
      processes.push('Pouch Lamination');
    }

    // Process selection is now OPTIONAL - no validation required
    // If no processes selected, just proceed with empty array

    this.showNameError = false;

    try {
      const orderId = this.orderToConfirm.id;

      const order = {
        id: orderId,
        confirmed_by: this.confirmName.trim(),
        process: processes  // Can be empty array
      };

      const res = await this.guestService.confirmOrder(order);

      if (res) {
        // Update local order with processes
        const updatedOrder = this.itemList.find(o => o.id === orderId);
        if (updatedOrder) {
          updatedOrder.process = processes;
        }

        this.toastr.success(
          `Order #${orderId} confirmed by ${this.confirmName}`,
          'Success'
        );

        this.printConfirmedOrder(
          this.orderToConfirm,
          this.confirmName,
          processes
        );

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
   * Close confirm modal - Reset all checkboxes
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.orderToConfirm = null;
    this.confirmName = '';
    // Reset ALL process checkboxes
    this.processCutting = false;
    this.processTrimming = false;
    this.processCreasing = false;
    this.processMatteLaminationOneSide = false;
    this.processMatteLaminationBothSides = false;
    this.processGlossLaminationOneSide = false;
    this.processGlossLaminationBothSides = false;
    this.processPouchLamination = false;
    this.showNameError = false;
  }

  /**
   * Get formatted process display
   */
  getProcessDisplay(processes: string[]): string {
    if (!processes || processes.length === 0) {
      return 'No processes selected';
    }
    return processes.join(' & ');
  }

  // ===================== RECEIPT PRINTING =====================

  /**
   * Print confirmed order receipt
   */
  printConfirmedOrder(order: any, confirmedBy: string, processes: string[]): void {
    const currentDate = new Date().toLocaleString();
    const customer = order.customer_details || null;

    // Format processes for display
    const processDisplay = processes.length > 0 ? processes.join(' & ') : 'No processes selected';

    const printWindow = window.open('', '', 'width=200,height=300');

    if (printWindow) {
      let stickerContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>ORDER STICKER</title>
          <style>
            @media print {
              @page { 
                size: 60mm 90mm; 
                margin: 0; 
              }
              body { margin: 0; }
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              padding: 8px;
              margin: 0;
              width: 60mm;
              min-height: 90mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: white;
            }
            .sticker-container {
              text-align: center;
              width: 100%;
              padding: 5px;
              border: 2px dashed #333;
              border-radius: 8px;
              background: #fafafa;
            }
            .logo-container {
              text-align: center;
              margin-bottom: 5px;
            }
            .logo {
              max-width: 50px;
              height: auto;
              display: inline-block;
            }
            .order-number {
              font-size: 32px;
              font-weight: 900;
              color: #1a1a1a;
              margin: 5px 0;
              letter-spacing: 2px;
              background: #f0f0f0;
              padding: 5px 10px;
              border-radius: 5px;
              display: inline-block;
            }
            .label-order {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .working-on {
              font-size: 13px;
              font-weight: bold;
              color: #2c3e50;
              margin: 5px 0;
              padding: 3px 10px;
              background: #e8f4f8;
              border-radius: 12px;
              display: inline-block;
            }
            .divider {
              border: none;
              border-top: 1px dashed #ccc;
              margin: 6px 0;
            }
            .info-row {
              font-size: 9px;
              color: #555;
              margin: 2px 0;
            }
            .info-row .label {
              font-weight: bold;
            }
            .footer-text {
              font-size: 8px;
              color: #999;
              margin-top: 5px;
              border-top: 1px dotted #ddd;
              padding-top: 5px;
            }
            .confirmed-by {
              font-size: 10px;
              color: #27ae60;
              font-weight: bold;
            }
            .sticker-badge {
              background: #27ae60;
              color: white;
              font-size: 8px;
              padding: 2px 8px;
              border-radius: 10px;
              display: inline-block;
              margin-top: 3px;
            }
            .process-badge {
              background: #3498db;
              color: white;
              font-size: 9px;
              padding: 2px 10px;
              border-radius: 12px;
              display: inline-block;
              margin-top: 3px;
              font-weight: bold;
            }
            .process-badge-cutting {
              background: #e67e22;
            }
            .process-badge-trimming {
              background: #d35400;
            }
            .process-badge-creasing {
              background: #2980b9;
            }
            .process-badge-matte {
              background: #27ae60;
            }
            .process-badge-gloss {
              background: #8e44ad;
            }
            .process-badge-pouch {
              background: #1abc9c;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="sticker-container">
            <div class="logo-container">
              <img src="../../assets/img/asempa.jpg" class="logo" />
            </div>
            
            <div style="font-size: 8px; font-weight: bold; color: #2c3e50; margin-bottom: 3px;">
              Large Format Department
            </div>
            
            <div class="label-order">ORDER STICKER</div>
            
            <div class="order-number">#${order.id}</div>
            
            <div class="divider"></div>
            
            <div class="info-row">
              <span class="label">Customer:</span> ${order.customer || 'Walk-in'}
            </div>
                 
            <div class="info-row">
              <span class="label">Attended by:</span> ${order.waiter || 'Not Assigned'}
            </div>
            
            <div class="info-row">
              <span class="label">Items:</span> ${order.items?.length || 0} items
            </div>
            
            <div class="info-row">
              <span class="label">Total:</span> ₵${order.total}
            </div>
            
            <div class="info-row">
              <span class="label">Date:</span> ${new Date().toLocaleDateString()}
            </div>
            
            <div class="process-badge">
              🔧 ${processDisplay}
            </div>
            
            <div class="divider"></div>
            
            <div class="confirmed-by">
              ✅ Confirmed by: ${confirmedBy}
            </div>
            
            <div class="sticker-badge">CONFIRMED</div>
            
            <div class="footer-text">
              Assempahfie Graphics • Kokomlemle, Accra
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(stickerContent);
      printWindow.document.close();
    } else {
      console.error('Failed to open print window');
      this.toastr.error('Failed to print sticker', 'Error');
    }
  }

  // ===================== ATTACHMENT METHODS =====================

  /**
   * Check if an item has an attachment
   */
  hasAttachment(item: any): boolean {
    return item && item.attachment && (
      item.attachment.base64 || 
      item.attachment.data || 
      item.attachment.url
    );
  }

  /**
   * Get attachment file name
   */
  getAttachmentName(item: any): string {
    if (!item || !item.attachment) return 'No attachment';
    return item.attachment.name || 'Attachment';
  }

  /**
   * Get attachment file type
   */
  getAttachmentType(item: any): string {
    if (!item || !item.attachment) return '';
    return item.attachment.type || '';
  }

  /**
   * Get attachment icon based on file type
   */
  getAttachmentIcon(item: any): string {
    if (!item || !item.attachment) return '📎';
    
    const type = (item.attachment.type || '').toLowerCase();
    const name = (item.attachment.name || '').toLowerCase();
    
    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return '🖼️';
    } else if (type.includes('pdf') || name.endsWith('.pdf')) {
      return '📄';
    } else if (type.includes('word') || type.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) {
      return '📝';
    } else if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
      return '📊';
    } else {
      return '📎';
    }
  }

  /**
   * Get attachment file size formatted
   */
  getAttachmentSize(item: any): string {
    if (!item || !item.attachment || !item.attachment.size) return '';
    
    const size = item.attachment.size;
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Get attachment preview URL (Base64 or direct URL)
   */
  getAttachmentUrl(item: any): string {
    if (!item || !item.attachment) return '';
    
    if (item.attachment.base64) {
      return item.attachment.base64;
    }
    if (item.attachment.url) {
      return item.attachment.url;
    }
    if (item.attachment.data) {
      return item.attachment.data;
    }
    return '';
  }

  /**
   * Check if attachment is an image
   */
  isAttachmentImage(item: any): boolean {
    if (!item || !item.attachment) return false;
    
    const type = (item.attachment.type || '').toLowerCase();
    const name = (item.attachment.name || '').toLowerCase();
    
    return type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/) !== null;
  }

  /**
   * Open attachment in new window or download
   */
  viewAttachment(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (!item || !this.hasAttachment(item)) {
      this.toastr.warning('No attachment available for this item', 'Warning');
      return;
    }
    
    const url = this.getAttachmentUrl(item);
    const name = this.getAttachmentName(item);
    
    if (!url) {
      this.toastr.warning('Attachment data not available', 'Warning');
      return;
    }
    
    if (this.isAttachmentImage(item)) {
      this.openImageModal(url, name);
      return;
    }
    
    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = name || 'attachment';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error viewing attachment:', error);
      this.toastr.error('Failed to view attachment', 'Error');
    }
  }

  /**
   * Open image in modal
   */
  openImageModal(imageUrl: string, imageName: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      cursor: pointer;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = imageName || 'Attachment';
    img.style.cssText = `
      max-width: 100%;
      max-height: 80vh;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      object-fit: contain;
      background: white;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: -40px;
      right: -10px;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = 'rgba(255,255,255,0.3)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'rgba(255,255,255,0.2)';
    };
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '⬇ Download';
    downloadBtn.style.cssText = `
      margin-top: 15px;
      padding: 10px 24px;
      background: #27ae60;
      border: none;
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    `;
    downloadBtn.onmouseover = () => {
      downloadBtn.style.background = '#219a52';
    };
    downloadBtn.onmouseout = () => {
      downloadBtn.style.background = '#27ae60';
    };
    downloadBtn.onclick = (e) => {
      e.stopPropagation();
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    overlay.onclick = () => {
      document.body.removeChild(overlay);
    };
    
    container.onclick = (e) => e.stopPropagation();
    
    container.appendChild(closeBtn);
    container.appendChild(img);
    container.appendChild(downloadBtn);
    overlay.appendChild(container);
    
    document.body.appendChild(overlay);
  }

  // ===================== ITEM CHECKING METHODS =====================

  /**
   * Check an individual item
   */
  async checkItem(orderId: any, itemId: any): Promise<void> {

    console.log('Checking item:', {
      orderId: orderId,
      cartItemId: itemId
    });

    try {
      const response = await this.guestService.checkOrderItem(
        orderId,
        itemId
      );

      console.log('Check item response:', response);

      if (response?.success) {
        console.log(`Item ${itemId} in order ${orderId} checked successfully`);

        // Reload the orders
        await this.loadHeldOrders();

      } else {
        this.toastr.error(
          response?.error || 'Failed to check item',
          'Error'
        );
      }

    } catch (error: any) {
      console.error('Error checking item:', error);

      const message =
        error?.error?.error ||
        error?.message ||
        'Failed to check item';

      this.toastr.error(
        message,
        'Error'
      );
    }
  }

  /**
   * Get who checked the item
   */
  getCheckedBy(item: any): string {
    return item.checked_by || 'Not checked';
  }

  /**
   * Print order as sticker (for processed orders)
   */
  printOrder(order: any): void {
    const confirmedBy = prompt('Enter your full name to print this sticker:');

    if (confirmedBy === null) {
      return;
    }

    const name = confirmedBy.trim();

    if (!name) {
      this.toastr.warning(
        'Name is required to print sticker',
        'Required'
      );
      return;
    }

    const lamination = prompt(
      'Enter process (optional): Cutting, Matte Lamination, Gloss Lamination'
    );

    if (lamination === null) {
      return;
    }

    const process = lamination.trim();

    // Optional process: pass an empty array if nothing was entered
    const processes: string[] = process ? [process] : [];

    this.printConfirmedOrder(order, name, processes);
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
    if (order.large_format_status === 'yes' || order.drink_status === 'yes') {
      return 'Pending';
    } else if (order.large_format_status === 'no' || order.drink_status === 'no') {
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
    this.filteredProcessedOrders = filtered;
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
   * Accept order
   */
  acceptOrder(orderId: any): void {
    if (!confirm(`Are you sure you want to accept Order #${orderId}?`)) {
      return;
    }

    this.guestService.acceptOrder(orderId).then(res => {
      this.toastr.success(`Order #${orderId} accepted`, 'Success');
      this.loadHeldOrders();
    }).catch(err => {
      console.error("❌ Error accepting order:", err);
      this.toastr.error('Failed to accept order', 'Error');
    });
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
    this.router.navigate(['/todays-order-drink']);
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