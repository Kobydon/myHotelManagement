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
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


/* ============================================================
   INTERFACES
   ============================================================ */
export interface BundleInfo {
  size: number;
  remaining: number;
}

export interface BundlePackage {
  id: string;
  name: string;
  units: number;
  amount: number;
  per_unit: number;
  badge?: string;
}

export interface OrderItem {
  name?: string;
  item_name?: string;
  qty?: number;
  price?: number;
  total?: number;
  category?: string;
  family?: string;
  description?: string;
  measurement?: {
    width?: number;
    height?: number;
    unit?: string;
    area?: number;
  };
  measurementWidth?: number;
  measurementHeight?: number;
  measurementUnit?: string;
  measurementArea?: number;
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
     HELD CART REPORT
     ============================================================ */
  reportData: OrderRow[] = [];
  filteredData: OrderRow[] = [];
  summary: any = {};

  /* ============================================================
     STATS
     ============================================================ */
  totalSales = 0;
  totalBalance = 0;
  totalCollected = 0;
  totalOrders = 0;
  totalItems = 0;
  averageOrder = 0;
  uniqueCustomers = 0;

  todayIncome = 0;
  todayBalance = 0;

  monthlyPayments: { [month: string]: number } = {};
  months: string[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  /* ============================================================
     FORM + FILTERS
     ============================================================ */
  reportForm: FormGroup;

  dateFrom = '';
  dateTo = '';
  selectedWaiter = '';
  selectedCashier = '';
  selectedMethod = '';
  selectedDepartment = '';
  selectedStatus = '';
  searchTerm = '';

  isLoading = false;
  showFilters = true;
  expandedOrderId: number | null = null;
  selectedReportType = 'summary';

  showAttendantSummary = true;
  selectedAttendant = '';

  bundleInfo: BundleInfo = { size: 0, remaining: 0 };

  user: any;

  currentYear: number = new Date().getFullYear();
  currentDate: Date = new Date();
  currentDateTime: string = new Date().toLocaleString();

  waiters: any[] = [];
  cashiers: any[] = [];

  /* ============================================================
     DEPARTMENT OPTIONS
     ============================================================ */
  departments = [
    { value: 'all',                label: 'All Departments' },
    { value: 'dtf',                label: '🖨️ DTF' },
    { value: 'digital_printing',   label: '🖥️ Digital Printing' },
    { value: 'large_format',       label: '📐 Large Format' },
    { value: 'label',              label: '🏷️ Label' },
    { value: 'uvdtf',              label: '🌈 UV DTF' },
    { value: 'food',               label: '🍽️ Food' },
    { value: 'restaurant',         label: '🍽️ Restaurant' },
    { value: 'bar',                label: '🍹 Bar' },
    { value: 'drink',              label: '🍹 Drinks' },
    { value: 'laundry',            label: '🧺 Laundry' },
  ];

  statusOptions = [
    { value: 'all',       label: 'All Status' },
    { value: 'paid',      label: '✅ Paid' },
    { value: 'partial',   label: '⚠️ Partial' },
    { value: 'pending',   label: '⏳ Pending' },
    { value: 'confirmed', label: '📋 Confirmed' }
  ];

  categoryStats: CategoryStat[] = [];

  /* ============================================================
     SMS BUNDLE — TOP-UP + REDEEM STATE
     ============================================================ */
  showTopUpModal = false;
  showRedeemModal = false;

  bundlePackages: BundlePackage[] = [];
  selectedPackageId = '';
  topUpPaymentMethod = 'cash';
  topUpProcessing = false;
  loadingPackages = false;

  redeemCode = '';
  redeemProcessing = false;

  /* ============================================================
     MISC
     ============================================================ */
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
    if (this.reportData && this.reportData.length > 0) {
      this.initializePaymentChart();
    }
  }

  /* ============================================================
     COLLECTION RATE
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
      this.users = users.filter(user => user.roles === 'online');
    } catch (error) {
      /* silent */
    } finally {
      this.loading.stop();
    }
  }

  /* ============================================================
     BUNDLE — LOAD INFO
     ============================================================ */
  loadBundleInfo(): void {
    this.guestService.getRemainingBundle().subscribe({
      next: (bundle) => {
        this.bundleInfo = {
          size: Number(bundle?.size) || 0,
          remaining: Number(bundle?.remaining) || 0
        };
      },
      error: (err) => console.error('Error loading bundle:', err)
    });
  }

  /* ============================================================
     SMS BUNDLE — TOP-UP
     ============================================================ */
  openTopUpModal(): void {
    this.showTopUpModal = true;
    this.selectedPackageId = '';
    this.topUpPaymentMethod = 'cash';
    this.topUpProcessing = false;
    this.loadBundlePackages();
  }

  closeTopUpModal(): void {
    this.showTopUpModal = false;
    this.topUpProcessing = false;
  }

  loadBundlePackages(): void {
    this.loadingPackages = true;
    this.guestService.getBundlePackages().subscribe({
      next: (res) => {
        this.loadingPackages = false;
        if (res && res.success && Array.isArray(res.data)) {
          this.bundlePackages = res.data;
        } else if (Array.isArray(res)) {
          this.bundlePackages = res;
        } else {
          this.bundlePackages = this.fallbackPackages();
        }
      },
      error: (err) => {
        console.error('Failed to load packages', err);
        this.loadingPackages = false;
        this.bundlePackages = this.fallbackPackages();
      }
    });
  }

  /** Local fallback matching backend, so modal still works offline. */
  private fallbackPackages(): BundlePackage[] {
    return [
      { id: 'starter',    name: 'Starter Pack',  units: 170000,  amount: 15000,  per_unit: 0.0882, badge: 'Small teams' },
      { id: 'growth',     name: 'Growth Pack',   units: 500000,  amount: 25000,  per_unit: 0.0500, badge: 'Best value' },
      { id: 'pro',        name: 'Pro Pack',      units: 700000,  amount: 38000,  per_unit: 0.0543, badge: 'Most popular' },
      { id: 'enterprise', name: 'Enterprise',    units: 1200000, amount: 108000, per_unit: 0.0900, badge: 'Max volume' }
    ];
  }

  get selectedPackage(): BundlePackage | null {
    return this.bundlePackages.find(p => p.id === this.selectedPackageId) || null;
  }

  selectPackage(pkg: BundlePackage): void {
    this.selectedPackageId = pkg.id;
  }

  confirmTopUp(): void {
    if (!this.selectedPackageId) {
      this.toastr.warning('Please select a package', 'Warning');
      return;
    }
    this.topUpProcessing = true;

    this.guestService.topUpBundle({
      package_id: this.selectedPackageId,
      payment_method: this.topUpPaymentMethod
    }).subscribe({
      next: (res) => {
        this.topUpProcessing = false;
        if (res && res.success) {
          this.toastr.success(res.message || 'Top-up successful', 'Success');

          const bundle = res?.data?.bundle;
          if (bundle) {
            this.bundleInfo = {
              size: Number(bundle.size) || 0,
              remaining: Number(bundle.remaining) || 0
            };
          } else {
            this.loadBundleInfo();
          }
          this.closeTopUpModal();
          this.cdr.detectChanges();
        } else {
          this.toastr.error(res?.error || 'Top-up failed', 'Error');
        }
      },
      error: (err) => {
        this.topUpProcessing = false;
        this.toastr.error(err?.error?.error || 'Top-up failed', 'Error');
      }
    });
  }

  /* ============================================================
     SMS BUNDLE — REDEEM
     ============================================================ */
  openRedeemModal(): void {
    this.showRedeemModal = true;
    this.redeemCode = '';
    this.redeemProcessing = false;
  }

  closeRedeemModal(): void {
    this.showRedeemModal = false;
    this.redeemProcessing = false;
  }

  confirmRedeem(): void {
    const code = (this.redeemCode || '').trim();
    if (!code) {
      this.toastr.warning('Please enter a redeem code', 'Warning');
      return;
    }
    this.redeemProcessing = true;

    this.guestService.redeemBundle({ code }).subscribe({
      next: (res) => {
        this.redeemProcessing = false;
        if (res && res.success) {
          this.toastr.success(res.message || 'Code redeemed', 'Success');

          const bundle = res?.data?.bundle;
          if (bundle) {
            this.bundleInfo = {
              size: Number(bundle.size) || 0,
              remaining: Number(bundle.remaining) || 0
            };
          } else {
            this.loadBundleInfo();
          }
          this.redeemCode = '';
          this.closeRedeemModal();
          this.cdr.detectChanges();
        } else {
          this.toastr.error(res?.error || 'Redeem failed', 'Error');
        }
      },
      error: (err) => {
        this.redeemProcessing = false;
        this.toastr.error(err?.error?.error || 'Redeem failed', 'Error');
      }
    });
  }

  /* ============================================================
     REPORT
     ============================================================ */
  async generateReport(): Promise<void> {
    const dateFrom = this.reportForm.get('date_from')?.value || this.dateFrom;
    const dateTo   = this.reportForm.get('date_to')?.value   || this.dateTo;

    if (!dateFrom && !dateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }

    this.isLoading = true;

    try {
      const payload = {
        date_from: dateFrom,
        date_to:   dateTo,
        waiter:    this.reportForm.get('waiter')?.value  || '',
        cashier:   this.reportForm.get('cashier')?.value || '',
        method:    this.reportForm.get('method')?.value  || '',
        department: '',
        status:    this.reportForm.get('status')?.value  || '',
        user_id:   this.user?.id || null
      };

      const res = await this.guestService.getHeldCartReport(payload);

      if (res && res.success) {
        this.reportData = (res.data || []) as OrderRow[];
        this.summary    = res.summary || {};

        this.selectedAttendant = '';
        this.selectedWaiter    = '';

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
     STATS
     ============================================================ */
  updateStats(): void {
    this.totalSales      = this.summary.total_sales || 0;
    this.totalBalance    = this.summary.total_balance || 0;
    this.totalCollected  = this.summary.total_collected || 0;
    this.totalOrders     = this.summary.total_orders || 0;
    this.totalItems      = this.summary.total_items || 0;
    this.averageOrder    = this.summary.average_order || 0;
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
     MONTHLY SALES
     ============================================================ */
  processMonthlyPayments(): void {
    this.monthlyPayments = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    if (!this.reportData || !Array.isArray(this.reportData)) return;

    this.reportData.forEach((order: OrderRow) => {
      if (!order.created_at) return;
      const orderDate = new Date(order.created_at.replace(' ', 'T'));
      if (isNaN(orderDate.getTime())) return;

      const monthName = this.months[orderDate.getMonth()];
      const amount = Number(order.total) || 0;
      this.monthlyPayments[monthName] += amount;
    });
  }

  /* ============================================================
     TODAY'S TOTALS
     ============================================================ */
  computeTodayTotals(): void {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    let income = 0;
    let balance = 0;

    (this.reportData || []).forEach((order: OrderRow) => {
      if (!order.created_at) return;
      const orderDate = new Date(order.created_at.replace(' ', 'T'));
      if (isNaN(orderDate.getTime())) return;

      if (
        orderDate.getFullYear() === y &&
        orderDate.getMonth()    === m &&
        orderDate.getDate()     === d
      ) {
        income  += Number(order.total) || 0;
        balance += Number(order.balance) || 0;
      }
    });

    this.todayIncome  = income;
    this.todayBalance = balance;
  }

  /* ============================================================
     CHART
     ============================================================ */
  initializePaymentChart(): void {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!canvas) return;

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
      dep.getMonth()    === now.getMonth() &&
      dep.getDate()     === now.getDate();
    return isToday && dep.getHours() >= 12;
  }

  /* ============================================================
     CATEGORY HELPERS
     ============================================================ */
  private normalizeCategory(raw: any): string {
    if (raw === undefined || raw === null) return '';
    return String(raw).trim().toLowerCase().replace(/\s+/g, '_');
  }

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

  getOrderCategories(order: OrderRow): string[] {
    const set = new Set<string>();
    (order.items || []).forEach(it => {
      const c = this.getItemCategory(it);
      if (c) set.add(c);
    });
    return Array.from(set);
  }

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

  getCategoryLabel(cat: string): string {
    const key = (cat || '').toLowerCase().replace(/\s+/g, '_');
    const map: { [k: string]: string } = {
      dtf:               '🖨️ DTF',
      digital_printing:  '🖥️ Digital Printing',
      large_format:      '📐 Large Format',
      label:             '🏷️ Label',
      uvdtf:             '🌈 UV DTF',
      uv_dtf:            '🌈 UV DTF',
      food:              '🍽️ Food',
      restaurant:        '🍽️ Restaurant',
      kitchen:           '🍽️ Kitchen',
      bar:               '🍹 Bar',
      drink:             '🍹 Drinks',
      drinks:            '🍹 Drinks',
      laundry:           '🧺 Laundry',
      uncategorized:     '📦 Uncategorized'
    };
    return map[key] || ('📦 ' + key.replace(/_/g, ' '));
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

    if (this.selectedDepartment && this.selectedDepartment !== ''
        && this.selectedDepartment !== 'all') {
      const dept = this.selectedDepartment;
      filtered = filtered.filter(order =>
        this.orderMatchesDepartment(order, dept)
      );
    }

    this.filteredData = filtered;

    this.rebuildCategoryStats();

    this.updateStatsFromFilteredData();
    this.cdr.detectChanges();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onDepartmentChange(value: string): void {
    this.selectedDepartment = value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedAttendant = '';
    this.selectedWaiter = '';
    this.selectedDepartment = '';
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
     ============================================================ */
  rebuildCategoryStats(): void {
    const map = new Map<string, CategoryStat>();

    (this.filteredData || []).forEach(order => {
      const items = order.items || [];
      if (!items.length) return;

      let sumLines = 0;
      items.forEach(it => {
        sumLines += this.getItemLineTotal(it);
      });

      const orderCollected = Number(order.collected) || 0;
      const orderBalance   = Number(order.balance) || 0;

      items.forEach(it => {
        const key = this.getItemCategory(it);
        if (!key) return;

        const lineTotal = this.getItemLineTotal(it);
        const lineQty   = Number(it.qty) || 0;

        const share =
          sumLines > 0 ? lineTotal / sumLines : (1 / items.length);

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

  private getItemLineTotal(item: OrderItem): number {
    const direct = Number(item.total ?? item.line_total);
    if (!isNaN(direct) && direct > 0) return direct;
    const price = Number(item.price) || 0;
    const qty   = Number(item.qty)   || 0;
    return price * qty;
  }

  /* ============================================================
     TABLE HELPERS
     ============================================================ */
  toggleOrderExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getTotalItems(order: OrderRow): number {
    if (!order.items) return 0;
    return order.items.reduce(
      (total: number, item: any) => total + (Number(item.qty) || 0),
      0
    );
  }

  getStatusClass(order: OrderRow): string {
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

  getDepartmentBadges(order: OrderRow): string[] {
    return this.getOrderCategories(order)
      .map(c => this.getCategoryLabel(c));
  }

  /* ============================================================
     ATTENDANT SUMMARY
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
      entry.total_sales     += Number(order.total)     || 0;
      entry.total_collected += Number(order.collected) || 0;
      entry.total_balance   += Number(order.balance)   || 0;
      entry.order_count     += 1;
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
    this.rebuildCategoryStats();
    this.updateStatsFromFilteredData();
    this.toastr.success(`Showing orders for ${name}`, 'Filter Applied');
    this.cdr.detectChanges();
  }

  resetAttendantFilter(): void {
    this.selectedAttendant = '';
    this.selectedWaiter = '';
    this.filteredData = [...this.reportData];
    this.rebuildCategoryStats();
    this.updateStatsFromFilteredData();
    this.toastr.info('Filter cleared', 'Info');
    this.cdr.detectChanges();
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
      'Order #':  order.id,
      'Customer': order.customer || 'Walk-in',
      'Waiter':   order.waiter   || 'N/A',
      'Total':    order.total     || 0,
      'Collected': order.collected || 0,
      'Balance':  order.balance   || 0,
      'Status':   order.paid_status || order.status || 'N/A',
      'Items':    this.getTotalItems(order),
      'Categories': this.getOrderCategories(order).join(', '),
      'Date':     this.formatDisplayDate(order.created_at),
      'Note':     order.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

    const summaryData = [
      ['SALES REPORT SUMMARY (HELD CART)'],
      [],
      ['Metric', 'Value'],
      ['Total Sales',       this.totalSales],
      ['Total Collected',   this.totalCollected],
      ['Total Balance',     this.totalBalance],
      ['Today Income',      this.todayIncome],
      ['Today Balance',     this.todayBalance],
      ['Total Orders',      this.totalOrders],
      ['Total Items',       this.totalItems],
      ['Average Order',     this.averageOrder],
      ['Unique Customers',  this.uniqueCustomers]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    const catRows: any[][] = [
      ['CATEGORY BREAKDOWN'],
      [],
      ['Category', 'Lines', 'Quantity', 'Revenue', 'Collected', 'Balance']
    ];
    this.categoryStats.forEach(c => {
      catRows.push([c.label, c.count, c.quantity, c.revenue, c.collected, c.balance]);
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
     EXCHANGE RATES (unused)
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
     BUNDLE GETTERS
     ============================================================ */
  get bundleUsed(): number {
    const size = this.bundleInfo?.size || 0;
    const remaining = this.bundleInfo?.remaining || 0;
    return Math.max(size - remaining, 0);
  }

  get bundleUsedPercent(): number {
    const size = this.bundleInfo?.size || 0;
    if (size <= 0) return 0;
    return Math.min((this.bundleUsed / size) * 100, 100);
  }
}