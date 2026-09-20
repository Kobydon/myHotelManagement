
import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';

import Chart from 'chart.js';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { PaymentService } from 'app/services/payment.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { userService } from 'app/user.service';
import { Router } from '@angular/router';          // ✅ correct import
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


export interface BundleInfo {
  size: number;
  remaining: number;
}

@Component({
  selector: 'dashboard-cmp',
  moduleId: module.id,
  templateUrl: 'dashboard.component.html',
     styleUrls: ['dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  /* ============================================================
     CONSTRUCTOR
     ============================================================ */
  constructor(
    private toastr: ToastrService,
    private fb: FormBuilder,
    private http: HttpClient,
    private roomService: RoomService,
    private guestService: GuestService,
    private paymentService: PaymentService,
    private userService: userService,
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
     CORE STATE
     ============================================================ */
  chartViewReady = false;
  page = 1;
  pageSize = 16;

  rooms: any;
  bookings: any;
  guestList: any;
  customers: any[] = [];
  users: any[];

  @BlockUI('loading') loading!: NgBlockUI;

  public paymentChart: any;

  /* ============================================================
     HELD CART REPORT (single source of truth)
     ============================================================ */
  reportData: any[] = [];
  filteredData: any[] = [];
  summary: any = {};

  /* ============================================================
     STATS  — ALL derived from held cart report
     ============================================================ */
  totalSales: number = 0;
  totalBalance: number = 0;
  totalCollected: number = 0;
  totalOrders: number = 0;
  totalItems: number = 0;
  averageOrder: number = 0;
  uniqueCustomers: number = 0;

  /* Today's numbers — also from held cart report */
  todayIncome: number = 0;
  todayBalance: number = 0;

  /* Monthly chart — also from held cart report */
  monthlyPayments: { [month: string]: number } = {};
  months: string[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  /* ============================================================
     FORM + FILTERS
     ============================================================ */
  reportForm: FormGroup;

  dateFrom: string = '';
  dateTo: string = '';
  selectedWaiter: string = '';
  selectedCashier: string = '';
  selectedMethod: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  searchTerm: string = '';

  /* UI state */
  isLoading: boolean = false;
  showFilters: boolean = true;
  expandedOrderId: number | null = null;
  selectedReportType: string = 'summary';

  showAttendantSummary: boolean = true;
  selectedAttendant: string = '';

  bundleInfo: BundleInfo = { size: 0, remaining: 0 };

  user: any;

  /* Date helpers */
  currentYear: number = new Date().getFullYear();
  currentDate: Date = new Date();
  currentDateTime: string = new Date().toLocaleString();

  /* Dropdowns */
  waiters: any[] = [];
  cashiers: any[] = [];

  departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'dtf', label: '🖨️ DTF' },
    { value: 'digital_printing', label: '🖥️ Digital Printing' },
    { value: 'large_format', label: '📐 Large Format' },
    { value: 'label', label: '🏷️ Label' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: '✅ Paid' },
    { value: 'partial', label: '⚠️ Partial' },
    { value: 'pending', label: '⏳ Pending' },
    { value: 'confirmed', label: '📋 Confirmed' }
  ];

  usdRate: number;
  gbpRate: number;
  eurRate: number;
  ghsRate: number;

  /* ============================================================
     LIFECYCLE
     ============================================================ */
  ngOnInit() {
    this.getCustomers();
    this.loadBundleInfo();
    this.getGust();
    this.getUsers();
    this.getRoom();
    this.getUser();
    this.setDefaultDateRange();
    this.generateReport();
  }

  ngAfterViewInit() {
    this.chartViewReady = true;

    /* Re-draw chart if held cart data already loaded */
    if (this.reportData && this.reportData.length > 0) {
      this.initializePaymentChart();
    }
  }

  /* ============================================================
     COLLECTION RATE (used by stat cards)
     ============================================================ */
  get collectionRate(): number {
    if (!this.totalSales || this.totalSales === 0) return 0;
    return Math.min((this.totalCollected / this.totalSales) * 100, 100);
  }

  /* ============================================================
     DEFAULT DATE RANGE
     ============================================================ */
  setDefaultDateRange(): void {
    const today = new Date();
    this.reportForm.get('date_from')?.patchValue(this.formatDate(today));
    this.reportForm.get('date_to')?.patchValue(this.formatDate(today));
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
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

  /* ============================================================
     USER
     ============================================================ */
  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) this.user = res;
    } catch (err) {
      console.log(err);
    }
  }
async getUsers() {
  try {
    this.loading.start();

    const users = await this.userService.getUsers();

    this.users = users.filter(
      user => user.roles === 'online'
    );

  } catch (error) {
    /* silent */
  } finally {
    this.loading.stop();
  }
}

  /* ============================================================
     BUNDLE
     ============================================================ */
  loadBundleInfo(): void {
    this.guestService.getRemainingBundle().subscribe({
      next: (bundle) => {
        this.bundleInfo = bundle;
        this.updateStats();
      },
      error: (err) => console.error('Error loading bundle:', err)
    });
  }

  /* ============================================================
     HELD CART REPORT  — SOLE SOURCE OF INCOME / BALANCE
     ============================================================ */
  async generateReport(): Promise<void> {
    const dateFrom = this.reportForm.get('date_from')?.value || this.dateFrom;
    const dateTo = this.reportForm.get('date_to')?.value || this.dateTo;

    if (!dateFrom && !dateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }

    this.isLoading = true;

    try {
      const payload = {
        date_from: dateFrom,
        date_to: dateTo,
        waiter: this.reportForm.get('waiter')?.value || '',
        cashier: this.reportForm.get('cashier')?.value || '',
        method: this.reportForm.get('method')?.value || '',
        department: this.reportForm.get('department')?.value || '',
        status: this.reportForm.get('status')?.value || '',
        user_id: this.user?.id || null
      };

      const res = await this.guestService.getHeldCartReport(payload);

      if (res && res.success) {
        this.reportData = res.data || [];
        this.summary = res.summary || {};

        this.selectedAttendant = '';
        this.selectedWaiter = '';

        this.updateStats();
        this.processMonthlyPayments();
        this.computeTodayTotals();

        this.filteredData = [...this.reportData];
        this.applyFilters();

        if (this.chartViewReady) {
          this.initializePaymentChart();
        }

        this.toastr.success(
          `Report generated! ${this.totalOrders} orders found`,
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
      this.cdr.detectChanges();
    }
  }

  /* ============================================================
     STATS  — from held cart summary + filtered data
     ============================================================ */
  updateStats(): void {
    this.totalSales = this.summary.total_sales || 0;
    this.totalBalance = this.summary.total_balance || 0;
    this.totalCollected = this.summary.total_collected || 0;
    this.totalOrders = this.summary.total_orders || 0;
    this.totalItems = this.summary.total_items || 0;
    this.averageOrder = this.summary.average_order || 0;
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

    this.totalOrders = this.filteredData.length;
    this.totalSales = this.filteredData.reduce(
      (sum, order) => sum + (Number(order.total) || 0), 0
    );
    this.totalCollected = this.filteredData.reduce(
      (sum, order) => sum + (Number(order.collected) || 0), 0
    );
    this.totalBalance = this.filteredData.reduce(
      (sum, order) => sum + (Number(order.balance) || 0), 0
    );

    this.totalItems = this.filteredData.reduce(
      (sum, order) => sum + this.getTotalItems(order), 0
    );

    this.averageOrder = this.totalOrders > 0
      ? this.totalSales / this.totalOrders
      : 0;

    const unique = new Set<string>();
    this.filteredData.forEach(order => {
      if (order.customer) unique.add(order.customer);
    });
    this.uniqueCustomers = unique.size;
  }

  /* ============================================================
     MONTHLY SALES  — from held cart report
     ============================================================ */
  processMonthlyPayments(): void {
    /* Reset */
    this.monthlyPayments = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    if (!this.reportData || !Array.isArray(this.reportData)) return;

    this.reportData.forEach((order: any) => {
      if (!order.created_at) return;

      const orderDate = new Date(order.created_at.replace(' ', 'T'));
      if (isNaN(orderDate.getTime())) return;

      const monthName = this.months[orderDate.getMonth()];
      const amount = Number(order.total) || 0;

      this.monthlyPayments[monthName] += amount;
    });

    console.log('MONTHLY TOTALS (held cart):', this.monthlyPayments);
  }

  /* ============================================================
     TODAY'S INCOME & BALANCE  — from held cart report
     ============================================================ */
  computeTodayTotals(): void {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    let income = 0;
    let balance = 0;

    (this.reportData || []).forEach((order: any) => {
      if (!order.created_at) return;

      const orderDate = new Date(order.created_at.replace(' ', 'T'));
      if (isNaN(orderDate.getTime())) return;

      if (
        orderDate.getFullYear() === y &&
        orderDate.getMonth() === m &&
        orderDate.getDate() === d
      ) {
        income += Number(order.total) || 0;
        balance += Number(order.balance) || 0;
      }
    });

    this.todayIncome = income;
    this.todayBalance = balance;

    console.log('TODAY (held cart):', income, balance);
  }

  /* ============================================================
     CHART
     ============================================================ */
  initializePaymentChart(): void {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('paymentChart canvas not found yet.');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.paymentChart) {
      this.paymentChart.destroy();
      this.paymentChart = null;
    }

    const chartData = this.months.map(
      month => Number(this.monthlyPayments[month]) || 0
    );

    this.paymentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Monthly Sales (GHS)',
            data: chartData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.15)',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#28a745',
            fill: true,
            lineTension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: true, position: 'top' },
        tooltips: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (tooltipItem: any) => {
              const value = tooltipItem.yLabel || 0;
              return 'Sales: ₵' + Number(value).toLocaleString('en-GH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
            }
          }
        },
        hover: { mode: 'nearest', intersect: true },
        scales: {
          xAxes: [{ scaleLabel: { display: true, labelString: 'Month' } }],
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: (value: any) =>
                '₵' + Number(value).toLocaleString('en-GH')
            },
            scaleLabel: { display: true, labelString: 'Sales Amount (GHS)' }
          }]
        }
      }
    });
  }

  /* ============================================================
     OTHER DATA LOADERS
     ============================================================ */
  async getRoom() {
    try {
      const res = await this.roomService.getrooms();
      if (res) this.rooms = res;
    } catch { /* silent */ }
  }

  async getGust() {
    try {
      const res = await this.guestService.getGuests();
      if (res) this.guestList = res;
    } catch { /* silent */ }
  }

  async getBookingList() {
    try {
      const res = await this.roomService.getBookingListNew();
      if (res) this.bookings = res;
    } catch { /* silent */ }
  }

  async checkOut(id) {
    try {
      this.loading.start();
      const res = await this.guestService.checkout(id);
      if (res) {
        this.getBookingList();
        this.getRoom();
      }
    } catch {
      this.toastr.info(null, 'Kindly pay all pending bills before checkout');
    } finally {
      this.loading.stop();
    }
  }

  async getCustomers() {
    const res = await this.guestService.getCustomers();
    this.customers = res || [];
  }

  canGlow(departureDate: string): boolean {
    const now = new Date();
    const dep = new Date(departureDate);
    const isToday =
      dep.getFullYear() === now.getFullYear() &&
      dep.getMonth() === now.getMonth() &&
      dep.getDate() === now.getDate();
    return isToday && dep.getHours() >= 12;
  }

  /* ============================================================
     FILTERS
     ============================================================ */
  applyFilters(): void {
    let filtered = [...this.reportData];

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

    if (this.selectedWaiter && this.selectedWaiter !== '') {
      filtered = filtered.filter(order =>
        (order.waiter || 'Unassigned') === this.selectedWaiter
      );
    }

    this.filteredData = filtered;
    this.updateStatsFromFilteredData();
    this.cdr.detectChanges();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedAttendant = '';
    this.selectedWaiter = '';
    this.reportForm.reset();
    this.setDefaultDateRange();
    this.filteredData = [...this.reportData];
    this.updateStatsFromFilteredData();
    this.toastr.info('Filters cleared', 'Info');
    this.cdr.detectChanges();
  }

  /* ============================================================
     TABLE HELPERS
     ============================================================ */
  toggleOrderExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getTotalItems(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce(
      (total: number, item: any) => total + (item.qty || 0),
      0
    );
  }

  getStatusClass(order: any): string {
    const status = order.paid_status || order.status;
    switch (status) {
      case 'Success':
      case 'paid': return 'status-paid';
      case 'Partial':
      case 'partial': return 'status-partial';
      case 'Pending':
      case 'pending': return 'status-pending';
      case 'Confirmed':
      case 'confirmed': return 'status-confirmed';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Success':
      case 'paid': return 'fa-check-circle';
      case 'Partial':
      case 'partial': return 'fa-exclamation-triangle';
      case 'Pending':
      case 'pending': return 'fa-clock-o';
      case 'Confirmed':
      case 'confirmed': return 'fa-check';
      default: return 'fa-circle-o';
    }
  }

  getDepartmentBadges(order: any): string[] {
    const badges: string[] = [];
    if (order.contain_dtf === 'yes') badges.push('🖨️ DTF');
    if (order.contain_digital_printing === 'yes') badges.push('🖥️ Digital Printing');
    if (order.contain_large_format === 'yes') badges.push('📐 Large Format');
    if (order.contain_label === 'yes') badges.push('🏷️ Label');
    return badges;
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  exportToExcel(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
      this.toastr.warning('No data to export', 'Warning');
      return;
    }

    const exportData = this.filteredData.map(order => ({
      'Order #': order.id,
      'Customer': order.customer || 'Walk-in',
      'Waiter': order.waiter || 'N/A',
      'Total': order.total || 0,
      'Collected': order.collected || 0,
      'Balance': order.balance || 0,
      'Status': order.paid_status || order.status || 'N/A',
      'Items': this.getTotalItems(order),
      'Date': this.formatDisplayDate(order.created_at),
      'Note': order.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    const summaryData = [
      ['SALES REPORT SUMMARY (HELD CART)'],
      [],
      ['Metric', 'Value'],
      ['Total Sales', this.totalSales],
      ['Total Collected', this.totalCollected],
      ['Total Balance', this.totalBalance],
      ['Today Income', this.todayIncome],
      ['Today Balance', this.todayBalance],
      ['Total Orders', this.totalOrders],
      ['Total Items', this.totalItems],
      ['Average Order', this.averageOrder],
      ['Unique Customers', this.uniqueCustomers]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

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
     ATTENDANT SUMMARY  — from held cart report
     ============================================================ */
  toggleAttendantSummary(): void {
    this.showAttendantSummary = !this.showAttendantSummary;
  }

  getAttendantCount(): number {
    if (!this.filteredData || this.filteredData.length === 0) return 0;
    return new Set(
      this.filteredData.map(o => o.waiter || 'Unassigned')
    ).size;
  }

  getAttendantSummary(): any[] {
    if (!this.filteredData || this.filteredData.length === 0) return [];

    const map = new Map<string, any>();

    this.filteredData.forEach(order => {
      const name = order.waiter || 'Unassigned';
      if (!map.has(name)) {
        map.set(name, {
          name,
          total_sales: 0,
          total_collected: 0,
          total_balance: 0,
          order_count: 0,
          orders: []
        });
      }
      const entry = map.get(name);
      entry.total_sales += Number(order.total) || 0;
      entry.total_collected += Number(order.collected) || 0;
      entry.total_balance += Number(order.balance) || 0;
      entry.order_count += 1;
      entry.orders.push(order);
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

  filterByAttendant(name: string): void {
    if (!name) return;
    this.selectedAttendant = name;
    this.selectedWaiter = name;
    this.filteredData = this.reportData.filter(
      o => (o.waiter || 'Unassigned') === name
    );
    this.updateStatsFromFilteredData();
    this.toastr.success(`Showing orders for ${name}`, 'Filter Applied');
    this.cdr.detectChanges();
  }

  resetAttendantFilter(): void {
    this.selectedAttendant = '';
    this.selectedWaiter = '';
    this.filteredData = [...this.reportData];
    this.updateStatsFromFilteredData();
    this.toastr.info('Filter cleared', 'Info');
    this.cdr.detectChanges();
  }

  /* ============================================================
     UNUSED — keeping exchange rate stub for compatibility
     ============================================================ */
  getExchangeRates() {
    const apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
    this.http.get<any>(apiUrl).subscribe(
      data => {
        if (data && data.rates) {
          this.usdRate = data.rates.USD || 1;
          this.gbpRate = data.rates.GBP;
          this.eurRate = data.rates.EUR;
          this.ghsRate = data.rates.GHS;
        }
      },
      (error: HttpErrorResponse) => console.error(error)
    );
  }
  /* ============================================================
   SMS BUNDLE HELPERS (used by bundle panel + stat card)
   ============================================================ */
get bundleUsed(): number {
  const size = this.bundleInfo?.size || 0;
  const remaining = this.bundleInfo?.remaining || 0;
  return Math.max(size - remaining, 0);
}

get bundleUsedPercent(): number {
  const size = this.bundleInfo?.size || 0;
  if (size <= 0) return 0;
  const used = this.bundleUsed;
  return Math.min((used / size) * 100, 100);
}
}