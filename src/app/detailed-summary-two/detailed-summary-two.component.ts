import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { GuestService } from 'app/services/guest.service';
import { RoomService } from 'app/services/rooms.service';
import { PaymentService } from 'app/services/payment.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'detailed-summary-two',
  templateUrl: './detailed-summary-two.component.html',
  styleUrls: ['./detailed-summary-two.component.css']
})
export class DetailedSummaryTwoComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;

  // Report Data
  HeldList: any[] = [];
  posList: any[] = [];
  refundList: any[] = [];
  incomeList: any[] = [];
  expenseList: any[] = [];
  attendaceList: any[] = [];
  mostOrderedItems: any[] = [];
  mostAttendant: any[] = [];
  paymentList: any[] = [];
  roomList: any[] = [];
  rooms: any[] = [];
  purchaseList: any[] = [];
  orderList: any[] = [];
  receivedList: any[] = [];
  stockList: any[] = [];
  stockUsuageList: any[] = [];
  returnList: any[] = [];
  chefList: any[] = [];

  // Totals
  totalIncome: number = 0;
  totalExpenses: number = 0;
  totalPosAmount: number = 0;
  totalRefundAmount: number = 0;
  totalHeldAmount: number = 0;
  totalAmount: number = 0;
  totalItemsSold: number = 0;
  heldOrderCount: number = 0;

  // User
  user: any;

  // Form
  paymentForm: FormGroup;

  // UI State
  isLoading: boolean = false;

  // Date properties
  currentYear: number = new Date().getFullYear();
  currentDateTime: string = new Date().toLocaleString();

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private guestService: GuestService,
    private roomService: RoomService,
    private paymentService: PaymentService,
    private userService: userService
  ) {
    this.paymentForm = this.fb.group({
      dates: ['', Validators.required],
      datetwo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getUser();
    this.getRoom();
    
    // Set default dates
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    this.paymentForm.patchValue({
      dates: this.formatDate(sevenDaysAgo),
      datetwo: this.formatDate(today)
    });
    
    // Auto-load data
    setTimeout(() => {
      this.searchDates();
    }, 500);
  }

  // ===================== HELPER METHODS =====================

  getCurrentYear(): number {
    return this.currentYear;
  }

  getCurrentDateTime(): string {
    return this.currentDateTime;
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

  async getRoom() {
    try {
      const res = await this.roomService.getrooms();
      if (res) this.roomList = res;
    } catch (error: any) {
      console.error('Error loading rooms:', error);
    }
  }

  // ===================== DATA LOADING METHODS =====================

  async searchDates() {
    try {
      this.isLoading = true;
      this.loading.start();

      const dateFrom = this.paymentForm.value.dates;
      const dateTo = this.paymentForm.value.datetwo;

      if (!dateFrom || !dateTo) {
        this.toastr.warning('Please select both dates');
        this.loading.stop();
        return;
      }

      const d = { 
        date: dateFrom, 
        datetwo: dateTo 
      };

      console.log("📅 Searching from:", dateFrom, "to:", dateTo);

      // Load held orders for the date range
      await this.loadHeldOrders(dateFrom, dateTo);

      // ✅ Run all API calls concurrently with proper typing
      const [
        paymentRes,
        receivedRes,
        stockRes,
        attendantRes,
        stockUsageRes,
        returnedRes,
        mostOrderedRes,
        refundRes,
        // posRes,
        roomRes,
        incomeRes,
        expenseRes,
        attendanceRes,
        purchaseRes,
        orderRes,
      ] = await Promise.all([
        this.paymentService.searchDatesTwo(d).catch(() => [] as any[]),
        this.guestService.searchReceivedDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchStockDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchMostAttendantDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchStockUsuageDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchReturnDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchMostOrderedDateTwo(d).catch(() => [] as any[]),
        this.paymentService.searchRefundDatesTwo(d).catch(() => [] as any[]),
        // this.paymentService.searchDatesPosTwo(d).catch(() => [] as any[]),
        this.roomService.searchRoomDatesTwo(d).catch(() => [] as any[]),
        this.guestService.searchIncomeDatesTwo(d).catch(() => ({ data: [], summary: {} })),
        this.guestService.searchExpenseDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchattendanceDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchPurchaseDateTwo(d).catch(() => [] as any[]),
        this.guestService.searchOrderDateTwo(d).catch(() => [] as any[]),
      ]);

      console.log("✅ All API calls completed");

      // ✅ Assign data with proper type checking
      this.paymentList = (paymentRes as any[]) || [];
      this.receivedList = (receivedRes as any[]) || [];
      this.stockList = (stockRes as any[]) || [];
      this.mostAttendant = (attendantRes as any[]) || [];
      this.stockUsuageList = (stockUsageRes as any[]) || [];
      this.returnList = (returnedRes as any[]) || [];
      this.mostOrderedItems = (mostOrderedRes as any[]) || [];
      this.refundList = (refundRes as any[]) || [];
      // this.posList = (posRes as any[]) || [];
      this.rooms = (roomRes as any[]) || [];

      // ✅ Handle income data with type checking
      if (incomeRes && typeof incomeRes === 'object' && 'data' in incomeRes) {
        const incomeData = incomeRes as { data: any[], summary: any };
        this.incomeList = incomeData.data || [];
        this.totalIncome = incomeData.summary?.total_collected || 0;
        this.totalItemsSold = incomeData.summary?.total_items || 0;
        this.heldOrderCount = incomeData.summary?.total_orders || 0;
        console.log("💰 Income data loaded:", this.incomeList.length, "items");
      } else {
        this.incomeList = [];
        this.totalIncome = 0;
        this.totalItemsSold = 0;
        this.heldOrderCount = 0;
      }

      this.expenseList = (expenseRes as any[]) || [];
      this.attendaceList = (attendanceRes as any[]) || [];
      this.purchaseList = (purchaseRes as any[]) || [];
      this.orderList = (orderRes as any[]) || [];

      // Calculate totals
      this.totalRefundAmount = this.refundList.reduce(
        (sum: number, item: any) => sum + (parseFloat(item.refund_amount) || 0), 0
      );
      // this.totalPosAmount = this.posList.reduce(
      //   (sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0
      // );
      this.totalExpenses = this.expenseList.reduce(
        (sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0
      );

      console.log("✅ Report data loaded successfully");
      this.toastr.success(`Report loaded for ${dateFrom} to ${dateTo}`);

    } catch (err) {
      console.error("❌ Error fetching data:", err);
      this.toastr.error('Failed to load report data');
    } finally {
      this.isLoading = false;
      this.loading.stop();
    }
  }

  async loadHeldOrders(dateFrom: string, dateTo: string) {
    try {
      const d = { date: dateFrom, datetwo: dateTo };
      const res = await this.guestService.getHeldReportOrdersTwo(d);
      
      console.log("📦 Held Orders Response:", res);

      if (res && Array.isArray(res) && res.length > 0) {
        this.HeldList = res.map((order: any) => ({
          ...order,
          items: Array.isArray(order.items)
            ? order.items.map((item: any) => ({
                ...item,
                price: Number(item.price) || 0,
                qty: Number(item.qty) || 0,
                total: (Number(item.price) || 0) * (Number(item.qty) || 0)
              }))
            : [],
          balance: Number(order.balance) || 0,
          total: Number(order.total) || 0
        }));
        
        this.calculateTotal();
        console.log("✅ Held orders loaded:", this.HeldList.length);
      } else {
        this.HeldList = [];
        this.totalHeldAmount = 0;
        console.log("ℹ️ No held orders found in date range");
      }
    } catch (error) {
      console.error("❌ Error loading held orders:", error);
      this.HeldList = [];
      this.totalHeldAmount = 0;
    }
  }

  calculateTotal() {
    this.totalHeldAmount = this.HeldList.reduce((sum: number, order: any) =>
      sum + order.items.reduce((subSum: number, item: any) => 
        subSum + (item.qty * item.price), 0
      ), 0
    );
  }

  // ===================== EXPORT METHODS =====================

  exportexcel() {
    const element = document.getElementById('excel-table');
    if (element) {
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `detailed_report_${this.paymentForm.value.dates}_to_${this.paymentForm.value.datetwo}.xlsx`);
      this.toastr.success('Report exported to Excel');
    }
  }

  printRepo() {
    const printContent = document.getElementById('excel-table')?.outerHTML;
    if (!printContent) {
      this.toastr.error('No content to print');
      return;
    }

    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Detailed Report - Weekly</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
              th { background: #2c3e50; color: white; }
              .total-row { background: #f8f9fa; font-weight: bold; }
              .text-end { text-align: right; }
              .bg-light { background: #f8f9fa; }
              .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
              .status-paid { background: #d4edda; color: #155724; }
              .status-partial { background: #fff3cd; color: #856404; }
              .status-pending { background: #f8d7da; color: #721c24; }
              .balance-warning { color: #f39c12; font-weight: bold; }
              .balance-paid { color: #27ae60; }
              .report-footer { text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; color: #7f8c8d; }
              .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
              .section-badge { background: #3498db; color: white; padding: 2px 12px; border-radius: 12px; font-size: 12px; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }
}