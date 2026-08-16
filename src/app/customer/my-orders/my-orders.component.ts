// my-orders.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Filter states
  filterStatus: string = 'all';
  filterType: string = 'all';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  // Selected order for detail view
  selectedOrder: any = null;
  showOrderDetail: boolean = false;
  
  // Refresh interval
  private refreshInterval: any;
  private subscription: Subscription = new Subscription();

  // Status mapping
  statusColors: { [key: string]: string } = {
    'Processing': '#f39c12',
    'Pending': '#f39c12',
    'Confirmed': '#3498db',
    'Partially Completed': '#9b59b6',
    'Completed': '#27ae60',
    'Cancelled': '#e74c3c',
    'Printed': '#2ecc71',
    'Cutting': '#e67e22',
    'In Delivery': '#3498db',
    'Delivered': '#27ae60'
  };

  statusIcons: { [key: string]: string } = {
    'Processing': '⏳',
    'Pending': '⏳',
    'Confirmed': '✅',
    'Partially Completed': '🔄',
    'Completed': '🎉',
    'Cancelled': '❌',
    'Printed': '🖨️',
    'Cutting': '✂️',
    'In Delivery': '🚚',
    'Delivered': '📦'
  };

  constructor(
    private guestService: GuestService,
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadOrders(false);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.subscription.unsubscribe();
  }

  async loadOrders(showLoading: boolean = true) {
    if (showLoading) {
      this.isLoading = true;
    }
    
    try {
      const res = await this.guestService.getHoldingOrdersCustomers().toPromise();
      
      if (res && Array.isArray(res)) {
        this.orders = res.map(order => ({
          ...order,
          // Calculate item count
          itemCount: order.items ? order.items.length : 0,
          // Determine if any item has attachment
          hasAttachments: order.items ? order.items.some((item: any) => item.attachment) : false
        }));
        this.totalItems = this.orders.length;
        this.applyFilters();
        console.log('✅ Loaded orders:', this.orders.length);
      } else {
        this.orders = [];
        this.filteredOrders = [];
        this.totalItems = 0;
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      this.toastr.error('Failed to load orders');
      this.orders = [];
      this.filteredOrders = [];
      this.totalItems = 0;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters() {
    let filtered = [...this.orders];
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }
    
    // Filter by type (food, drink, dtf, etc.)
    if (this.filterType !== 'all') {
      switch(this.filterType) {
        case 'food':
          filtered = filtered.filter(order => order.contain_food === 'yes');
          break;
        case 'drink':
          filtered = filtered.filter(order => order.contain_drink === 'yes');
          break;
        case 'dtf':
          filtered = filtered.filter(order => order.contain_dtf === 'yes');
          break;
        case 'digital_printing':
          filtered = filtered.filter(order => order.contain_digital_printing === 'yes');
          break;
        case 'large_format':
          filtered = filtered.filter(order => order.contain_large_format === 'yes');
          break;
        case 'label':
          filtered = filtered.filter(order => order.contain_label === 'yes');
          break;
      }
    }
    
    // Search by order ID, customer name, or item name
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const matchId = order.id?.toString().includes(term);
        const matchCustomer = order.customer?.toLowerCase().includes(term);
        const matchItems = order.items?.some((item: any) => 
          item.name?.toLowerCase().includes(term)
        );
        return matchId || matchCustomer || matchItems;
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    this.filteredOrders = filtered;
    this.totalItems = this.filteredOrders.length;
    this.currentPage = 1;
  }

  getStatusText(item: any): string {
    if (item.confirmed === true) {
      return 'Printed';
    } else if (item.confirmed === false) {
      return 'Processing';
    } else if (item.confirmed === 'cutting') {
      return 'Cutting';
    } else if (item.confirmed === 'delivered') {
      return 'Delivered';
    } else if (item.confirmed === 'in_delivery') {
      return 'In Delivery';
    } else {
      return 'N/A';
    }
  }

  getItemStatusBadge(item: any): string {
    const status = this.getStatusText(item);
    const badgeMap: { [key: string]: string } = {
      'Printed': 'badge-success',
      'Processing': 'badge-warning',
      'Cutting': 'badge-info',
      'Delivered': 'badge-success',
      'In Delivery': 'badge-info',
      'N/A': 'badge-secondary'
    };
    return badgeMap[status] || 'badge-secondary';
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || '#95a5a6';
  }

  getStatusIcon(status: string): string {
    return this.statusIcons[status] || '📋';
  }

  getOrderType(order: any): string[] {
    const types = [];
    if (order.contain_food === 'yes') types.push('🍽️ Food');
    if (order.contain_drink === 'yes') types.push('🥤 Drink');
    if (order.contain_dtf === 'yes') types.push('👕 DTF');
    if (order.contain_digital_printing === 'yes') types.push('🖨️ Digital');
    if (order.contain_large_format === 'yes') types.push('🖼️ Large');
    if (order.contain_label === 'yes') types.push('🏷️ Label');
    return types.length > 0 ? types : ['📦 General'];
  }

  getTotalItems(order: any): number {
    return order.items ? order.items.length : 0;
  }

  getOrderTotal(order: any): number {
    return order.total || 0;
  }

  getItemNames(order: any): string {
    if (!order.items || order.items.length === 0) return 'No items';
    return order.items.map((item: any) => item.name).join(', ');
  }

  viewOrderDetail(order: any) {
    this.selectedOrder = order;
    this.showOrderDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closeOrderDetail() {
    this.showOrderDetail = false;
    this.selectedOrder = null;
    document.body.style.overflow = 'auto';
  }

  reorder(order: any) {
    if (order.items && order.items.length > 0) {
      // Add items to cart
      order.items.forEach((item: any) => {
        const cartItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          description: item.description || '',
          attachment: item.attachment || null,
          family: item.family || '',
          category: item.category || ''
        };
        this.cartService.addToCart(cartItem);
      });
      this.toastr.success('Items added to cart!');
      this.router.navigate(['/checkout']);
    } else {
      this.toastr.warning('No items to reorder');
    }
  }

  trackOrder(order: any) {
    // Navigate to order tracking page or open map
    this.toastr.info(`Tracking order #${order.id}`);
    // You can add more tracking logic here
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  getPaginatedOrders() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOrders.slice(start, end);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPages(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getProgressPercentage(order: any): number {
    if (!order.items || order.items.length === 0) return 0;
    const confirmed = order.items.filter((item: any) => item.confirmed === true).length;
    return Math.round((confirmed / order.items.length) * 100);
  }

  getPaymentStatusBadge(order: any): string {
    if (order.paid_status === 'Success') return 'badge-success';
    if (order.paid_status === 'Pending') return 'badge-warning';
    return 'badge-secondary';
  }

  getPaymentStatusText(order: any): string {
    if (order.paid_status === 'Success') return '✅ Paid';
    if (order.paid_status === 'Pending') return '⏳ Pending';
    return '❓ Unknown';
  }

  refreshOrders() {
    this.loadOrders();
    this.toastr.info('Refreshing orders...');
  }
}