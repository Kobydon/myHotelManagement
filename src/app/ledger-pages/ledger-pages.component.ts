import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { PaymentService } from 'app/services/payment.service';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import htmlToPdfmake from 'html-to-pdfmake';
import { ViewChild, ElementRef } from '@angular/core';
import * as html2pdf from 'html2pdf.js';
import { userService } from 'app/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

// Define interfaces for type safety
interface Payment {
  id?: number;
  name?: string;
  amount?: number | string;
  payment_date?: string;
  [key: string]: any;
}

interface Refund {
  id?: number;
  name?: string;
  refund_amount?: number | string;
  refund_date?: string;
  [key: string]: any;
}

interface Income {
  id?: number;
  name?: string;
  amount?: number | string;
  date?: string;
  order_total?: number;
  balance?: number;
  collected?: number;
  customer?: string;
  paid_status?: string;
  order_status?: string;
  [key: string]: any;
}

interface Expense {
  id?: number;
  name?: string;
  amount?: number | string;
  date?: string;
  [key: string]: any;
}

interface Purchase {
  id?: number;
  item?: string;
  total_cost?: number | string;
  request_date?: string;
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T;
  summary?: any;
}

@Component({
  selector: 'ledger-pages',
  templateUrl: './ledger-pages.component.html',
  styleUrls: ['./ledger-pages.component.css']
})
export class LedgerPagesComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;
  fileName = 'general_ledger.xlsx';
  paymentForm: FormGroup;
  page = 1;
  pageSize: number = 10;
  header: any;
  isLoading: boolean = false;

  // Data lists with proper typing
  paymentList: Payment[] = [];
  refundList: Refund[] = [];
  incomeList: Income[] = [];
  expenseList: Expense[] = [];
  purchaseList: Purchase[] = [];
  
  // Totals
  totalAmount: number = 0;
  totalRefundAmount: number = 0;
  totalIncome: number = 0;
  totalExpenses: number = 0;
  totalPurchases: number = 0;
  balance: number = 0;

  // Summary data
  summaryData: any = null;

  // Other properties
  room_info: any;
  booking_info: any;
  rooms: any;
  base64_string: any;
  displayStyle = "none";
  openStyle = "none";
  roomtype: any;
  bookings: any;
  guestList: any;
  roomList: any;
  yesterdayList: any;
  payList: any;
  day_difference: any;
  yesterday_total: any;
  totalAvailableRooms: any;
  totalOcccupiedRooms: any;
  occupancy: any;
  attendaceList: any;
  totalAttendance: any;
  user: any;
  receivedList: any;
  stockList: any;
  returnList: any;

  constructor(
    private fb: FormBuilder,
    private roomService: RoomService,
    private toastr: ToastrService,
    private paymentService: PaymentService,
    private guestService: GuestService,
    private userService: userService,
    private ngZone: NgZone
  ) {
    this.paymentForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      amount: ['', Validators.required],
      duration: ['', Validators.required],
      method: ['', Validators.required],
      room_type: ['', Validators.required],
      discount: ['', Validators.required],
      dates: [''],
      date_two: ['']
    });
  }

  ngOnInit(): void {
    this.getRoom();
    // Initialize with default date (today)
    const today = new Date().toISOString().split('T')[0];
    this.paymentForm.patchValue({
      dates: today,
      date_two: today
    });
    // Load data on init
    this.searchDates();
  }

  async getPaymentList() {
    try {
      const res = await this.paymentService.getPayment();
      if (res) {
        // Handle both array and object responses
        if (Array.isArray(res)) {
          this.paymentList = res;
        } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
          this.paymentList = (res as any).data;
        } else {
          this.paymentList = [];
        }
        
        if (this.paymentList.length > 0) {
          this.paymentForm.patchValue({ amount: this.paymentList[0]?.amount || 0 });
        }
        this.totalAmount = this.paymentList.reduce((sum, item) => sum + parseFloat(String(item.amount || 0)), 0);
        console.log('Total Amount:', this.totalAmount);
      }
    } catch (error: any) {
      this.toastr.error('Error fetching payments', error.message);
    }
  }

  async getRoom() {
    try {
      const res = await this.roomService.getrooms();
      if (res) {
        if (Array.isArray(res)) {
          this.roomList = res;
        } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
          this.roomList = (res as any).data;
        } else {
          this.roomList = [];
        }
      }
    } catch (error: any) {
      this.toastr.error('Error fetching rooms', error.message);
    }
  }

  async searchDates() {
    this.isLoading = true;
    this.loading.start();

    try {
      const selectedDate = this.paymentForm.value.dates;
      const dateTwo = this.paymentForm.value.date_two;

      if (!selectedDate || !dateTwo) {
        this.toastr.warning('Please select both start and end dates');
        this.isLoading = false;
        this.loading.stop();
        return;
      }

      const d = { date: selectedDate, datetwo: dateTwo };
      const z = { date: selectedDate, datetwo: dateTwo };

      // Fetch all data in parallel with proper type handling
      const [
        paymentRes,
        refundRes,
        incomeRes,
        expenseRes,
        purchaseRes
      ] = await Promise.all([
        this.paymentService.searchDatesTwo(d).catch(err => {
          console.error('Error fetching payments:', err);
          return null;
        }),
        this.paymentService.searchRefundDatesTwo(d).catch(err => {
          console.error('Error fetching refunds:', err);
          return null;
        }),
        this.guestService.searchIncomeDatesTwo(z).catch(err => {
          console.error('Error fetching income:', err);
          return null;
        }),
        this.guestService.searchExpenseDateTwo(z).catch(err => {
          console.error('Error fetching expenses:', err);
          return null;
        }),
        this.guestService.searchPurchaseDateTwo(d).catch(err => {
          console.error('Error fetching purchases:', err);
          return null;
        })
      ]);

      // Helper function to extract data from response
      const extractData = (response: any): any[] => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response && typeof response === 'object') {
          if ('data' in response && Array.isArray((response as any).data)) {
            return (response as any).data;
          }
          if ('result' in response && Array.isArray((response as any).result)) {
            return (response as any).result;
          }
        }
        return [];
      };

      // Extract data from responses
      this.paymentList = extractData(paymentRes);
      this.refundList = extractData(refundRes);
      this.incomeList = extractData(incomeRes);
      this.expenseList = extractData(expenseRes);
      this.purchaseList = extractData(purchaseRes);

      // Log to debug
      console.log('Income List:', this.incomeList);
      console.log('Payment List:', this.paymentList);
      console.log('Refund List:', this.refundList);
      console.log('Expense List:', this.expenseList);
      console.log('Purchase List:', this.purchaseList);

      // Store summary data if available
      if (incomeRes && typeof incomeRes === 'object' && 'summary' in incomeRes) {
        this.summaryData = (incomeRes as any).summary;
        console.log('Summary Data:', this.summaryData);
      }

      // Calculate totals with proper number conversion
      this.totalAmount = this.paymentList.reduce((sum, item) => sum + parseFloat(String(item.amount || 0)), 0);
      this.totalRefundAmount = this.refundList.reduce((sum, item) => sum + parseFloat(String(item.refund_amount || 0)), 0);
      this.totalIncome = this.incomeList.reduce((sum, item) => sum + parseFloat(String(item.amount || 0)), 0);
      this.totalExpenses = this.expenseList.reduce((sum, item) => sum + parseFloat(String(item.amount || 0)), 0);
      this.totalPurchases = this.purchaseList.reduce((sum, item) => sum + parseFloat(String(item.total_cost || 0)), 0);

      // Compute closing balance
      this.balance = this.totalAmount + this.totalIncome - this.totalRefundAmount - this.totalExpenses - this.totalPurchases;

      console.log('Data loaded successfully:', {
        payments: this.paymentList.length,
        refunds: this.refundList.length,
        income: this.incomeList.length,
        expenses: this.expenseList.length,
        purchases: this.purchaseList.length,
        totalIncome: this.totalIncome,
        balance: this.balance
      });

      if (this.paymentList.length === 0 && this.refundList.length === 0 && 
          this.incomeList.length === 0 && this.expenseList.length === 0 && 
          this.purchaseList.length === 0) {
        this.toastr.info('No data found for the selected date range');
      } else {
        this.toastr.success(`Loaded ${this.incomeList.length} income records`);
      }

    } catch (error: any) {
      console.error('Error in searchDates:', error);
      this.toastr.error('Error loading data', error.message || 'Unknown error occurred');
      // Reset data on error
      this.paymentList = [];
      this.refundList = [];
      this.incomeList = [];
      this.expenseList = [];
      this.purchaseList = [];
      this.resetTotals();
    } finally {
      this.isLoading = false;
      this.loading.stop();
    }
  }

  resetTotals() {
    this.totalAmount = 0;
    this.totalRefundAmount = 0;
    this.totalIncome = 0;
    this.totalExpenses = 0;
    this.totalPurchases = 0;
    this.balance = 0;
    this.summaryData = null;
  }

  async getBookingList() {
    try {
      this.loading.start();
      const res = await this.roomService.getBookingList();
      if (res) {
        if (Array.isArray(res)) {
          this.bookings = res;
        } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
          this.bookings = (res as any).data;
        } else {
          this.bookings = [];
        }
      }
    } catch (error: any) {
      this.toastr.error('Error fetching bookings', error.message);
    } finally {
      this.loading.stop();
    }
  }

  myFunction() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("myInput");
    filter = (input as HTMLInputElement).value.toUpperCase();
    table = document.getElementById("excel-table");
    tr = table?.getElementsByTagName("tr");
    if (tr) {
      for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
          txtValue = td.textContent || td.innerText;
          if (txtValue?.toUpperCase().indexOf(filter) > -1) {
            tr[i].style.display = "";
          } else {
            tr[i].style.display = "none";
          }
        }
      }
    }
  }

  async applyFilter() {
    try {
      console.log(this.paymentForm.value.filter);
      this.loading.start();
      const res = await this.paymentService.getPaymentFilter(this.paymentForm.value.filter);
      if (res) {
        if (Array.isArray(res)) {
          this.paymentList = res;
        } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
          this.paymentList = (res as any).data;
        } else {
          this.paymentList = [];
        }
      }
    } catch (error: any) {
      this.toastr.error('Error applying filter', error.message);
    } finally {
      this.loading.stop();
    }
  }

  openPopup(): void {
    this.header = "Add Payment";
    this.displayStyle = "block";
    this.getBookingList();
  }

  closePopup() {
    this.displayStyle = "none";
    this.openStyle = "none";
  }

  exportexcel() {
    const element = document.getElementById('ledger-table');
    if (element) {
      // Create a copy of the table without the summary
      const tableClone = element.cloneNode(true) as HTMLElement;
      // Remove summary div if exists
      const summaryDiv = tableClone.querySelector('.mt-3');
      if (summaryDiv) {
        summaryDiv.remove();
      }
      
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableClone);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
      XLSX.writeFile(wb, this.fileName);
    } else {
      this.toastr.warning('No data to export');
    }
  }

  printReport() {
    const printContents = document.querySelector('.page')?.innerHTML;
    if (printContents) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write('<html><head><title>Report</title></head><body>');
      printWindow?.document.write(printContents);
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    } else {
      console.error("No content found to print.");
    }
  }

  exportToExcel() {
    const table = document.getElementById('excel-table');
    if (table) {
      const workbook = XLSX.utils.table_to_book(table);
      XLSX.writeFile(workbook, 'Hotel_Report.xlsx');
    } else {
      console.error("Table not found for exporting to Excel.");
    }
  }

  printRepo(): void {
    const printContent = document.getElementById('ledger-table')?.outerHTML;
    
    if (!printContent) {
      this.toastr.warning('No data to print');
      return;
    }

    const printWindow = window.open('', '', 'height=800, width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>General Ledger Report</title>');
      printWindow.document.write(`
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .text-end { text-align: end; }
          .bg-light { background-color: #f8f9fa; }
          .alert, .spinner-border { display: none; }
          .btn { display: none; }
          .card { border: 1px solid #ddd; padding: 15px; margin-top: 15px; }
          .row { display: flex; flex-wrap: wrap; }
          .col-md-3 { flex: 0 0 25%; max-width: 25%; }
          .mt-3 { margin-top: 15px; }
          .mt-2 { margin-top: 10px; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      this.ngZone.run(() => {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      });
    } else {
      this.toastr.error('Failed to open print window');
    }
  }
}