import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';


/* ============================================================
   Types
   ============================================================ */

export interface OrderItem {
  name?: string;
  item_name?: string;
  qty?: number;
  price?: number;
  total?: number;
  line_total?: number;
  category?: string;
  family?: string;
  description?: string;
  product?: {
    category?: string;
    family?: string;
  };
  [key: string]: any;
}

export interface OrderRow {
  id: number;
  items: OrderItem[];
  total: number;
  balance: number;
  collected: number;
  waiter?: string;
  customer?: string;
  note?: string;
  status?: string;
  paid_status?: string;
  created_at?: string;
  table?: string;
  item_count?: number;
  /* legacy contain_* fields — kept for backwards compat, no longer used for filtering */
  contain_drink?: string;
  contain_food?: string;
  contain_dtf?: string;
  contain_digital_printing?: string;
  contain_large_format?: string;
  contain_label?: string;
  contain_uvdtf?: string;
}

export interface CategoryStat {
  key: string;
  label: string;
  count: number;
  quantity: number;
  revenue: number;
  collected: number;
  balance: number;
}


@Component({
  selector: 'held-cart-report',
  templateUrl: './held-cart-report.component.html',
  styleUrls: ['./held-cart-report.component.css']
})
export class HeldCartReportComponent implements OnInit, OnDestroy {
  @BlockUI() blockUI!: NgBlockUI;

  /* ============================================================
     REPORT DATA
     ============================================================ */
  reportData: OrderRow[] = [];
  summary: any = {};
  filteredData: OrderRow[] = [];

  showPaymentAlert: boolean = false;
  paymentDaysRemaining: number = 0;
  paymentDueDate: string = '1 October';
  paymentDeadlinePassed: boolean = false;

  /* ============================================================
     FORM
     ============================================================ */
  reportForm: FormGroup;

  /* ============================================================
     FILTERS
     ============================================================ */
  dateFrom: string = '';
  dateTo: string = '';
  selectedWaiter: string = '';
  selectedCashier: string = '';
  selectedMethod: string = '';
  selectedDepartment: string = '';       // ← holds a category key, e.g. "dtf"
  selectedStatus: string = '';
  searchTerm: string = '';

  /* ============================================================
     UI STATE
     ============================================================ */
  isLoading: boolean = false;
  showFilters: boolean = true;
  expandedOrderId: number | null = null;
  selectedReportType: string = 'summary';

  showAttendantSummary: boolean = true;
  selectedAttendant: string = '';

  /* ============================================================
     STATS
     ============================================================ */
  totalSales: number = 0;
  totalBalance: number = 0;
  totalCollected: number = 0;
  totalOrders: number = 0;
  totalItems: number = 0;
  averageOrder: number = 0;
  uniqueCustomers: number = 0;

  /* ============================================================
     USER + DATES
     ============================================================ */
  user: any;
  currentYear: number = new Date().getFullYear();
  currentDate: Date = new Date();
  currentDateTime: string = new Date().toLocaleString();

  /* ============================================================
     DROPDOWNS
     ============================================================ */
  waiters: any[] = [];
  cashiers: any[] = [];

  /* ------------------------------------------------------------
     Department options — these map directly to `item.category`
     values from the held-cart report. Add or remove freely.
     ------------------------------------------------------------ */
  departments = [
    { value: 'all',                label: 'All Departments' },
    { value: 'dtf',                label: '🖨️ DTF' },
    { value: 'digital_printing',   label: '🖥️ Digital Printing' },
    { value: 'large_format',       label: '📐 Large Format' },
    { value: 'label',              label: '🏷️ Label' },
    { value: 'uvdtf',              label: '🌈 UV DTF' },
  ];

  statusOptions = [
    { value: 'all',       label: 'All Status' },
    { value: 'paid',      label: '✅ Paid' },
    { value: 'partial',   label: '⚠️ Partial' },
    { value: 'pending',   label: '⏳ Pending' },
    { value: 'confirmed', label: '📋 Confirmed' }
  ];

  /** Aggregated per-category breakdown for the currently filtered set. */
  categoryStats: CategoryStat[] = [];


  constructor(
    private fb: FormBuilder,
    private guestService: GuestService,
    private userService: userService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.reportForm = this.fb.group({
      date_from: [''],
      date_to: [''],
      waiter: [''],
      cashier: [''],
      method: [''],
      department: [''],
      status: ['']
    });
  }


  /* ============================================================
     LIFECYCLE
     ============================================================ */
  ngOnInit(): void {
    this.getUser();
    this.loadWaiters();
    this.loadCashiers();
    this.setDefaultDateRange();
    this.checkPaymentDeadline();

    setInterval(() => {
      this.currentDate = new Date();
      this.currentDateTime = new Date().toLocaleString();
    }, 60000);
  }

  ngOnDestroy(): void { /* cleanup */ }


  /* ============================================================
     HELPERS FOR TEMPLATE
     ============================================================ */
  getCurrentYear(): number {
    return this.currentYear;
  }

  getCurrentDateTime(): string {
    return this.currentDateTime;
  }

  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId === orderId;
  }


  /* ============================================================
     USER / LOOKUPS
     ============================================================ */
  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) this.user = res;
    } catch (err) {
      console.error('Error loading user:', err);
    }
  }

  async loadWaiters() {
    try {
      const res = await this.userService.get_users_waiter();
      if (res) this.waiters = res;
    } catch (err) {
      console.error('Error loading waiters:', err);
    }
  }

  async loadCashiers() {
    try {
      const res = await this.userService.get_users_cashiers();
      if (res) this.cashiers = res;
    } catch (err) {
      console.error('Error loading cashiers:', err);
    }
  }


  /* ============================================================
     DATE METHODS
     ============================================================ */
  setDefaultDateRange(): void {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo   = this.formatDate(today);
  }
  /* ============================================================
   QUICK DATE RANGE PRESETS
   ============================================================ */
selectedRangePreset: string = '';   // 'daily' | 'weekly' | 'monthly' | 'yearly' | ''

setDateRange(preset: 'daily' | 'weekly' | 'monthly' | 'yearly'): void {
  this.selectedRangePreset = preset;

  const today = new Date();
  let from: Date;
  let to: Date = new Date(today);   // "to" is always today

  switch (preset) {
    case 'daily':
      // Today only
      from = new Date(today);
      to   = new Date(today);
      break;

    case 'weekly':
      // Last 7 days (today + previous 6)
      from = new Date(today);
      from.setDate(from.getDate() - 6);
      to = new Date(today);
      break;

    case 'monthly':
      // Current month: 1st → today
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to   = new Date(today);
      break;

    case 'yearly':
      // Current year: Jan 1 → today
      from = new Date(today.getFullYear(), 0, 1);
      to   = new Date(today);
      break;
  }

  // Update the form controls AND the bound fields
  const fromStr = this.formatDate(from);
  const toStr   = this.formatDate(to);

  this.dateFrom = fromStr;
  this.dateTo   = toStr;

  this.reportForm.patchValue({
    date_from: fromStr,
    date_to:   toStr
  });

  // If you want the report to auto-refresh, uncomment:
  // this.generateReport();

  this.cdr.detectChanges();
}

/** Clears the preset highlight when the user manually changes a date. */
onManualDateChange(): void {
  this.selectedRangePreset = '';
}

  formatDate(date: Date): string {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }


  /* ============================================================
     REPORT GENERATION
     ------------------------------------------------------------
     We always fetch WITHOUT a server-side department filter
     so the frontend can compute the category breakdown itself.
     ============================================================ */
  async generateReport(): Promise<void> {
    const dateFrom = this.reportForm.get('date_from')?.value || this.dateFrom;
    const dateTo   = this.reportForm.get('date_to')?.value   || this.dateTo;

    if (!dateFrom && !dateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }

    this.isLoading = true;
    this.blockUI.start('Generating report...');

    try {
      const payload = {
        date_from: dateFrom,
        date_to:   dateTo,
        waiter:    this.reportForm.get('waiter')?.value    || '',
        cashier:   this.reportForm.get('cashier')?.value   || '',
        method:    this.reportForm.get('method')?.value    || '',
        department: '',    // ← intentionally empty; filter locally
        status:    this.reportForm.get('status')?.value    || '',
        user_id:   this.user?.id || null
      };

      const res = await this.guestService.getHeldCartReport(payload);

      if (res && res.success) {
        this.reportData = (res.data || []) as OrderRow[];
        this.summary    = res.summary || {};

        this.selectedAttendant = '';
        this.selectedWaiter    = '';

        this.updateStats();
        this.filteredData = [...this.reportData];
        this.applyFilters();

        this.toastr.success(
          `Report generated successfully! ${this.totalOrders} orders found`,
          'Success'
        );
      } else {
        this.toastr.error(res?.error || 'Failed to generate report', 'Error');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      this.toastr.error('Failed to generate report', 'Error');
    } finally {
      this.isLoading = false;
      this.blockUI.stop();
      this.cdr.detectChanges();
    }
  }


  /* ============================================================
     STATS
     ============================================================ */
  updateStats(): void {
    this.totalSales      = this.summary.total_sales      || 0;
    this.totalBalance    = this.summary.total_balance    || 0;
    this.totalCollected  = this.summary.total_collected  || 0;
    this.totalOrders     = this.summary.total_orders     || 0;
    this.totalItems      = this.summary.total_items      || 0;
    this.averageOrder    = this.summary.average_order    || 0;
    this.uniqueCustomers = this.summary.unique_customers || 0;
  }

  updateStatsFromFilteredData(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
      this.totalSales = 0;
      this.totalCollected = 0;
      this.totalBalance = 0;
      this.totalOrders = 0;
      this.totalItems = 0;
      this.averageOrder = 0;
      this.uniqueCustomers = 0;
      return;
    }

    this.totalOrders    = this.filteredData.length;
    this.totalSales     = this.filteredData.reduce((s, o) => s + (Number(o.total)     || 0), 0);
    this.totalCollected = this.filteredData.reduce((s, o) => s + (Number(o.collected) || 0), 0);
    this.totalBalance   = this.filteredData.reduce((s, o) => s + (Number(o.balance)   || 0), 0);
    this.totalItems     = this.filteredData.reduce((s, o) => s + this.getTotalItems(o), 0);
    this.averageOrder   = this.totalOrders > 0 ? this.totalSales / this.totalOrders : 0;

    const unique = new Set<string>();
    this.filteredData.forEach(o => { if (o.customer) unique.add(o.customer); });
    this.uniqueCustomers = unique.size;
  }


  /* ============================================================
     ATTENDANT SUMMARY
     ============================================================ */
  toggleAttendantSummary(): void {
    this.showAttendantSummary = !this.showAttendantSummary;
  }

  getAttendantCount(): number {
    if (!this.filteredData || this.filteredData.length === 0) return 0;
    return new Set(this.filteredData.map(o => o.waiter || 'Unassigned')).size;
  }

  getAttendantSummary(): any[] {
    if (!this.filteredData || this.filteredData.length === 0) return [];

    const map = new Map<string, any>();

    this.filteredData.forEach(order => {
      const name = order.waiter || 'Unassigned';
      if (!map.has(name)) {
        map.set(name, {
          name,
          total_sales:     0,
          total_collected: 0,
          total_balance:   0,
          order_count:     0,
          orders:          []
        });
      }
      const a = map.get(name);
      a.total_sales     += Number(order.total)     || 0;
      a.total_collected += Number(order.collected) || 0;
      a.total_balance   += Number(order.balance)   || 0;
      a.order_count     += 1;
      a.orders.push(order);
    });

    return Array.from(map.values())
      .map(a => ({
        ...a,
        collection_rate: a.total_sales > 0
          ? Math.min((a.total_collected / a.total_sales) * 100, 100)
          : 0
      }))
      .sort((a, b) => b.total_sales - a.total_sales);
  }

  filterByAttendant(attendantName: string): void {
    if (!attendantName || attendantName === '') return;

    this.selectedAttendant = attendantName;
    this.selectedWaiter    = attendantName;

    this.filteredData = this.reportData.filter(o =>
      (o.waiter || 'Unassigned') === attendantName
    );

    this.rebuildCategoryStats();
    this.updateStatsFromFilteredData();
    this.toastr.success(`Showing orders for ${attendantName}`, 'Filter Applied');
    this.cdr.detectChanges();
  }

  resetAttendantFilter(): void {
    this.selectedAttendant = '';
    this.selectedWaiter    = '';
    this.filteredData = [...this.reportData];
    this.rebuildCategoryStats();
    this.updateStatsFromFilteredData();
    this.toastr.info('Filter cleared', 'Info');
    this.cdr.detectChanges();
  }


  /* ============================================================
     CATEGORY HELPERS
     ============================================================ */

  /** Normalize a raw category string. */
  private normalizeCategory(raw: any): string {
    if (raw === undefined || raw === null) return '';
    return String(raw).trim().toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Return the normalized category for a single line item.
   * Order of preference: item.category → item.family → item.product.category
   */
  getItemCategory(item: OrderItem): string {
    if (!item) return '';
    const direct = this.normalizeCategory(item.category);
    if (direct) return direct;

    const fam = this.normalizeCategory(item.family);
    if (fam) return fam;

    const prod = item.product;
    if (prod) {
      const pc = this.normalizeCategory(prod.category || prod.family);
      if (pc) return pc;
    }
    return 'uncategorized';
  }

  /** All distinct categories present in an order. */
  getOrderCategories(order: OrderRow): string[] {
    const set = new Set<string>();
    (order.items || []).forEach(it => {
      const c = this.getItemCategory(it);
      if (c) set.add(c);
    });
    return Array.from(set);
  }

  /** Does an order contain at least one line whose category matches? */
  private orderMatchesDepartment(order: OrderRow, dept: string): boolean {
    if (!dept || dept === 'all') return true;

    const wanted = dept.toLowerCase().replace(/\s+/g, '_');
    const cats = this.getOrderCategories(order);
    if (!cats.length) return false;

    const aliases: { [k: string]: string } = {
      drink: 'bar',
      drinks: 'bar',
      food: 'restaurant',
      uv_dtf: 'uvdtf'
    };
    const match = (c: string) => (aliases[c] || c) === wanted;
    return cats.some(match);
  }

  /** Display label for a category key. */
  getCategoryLabel(cat: string): string {
    const key = (cat || '').toLowerCase().replace(/\s+/g, '_');
    const map: { [k: string]: string } = {
      dtf:              '🖨️ DTF',
      digital_printing: '🖥️ Digital Printing',
      large_format:     '📐 Large Format',
      label:            '🏷️ Label',
      uvdtf:            '🌈 UV DTF',
      uv_dtf:           '🌈 UV DTF',
      food:             '🍽️ Food',
      restaurant:       '🍽️ Restaurant',
      kitchen:          '🍽️ Kitchen',
      bar:              '🍹 Bar',
      drink:            '🍹 Drinks',
      drinks:           '🍹 Drinks',
      laundry:          '🧺 Laundry',
      uncategorized:    '📦 Uncategorized'
    };
    return map[key] || ('📦 ' + key.replace(/_/g, ' '));
  }


  /* ============================================================
     FILTERS
     ============================================================ */
  applyFilters(): void {
    let filtered = [...this.reportData];

    // -------- Search --------
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => {
        if (order.id?.toString().includes(term)) return true;
        if (order.waiter?.toLowerCase().includes(term)) return true;
        if (order.customer?.toLowerCase().includes(term)) return true;
        if (order.note?.toLowerCase().includes(term)) return true;
        if (order.items && Array.isArray(order.items)) {
          return order.items.some((item: any) =>
            item.name?.toLowerCase().includes(term) ||
            item.item_name?.toLowerCase().includes(term)
          );
        }
        return false;
      });
    }

    // -------- Waiter --------
    if (this.selectedWaiter && this.selectedWaiter !== '') {
      filtered = filtered.filter(o =>
        (o.waiter || 'Unassigned') === this.selectedWaiter
      );
    }

    // -------- Department (category-driven) --------
    if (this.selectedDepartment
        && this.selectedDepartment !== ''
        && this.selectedDepartment !== 'all') {
      const dept = this.selectedDepartment;
      filtered = filtered.filter(o => this.orderMatchesDepartment(o, dept));
    }

    this.filteredData = filtered;

    // Rebuild the category breakdown for the visible set
    this.rebuildCategoryStats();

    this.updateStatsFromFilteredData();
    this.cdr.detectChanges();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  /** Called from the department <select>. */
  onDepartmentChange(value: string): void {
    this.selectedDepartment = value;
    this.applyFilters();
  }

  clearFilters(): void {
  this.searchTerm = '';
  this.selectedAttendant  = '';
  this.selectedWaiter     = '';
  this.selectedDepartment = '';
  this.selectedRangePreset = '';        // ← add this
  this.reportForm.reset();
  this.setDefaultDateRange();
  this.filteredData = [...this.reportData];
  this.rebuildCategoryStats();
  this.updateStatsFromFilteredData();
  this.toastr.info('Filters cleared', 'Info');
  this.cdr.detectChanges();
}

  /* ============================================================
     CATEGORY BREAKDOWN
     ------------------------------------------------------------
     Walks every line item in the filtered set, groups by its
     category, and distributes the order's collected / balance
     amount proportionally to each line's revenue share.
     ============================================================ */
  rebuildCategoryStats(): void {
    const map = new Map<string, CategoryStat>();

    (this.filteredData || []).forEach(order => {
      const items = order.items || [];
      if (!items.length) return;

      let sumLines = 0;
      items.forEach(it => { sumLines += this.getItemLineTotal(it); });

      const orderCollected = Number(order.collected) || 0;
      const orderBalance   = Number(order.balance)   || 0;

      items.forEach(it => {
        const key = this.getItemCategory(it);
        if (!key) return;

        const lineTotal = this.getItemLineTotal(it);
        const lineQty   = Number(it.qty) || 0;
        const share     = sumLines > 0
          ? lineTotal / sumLines
          : (1 / items.length);

        if (!map.has(key)) {
          map.set(key, {
            key,
            label: this.getCategoryLabel(key),
            count: 0,
            quantity: 0,
            revenue: 0,
            collected: 0,
            balance: 0
          });
        }
        const stat = map.get(key)!;
        stat.count     += 1;
        stat.quantity  += lineQty;
        stat.revenue   += lineTotal;
        stat.collected += orderCollected * share;
        stat.balance   += orderBalance   * share;
      });
    });

    this.categoryStats = Array.from(map.values())
      .map(s => ({
        ...s,
        revenue:   Math.round(s.revenue   * 100) / 100,
        collected: Math.round(s.collected * 100) / 100,
        balance:   Math.round(s.balance   * 100) / 100
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /** Line total: item.total → item.line_total → price × qty. */
  private getItemLineTotal(item: OrderItem): number {
    const direct = Number(item.total ?? item.line_total);
    if (!isNaN(direct) && direct > 0) return direct;
    const price = Number(item.price) || 0;
    const qty   = Number(item.qty)   || 0;
    return price * qty;
  }


  /* ============================================================
     TABLE INTERACTION
     ============================================================ */
  toggleOrderExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getTotalItems(order: any): number {
    if (!order || !order.items) return 0;
    return order.items.reduce(
      (total: number, item: any) => total + (Number(item.qty) || 0),
      0
    );
  }

  getStatusClass(order: any): string {
    const status = order.paid_status || order.status;
    switch (status) {
      case 'Success':
      case 'paid':      return 'status-paid';
      case 'Partial':
      case 'partial':   return 'status-partial';
      case 'Pending':
      case 'pending':   return 'status-pending';
      case 'Confirmed':
      case 'confirmed': return 'status-confirmed';
      default:          return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Success':
      case 'paid':      return 'fa-check-circle';
      case 'Partial':
      case 'partial':   return 'fa-exclamation-triangle';
      case 'Pending':
      case 'pending':   return 'fa-clock-o';
      case 'Confirmed':
      case 'confirmed': return 'fa-check';
      default:          return 'fa-circle-o';
    }
  }

  /**
   * NEW: badges are now derived from the item categories present in
   * the order, not from the legacy `contain_*` columns.
   */
  getDepartmentBadges(order: any): string[] {
    return this.getOrderCategories(order)
      .map(c => this.getCategoryLabel(c));
  }


  /* ============================================================
     EXPORT — adds a Category Breakdown sheet
     ============================================================ */
  exportToExcel(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
      this.toastr.warning('No data to export', 'Warning');
      return;
    }

    const exportData = this.filteredData.map(order => ({
      'Order #':    order.id,
      'Customer':   order.customer || 'Walk-in',
      'Waiter':     order.waiter   || 'N/A',
      'Total':      order.total     || 0,
      'Collected':  order.collected || 0,
      'Balance':    order.balance   || 0,
      'Status':     order.paid_status || order.status || 'N/A',
      'Items':      this.getTotalItems(order),
      'Categories': this.getOrderCategories(order).join(', '),
      'Date':       this.formatDisplayDate(order.created_at || ''),
      'Note':       order.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    // Summary sheet
    const summaryData = [
      ['SALES REPORT SUMMARY'],
      [],
      ['Metric', 'Value'],
      ['Total Sales',      this.totalSales],
      ['Total Collected',  this.totalCollected],
      ['Total Balance',    this.totalBalance],
      ['Total Orders',     this.totalOrders],
      ['Total Items',      this.totalItems],
      ['Average Order',    this.averageOrder],
      ['Unique Customers', this.uniqueCustomers]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    // Category breakdown sheet
    const catRows: any[][] = [
      ['CATEGORY BREAKDOWN'],
      [],
      ['Category', 'Lines', 'Quantity', 'Revenue', 'Collected', 'Balance']
    ];
    this.categoryStats.forEach(c => {
      catRows.push([
        c.label,
        c.count,
        c.quantity,
        c.revenue,
        c.collected,
        c.balance
      ]);
    });
    const catWS = XLSX.utils.aoa_to_sheet(catRows);
    XLSX.utils.book_append_sheet(workbook, catWS, 'Categories');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(data, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);

    this.toastr.success('Report exported to Excel', 'Success');
  }


  /* ============================================================
     PRINT + PDF
     ============================================================ */
  printReport(): void {
    const printArea = document.getElementById('reportContent');
    if (!printArea) {
      this.toastr.error('Print area not found', 'Error');
      return;
    }

    const printWindow = window.open('', 'PRINT', 'height=800,width=1000');
    if (!printWindow) {
      this.toastr.error('Please allow popups for this site', 'Error');
      return;
    }

    const styles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
        .report-header { text-align: center; margin-bottom: 30px; }
        .report-header h1 { color: #2c3e50; margin-bottom: 5px; }
        .report-header p { color: #7f8c8d; margin: 2px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #3498db; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .summary-card .label { font-size: 12px; color: #7f8c8d; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #ecf0f1; }
        tr:hover { background: #f8f9fa; }
        .status-paid { color: #27ae60; font-weight: bold; }
        .status-partial { color: #f39c12; font-weight: bold; }
        .status-pending { color: #e74c3c; font-weight: bold; }
        .status-confirmed { color: #3498db; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ecf0f1; padding-top: 20px; }
        @media print {
          .no-print { display: none; }
          body { padding: 10px; }
        }
      </style>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Report</title>
          ${styles}
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  downloadPDF(): void {
    const printArea = document.getElementById('reportContent');
    if (!printArea) {
      this.toastr.error('Report content not found', 'Error');
      return;
    }

    html2canvas(printArea, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth   = 210;
      const pageHeight = 295;
      const imgHeight  = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position   = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
      this.toastr.success('PDF downloaded successfully', 'Success');
    }).catch(error => {
      console.error('PDF generation error:', error);
      this.toastr.error('Failed to generate PDF', 'Error');
    });
  }


  /* ============================================================
     NAVIGATION + UTILITIES
     ============================================================ */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  trackByOrderId(index: number, order: any): number {
    return order.id;
  }

  trackByItemId(index: number, item: any): number {
    return item.id || index;
  }


  /* ============================================================
     PAYMENT DEADLINE
     ============================================================ */
  checkPaymentDeadline(): void {
    const today = new Date();
    const paymentDueDate = new Date(2026, 9, 1); // 1 October 2026

    today.setHours(0, 0, 0, 0);
    paymentDueDate.setHours(0, 0, 0, 0);

    this.paymentDeadlinePassed = today >= paymentDueDate;

    if (this.paymentDeadlinePassed) {
      this.paymentDaysRemaining = 0;
    } else {
      const diffMs = paymentDueDate.getTime() - today.getTime();
      this.paymentDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    this.showPaymentAlert = true;
    this.cdr.detectChanges();
  }

  closePaymentAlert(): void {
    if (this.paymentDeadlinePassed) return;
    this.showPaymentAlert = false;
  }
}