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

@Component({
  selector: 'held-cart-report',
  templateUrl: './held-cart-report.component.html',
  styleUrls: ['./held-cart-report.component.css']
})
export class HeldCartReportComponent implements OnInit, OnDestroy {
  @BlockUI() blockUI!: NgBlockUI;

  // Report Data
  reportData: any[] = [];
  summary: any = {};
  filteredData: any[] = [];
  
  // Form
  reportForm: FormGroup;
  
  // Filters
  dateFrom: string = '';
  dateTo: string = '';
  selectedWaiter: string = '';
  selectedCashier: string = '';
  selectedMethod: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  searchTerm: string = '';
  
  // UI State
  isLoading: boolean = false;
  showFilters: boolean = true;
  expandedOrderId: number | null = null;
  selectedReportType: string = 'summary';
  
  // Stats
  totalSales: number = 0;
  totalBalance: number = 0;
  totalCollected: number = 0;
  totalOrders: number = 0;
  totalItems: number = 0;
  averageOrder: number = 0;
  uniqueCustomers: number = 0;
  
  // User
  user: any;
  
  // Date properties for template
  currentYear: number = new Date().getFullYear();
  currentDate: Date = new Date();
  currentDateTime: string = new Date().toLocaleString();
  
  // Dropdowns
  waiters: any[] = [];
  cashiers: any[] = [];
  
  // Department Options - Only Printing Departments
  departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'dtf', label: '🖨️ DTF' },
    { value: 'digital_printing', label: '🖥️ Digital Printing' },
    { value: 'large_format', label: '📐 Large Format' },
    { value: 'label', label: '🏷️ Label' }
  ];
  
  // Status Options
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: '✅ Paid' },
    { value: 'partial', label: '⚠️ Partial' },
    { value: 'pending', label: '⏳ Pending' },
    { value: 'confirmed', label: '📋 Confirmed' }
  ];

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

  ngOnInit(): void {
    this.getUser();
    this.loadWaiters();
    this.loadCashiers();
    this.setDefaultDateRange();
    
    // Update date every minute
    setInterval(() => {
      this.currentDate = new Date();
      this.currentDateTime = new Date().toLocaleString();
    }, 60000);
  }

  ngOnDestroy(): void {
    // Cleanup
  }

  // ===================== HELPER METHODS FOR TEMPLATE =====================

  getCurrentYear(): number {
    return this.currentYear;
  }

  getCurrentDateTime(): string {
    return this.currentDateTime;
  }

  // Helper method to get expanded order
  getExpandedOrder(): any {
    if (!this.expandedOrderId) return null;
    return this.filteredData.find(o => o.id === this.expandedOrderId) || null;
  }

  // Helper method to get expanded order items
  getExpandedOrderItems(): any[] {
    const order = this.getExpandedOrder();
    return order?.items || [];
  }

  // Helper method to get expanded order total
  getExpandedOrderTotal(): number {
    const order = this.getExpandedOrder();
    return order?.total || 0;
  }

  // Helper method to get expanded order balance
  getExpandedOrderBalance(): number {
    const order = this.getExpandedOrder();
    return order?.balance || 0;
  }

  // Helper method to get expanded order note
  getExpandedOrderNote(): string {
    const order = this.getExpandedOrder();
    return order?.note || '';
  }

  // Helper method to check if order is expanded
  isOrderExpanded(orderId: number): boolean {
    return this.expandedOrderId === orderId;
  }

  // ===================== USER METHODS =====================

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.user = res;
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }

  async loadWaiters() {
    try {
      const res = await this.userService.get_users_waiter();
      if (res) {
        this.waiters = res;
      }
    } catch (err) {
      console.error("Error loading waiters:", err);
    }
  }

  async loadCashiers() {
    try {
      const res = await this.userService.get_users_cashiers();
      if (res) {
        this.cashiers = res;
      }
    } catch (err) {
      console.error("Error loading cashiers:", err);
    }
  }

  // ===================== DATE METHODS =====================

  setDefaultDateRange(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.dateFrom = this.formatDate(thirtyDaysAgo);
    this.dateTo = this.formatDate(today);
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

  // ===================== REPORT GENERATION =====================

  async generateReport(): Promise<void> {
    const dateFrom = this.reportForm.get('date_from')?.value || this.dateFrom;
    const dateTo = this.reportForm.get('date_to')?.value || this.dateTo;
    
    if (!dateFrom && !dateTo) {
      this.toastr.warning('Please select a date range', 'Warning');
      return;
    }

    this.isLoading = true;
    this.blockUI.start('Generating report...');

    try {
      const payload = {
        date_from: dateFrom,
        date_to: dateTo,
        waiter: this.reportForm.get('waiter')?.value || '',
        cashier: this.reportForm.get('cashier')?.value || '',
        method: this.reportForm.get('method')?.value || '',
        department: this.reportForm.get('department')?.value || '',
        status: this.reportForm.get('status')?.value || ''
      };

      const res = await this.guestService.getHeldCartReport(payload);
      
      if (res && res.success) {
        this.reportData = res.data || [];
        this.summary = res.summary || {};
        
        // Update stats
        this.totalSales = this.summary.total_sales || 0;
        this.totalBalance = this.summary.total_balance || 0;
        this.totalCollected = this.summary.total_collected || 0;
        this.totalOrders = this.summary.total_orders || 0;
        this.totalItems = this.summary.total_items || 0;
        this.averageOrder = this.summary.average_order || 0;
        this.uniqueCustomers = this.summary.unique_customers || 0;
        
        this.filteredData = [...this.reportData];
        this.applyFilters();
        
        this.toastr.success(`Report generated successfully! ${this.totalOrders} orders found`, 'Success');
      } else {
        this.toastr.error(res?.error || 'Failed to generate report', 'Error');
      }
    } catch (error) {
      console.error("Error generating report:", error);
      this.toastr.error('Failed to generate report', 'Error');
    } finally {
      this.isLoading = false;
      this.blockUI.stop();
      this.cdr.detectChanges();
    }
  }

  // ===================== FILTER METHODS =====================

  applyFilters(): void {
    let filtered = [...this.reportData];
    
    // Search term filter
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
    
    this.filteredData = filtered;
    this.cdr.detectChanges();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.reportForm.reset();
    this.dateFrom = '';
    this.dateTo = '';
    this.setDefaultDateRange();
    this.filteredData = [...this.reportData];
    this.toastr.info('Filters cleared', 'Info');
  }

  // ===================== TABLE INTERACTION =====================

  toggleOrderExpand(orderId: number): void {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  getTotalItems(order: any): number {
    if (!order.items) return 0;
    return order.items.reduce((total: number, item: any) => total + (item.qty || 0), 0);
  }

  getStatusClass(order: any): string {
    const status = order.paid_status || order.status;
    switch(status) {
      case 'Success':
      case 'paid':
        return 'status-paid';
      case 'Partial':
      case 'partial':
        return 'status-partial';
      case 'Pending':
      case 'pending':
        return 'status-pending';
      case 'Confirmed':
      case 'confirmed':
        return 'status-confirmed';
      default:
        return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'Success':
      case 'paid':
        return 'fa-check-circle';
      case 'Partial':
      case 'partial':
        return 'fa-exclamation-triangle';
      case 'Pending':
      case 'pending':
        return 'fa-clock-o';
      case 'Confirmed':
      case 'confirmed':
        return 'fa-check';
      default:
        return 'fa-circle-o';
    }
  }

  getDepartmentBadges(order: any): string[] {
    const badges = [];
    if (order.contain_dtf === 'yes') badges.push('🖨️ DTF');
    if (order.contain_digital_printing === 'yes') badges.push('🖥️ Digital Printing');
    if (order.contain_large_format === 'yes') badges.push('📐 Large Format');
    if (order.contain_label === 'yes') badges.push('🏷️ Label');
    return badges;
  }

  // ===================== EXPORT METHODS =====================

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
    
    // Add summary sheet
    const summaryData = [
      ['SALES REPORT SUMMARY'],
      [],
      ['Metric', 'Value'],
      ['Total Sales', this.totalSales],
      ['Total Collected', this.totalCollected],
      ['Total Balance', this.totalBalance],
      ['Total Orders', this.totalOrders],
      ['Total Items', this.totalItems],
      ['Average Order', this.averageOrder],
      ['Unique Customers', this.uniqueCustomers]
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Summary');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    this.toastr.success('Report exported to Excel', 'Success');
  }

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
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

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

  // ===================== NAVIGATION =====================

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ===================== UTILITY =====================

  trackByOrderId(index: number, order: any): number {
    return order.id;
  }

  trackByItemId(index: number, item: any): number {
    return item.id || index;
  }
}