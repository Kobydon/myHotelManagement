// my-payments.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GuestService } from 'app/services/guest.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.css']
})
export class MyPaymentsComponent implements OnInit, OnDestroy {
  payments: any[] = [];
  filteredPayments: any[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Filter states
  filterStatus: string = 'all';
  filterPaymentStatus: string = 'all';
  
  // Date Filter Properties
  dateFrom: string = '';
  dateTo: string = '';
  dateFilterType: string = 'all'; // all, today, yesterday, week, month, custom
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  
  // Statistics
  totalPaid: number = 0;
  totalBalance: number = 0;
  totalOrders: number = 0;
  
  // Selected payment for detail view
  selectedPayment: any = null;
  showPaymentDetail: boolean = false;
  
  // Refresh interval
  private refreshInterval: any;

  // Status colors
  statusColors: { [key: string]: string } = {
    'Completed': '#27ae60',
    'Pending': '#f39c12',
    'Failed': '#e74c3c',
    'Processing': '#3498db',
    'Confirmed': '#2ecc71',
    'Cancelled': '#e74c3c'
  };

  paymentStatusColors: { [key: string]: string } = {
    'Completed': '#27ae60',
    'Pending': '#f39c12',
    'Failed': '#e74c3c'
  };

  statusIcons: { [key: string]: string } = {
    'Completed': '✅',
    'Pending': '⏳',
    'Failed': '❌',
    'Processing': '🔄',
    'Confirmed': '✔️',
    'Cancelled': '🚫'
  };

  // Date filter options
  dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  constructor(
    private guestService: GuestService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Set default date range (last 30 days)
    this.setDefaultDateRange();
    this.loadPayments();
    
    // Auto-refresh every 60 seconds
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadPayments(false);
      }
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Set default date range (last 30 days)
   */
  setDefaultDateRange(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.dateTo = this.formatDate(today);
    this.dateFrom = this.formatDate(thirtyDaysAgo);
    this.dateFilterType = 'all';
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
   * Format date for display
   */
  formatDisplayDate(dateString: string): string {
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

  /**
   * Set date filter with quick shortcuts
   */
  setDateFilter(type: string): void {
    this.dateFilterType = type;
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch(type) {
      case 'all':
        // Show all payments
        this.dateFrom = '';
        this.dateTo = '';
        break;
      case 'today':
        from = new Date(today);
        to = new Date(today);
        this.dateFrom = this.formatDate(from);
        this.dateTo = this.formatDate(to);
        break;
      case 'yesterday':
        from = new Date(today);
        from.setDate(today.getDate() - 1);
        to = new Date(from);
        this.dateFrom = this.formatDate(from);
        this.dateTo = this.formatDate(to);
        break;
      case 'week':
        from = new Date(today);
        from.setDate(today.getDate() - 7);
        to = new Date(today);
        this.dateFrom = this.formatDate(from);
        this.dateTo = this.formatDate(to);
        break;
      case 'month':
        from = new Date(today);
        from.setDate(today.getDate() - 30);
        to = new Date(today);
        this.dateFrom = this.formatDate(from);
        this.dateTo = this.formatDate(to);
        break;
      case 'custom':
        // Keep existing custom dates
        break;
      default:
        return;
    }

    this.applyFilters();
    this.toastr.info(`Showing payments for: ${this.getDateFilterLabel(type)}`, 'Filter Applied');
  }

  /**
   * Get label for date filter
   */
  getDateFilterLabel(type: string): string {
    const option = this.dateFilterOptions.find(opt => opt.value === type);
    return option ? option.label : 'All Time';
  }

  /**
   * Apply custom date filter
   */
  applyCustomDateFilter(): void {
    if (!this.dateFrom && !this.dateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }
    this.dateFilterType = 'custom';
    this.applyFilters();
    this.toastr.info('Custom date filter applied', 'Filter Applied');
  }

  /**
   * Clear date filter
   */
  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.dateFilterType = 'all';
    this.applyFilters();
    this.toastr.info('Date filter cleared', 'Info');
  }

  async loadPayments(showLoading: boolean = true) {
    if (showLoading) {
      this.isLoading = true;
    }
    
    try {
      const res: any = await this.guestService.getCustomerPayments().toPromise();
      
      if (res && res.success && res.payments) {
        this.payments = res.payments;
        this.applyFilters();
        console.log('✅ Payments loaded:', this.payments.length);
      } else {
        this.payments = [];
        this.filteredPayments = [];
        this.totalItems = 0;
        this.resetStats();
      }
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      this.toastr.error('Failed to load payment history');
      this.payments = [];
      this.filteredPayments = [];
      this.totalItems = 0;
      this.resetStats();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  calculateStats() {
    this.totalOrders = this.filteredPayments.length;
    this.totalPaid = this.filteredPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    this.totalBalance = this.filteredPayments.reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  resetStats() {
    this.totalOrders = 0;
    this.totalPaid = 0;
    this.totalBalance = 0;
  }

  applyFilters() {
    let filtered = [...this.payments];
    
    // Filter by date range
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(this.dateFrom);
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59);

      filtered = filtered.filter(payment => {
        if (!payment.created_at) return false;
        const paymentDate = new Date(payment.created_at);
        return paymentDate >= fromDate && paymentDate <= toDate;
      });
    }
    
    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(payment => 
        payment.status?.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }
    
    // Filter by payment status
    if (this.filterPaymentStatus !== 'all') {
      filtered = filtered.filter(payment => 
        payment.payment_status?.toLowerCase() === this.filterPaymentStatus.toLowerCase()
      );
    }
    
    // Search by order ID, customer name, or item name
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(payment => {
        const matchId = payment.order_id?.toString().includes(term);
        const matchCustomer = payment.customer?.toLowerCase().includes(term);
        const matchItems = payment.items?.some((item: any) => 
          item.name?.toLowerCase().includes(term)
        );
        return matchId || matchCustomer || matchItems;
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    this.filteredPayments = filtered;
    this.totalItems = this.filteredPayments.length;
    this.calculateStats();
    this.currentPage = 1;
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] || '#95a5a6';
  }

  getStatusIcon(status: string): string {
    return this.statusIcons[status] || '📋';
  }

  getPaymentStatusColor(status: string): string {
    return this.paymentStatusColors[status] || '#95a5a6';
  }

  formatCurrency(amount: number): string {
    if (amount === undefined || amount === null) return '₵0.00';
    return '₵' + amount.toFixed(2);
  }

  getPaymentSummary(payment: any): string {
    if (!payment.items) return '0 items';
    return payment.item_count + ' items';
  }

  getItemNames(payment: any): string {
    if (!payment.items || payment.items.length === 0) return 'No items';
    return payment.items.map((item: any) => item.name).join(', ');
  }

  getOrderType(payment: any): string[] {
    const types = [];
    if (payment.contain_food === 'yes') types.push('🍽️ Food');
    if (payment.contain_drink === 'yes') types.push('🥤 Drink');
    if (payment.contain_dtf === 'yes') types.push('👕 DTF');
    if (payment.contain_digital_printing === 'yes') types.push('🖨️ Digital');
    if (payment.contain_large_format === 'yes') types.push('🖼️ Large');
    if (payment.contain_label === 'yes') types.push('🏷️ Label');
    return types.length > 0 ? types : ['📦 General'];
  }

  viewPaymentDetail(payment: any) {
    this.selectedPayment = payment;
    this.showPaymentDetail = true;
    document.body.style.overflow = 'hidden';
  }

  closePaymentDetail() {
    this.showPaymentDetail = false;
    this.selectedPayment = null;
    document.body.style.overflow = 'auto';
  }

  viewOrder(orderId: number) {
    this.closePaymentDetail();
    this.router.navigate(['/customer-item-list', orderId]);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  refreshPayments() {
    this.loadPayments();
    this.toastr.info('Refreshing payment history...');
  }

  getPaginatedPayments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPayments.slice(start, end);
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
}