import { Component, OnInit } from '@angular/core';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { error } from 'console';
import { PaymentService } from 'app/services/payment.service';
import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import htmlToPdfmake from 'html-to-pdfmake';
import {  ViewChild, ElementRef  } from '@angular/core';
import * as html2pdf from 'html2pdf.js'
import { userService } from 'app/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

@Component({
  selector: 'check-todays-orders',
  templateUrl: './check-todays-orders.component.html',
  styleUrls: ['./check-todays-orders.component.css']
})
export class CheckTodaysOrdersComponent implements OnInit {
 @BlockUI('loading') loading!: NgBlockUI
  fileName= 'detailed_sales_report.xlsx';
  paymentForm:FormGroup;
  page = 1;
  pageSize: number = 10;
  header:any;
  HeldList: any;
 yester_daytodate:any;
  room_info:any;
  booking_info:any;
  rooms:any;
  pendingCount:any;
  base64_string:any;
  displayStyle = "none";
  openStyle="none";
  roomtype:any;
  bookings:any;
  guestList:any;
  totalHeldAmount=0;
  roomList:any;
  yesterdayList:any;
  posList:any;
  paymentList:any;
  totalPosAmount:any;
  day_difference:any;
  payList:any;
  refundList:any;
  totalRefundAmount:any;
  yesterday_total:any
  successCount:any;
  totalAvailableRooms:any;
  totalOcccupiedRooms:any;
  occupancy:any;
  incomeList:any;
  attendaceList:any;
  expenseList:any;
  stockUsuageList:any;
  totalAttendance:any;
  totalExpenses:any;
  totalIncome:any;
  totalAmount:any;
  user:any;
  purchaseList:any;

  chefList:any;
  orderList:any;
  mostAttendant:any;
 receivedList:any;
 mostOrderedItems:any;
 stockList:any;
 returnList:any;
  daysInMonth: { date: number }[] = [];
  constructor(private fb:FormBuilder,private roomService:RoomService,private toastr:ToastrService,
    private paymentService:PaymentService,private guestService:GuestService,private userService:userService) {
      this.paymentForm = this.fb.group({
        id:['',Validators.required],
        name:['',Validators.required],
        amount:['',Validators.required],
    
      // ÷floor:['',Validators.required],
        duration:['',Validators.required],
        // reserved:['',Validators.required],
        method:['',Validators.required],
        room_type :['',Validators.required],
        discount :['',Validators.required],


        dates: ['',Validators.required],
    
    
    
        
       
      })
     }

  ngOnInit(): void {
    this.getRoom();
    

  }


  async getRoom(){
    try{
      // this.loading.start();
     var res = await this.roomService.getrooms()
     if(res) this.roomList =res;
  
    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
  }
  }
  async searchDates() {
    try {
      this.loading.start();
      this.loadHeldOrders();
  
      const selectedDate = this.paymentForm.value.dates;
      if (!selectedDate) {
        throw new Error("Please select a valid date.");
      }
  
      const d = { date: selectedDate };
  
      // 🚀 Run all independent API calls concurrently
      const [
        paymentRes,
        receivedRes,
        stockRes,
        attendantRres,
        stockUsageRes,
        returnedRes,
        mostOrderedRes,
        refundRes,
        posRes,
        roomRes,
        incomeRes,
        expenseRes,
        attendanceRes,
        purchaseRes,
        orderRes,
        
      ] = await Promise.all([
        this.paymentService.searchDates(d),
        this.guestService.searchReceivedDate(d),
        this.guestService.searchStockDate(d),
        this.guestService.searchMostAttendantDate(d),
  
        this.guestService.searchStockUsuageDate(d),
        this.guestService.searchReturnDate(d),
        this.guestService.searchMostOrderedDateFood(d),
        this.paymentService.searchRefundDates(d),
        this.paymentService.searchDatesPos(d),
        this.roomService.searchRoomDates(d),
        this.guestService.searchIncomeDates(d),
        this.guestService.searchExpenseDate(d),
        this.guestService.searchattendanceDate(d),
        this.guestService.searchPurchaseDate(d),
        this.guestService.searchOrderDate(d),
      
      ]);
  
      // ✅ Assign API data safely
      this.paymentList = paymentRes || [];
      this.receivedList = receivedRes || [];
      this.stockList = stockRes || [];
      this.mostAttendant = attendantRres || [];
      this.stockUsuageList = stockUsageRes || [];
      this.returnList = returnedRes || [];
      this.mostOrderedItems = mostOrderedRes || [];
      this.refundList = refundRes || [];
      this.posList = posRes || [];
      this.rooms = roomRes || [];
      this.incomeList = incomeRes || [];
      this.expenseList = expenseRes || [];
      this.attendaceList = attendanceRes || [];
      this.purchaseList = purchaseRes || [];
      this.orderList = orderRes || [];
  
  
  
      // ✅ Ensure `roomList` exists before using `.length`
      this.roomList = this.roomList || [];
  
     this.getFoodChef(d);
    
      // ✅ Safely calculate totals
      this.totalAmount = this.paymentList.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
      this.totalRefundAmount = this.refundList.reduce((sum, item) => sum + (parseInt(item.refund_amount) || 0), 0);
      this.totalPosAmount = this.posList.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
      this.totalIncome = this.incomeList.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
      this.totalExpenses = this.expenseList.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
      this.totalAttendance = this.attendaceList.length;
  
      // ✅ Room calculations
      this.totalAvailableRooms = this.roomList.length - this.rooms.length;
      this.totalOcccupiedRooms = this.rooms.length;
      this.occupancy = (this.totalOcccupiedRooms / (this.roomList.length || 1)) * 100;
  
      // ✅ Fetch Yesterday's Data
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const z = { date: yesterday.toISOString().split("T")[0] };
  
      const yesterdayRoomRes = await this.roomService.searchYesterdayRoomDates(z);
      this.yesterdayList = yesterdayRoomRes || [];
      this.yesterday_total = this.yesterdayList.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
  
      // ✅ Cumulative total
      this.yester_daytodate = this.yesterday_total + this.totalAmount;
  
    } catch (err) {
      console.error("Error fetching data:", err.message || err);
    } finally {
      this.loading.stop();
    }
  
  
  }
  
  
  
  
    async getBookingList(){
      try{
        this.loading.start();
       var res = await this.roomService.getBookingList()
       if(res) this.bookings =res;
  
      }
      catch(error:any){
        this.toastr.error(null,error);
      }
       
    
    finally{
      this.loading.stop();
    }
  }
  
  
  myFunction() {
  
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("excel-table");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
      td = tr[i].getElementsByTagName("td")[0];
  
      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
        
      }       
    }
  }
  
  
  async applyFilter(){
  
    try{
      console.log(this.paymentForm.value.filter);
      this.loading.start();
     var res = await this.paymentService.getPaymentFilter(this.paymentForm.value.filter);
     if(res) this.paymentList =res;
  
    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }
  
  }
  
  openPopup(): void {
  
    this.header ="Add Payment";
  
    this.displayStyle = "block";
    this.getBookingList();
  
    // this.fecthRooms(this.bookingForm.value.room_type);
  
  }
  closePopup() {
    this.displayStyle = "none";
    this.openStyle = "none";
  }
  
  
  exportexcel()
  {
    /* pass here the table id */
    let element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
  
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
    /* save to file */  
    XLSX.writeFile(wb, this.fileName);
  
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
  
  // async downloadPDF() {
  //   const element = document.querySelector('.page');
  //   if (element) {
  //     const canvas = await html2(element);
  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const imgWidth = 190;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
  //     pdf.save('Hotel_Report.pdf');
  //   } else {
  //     console.error("No content found to generate PDF.");
  //   }
  // }
  
  
  printRepo(): void {
    const printContent = document.getElementById('excel-table')?.outerHTML;
  
    if (!printContent) {
      console.error('No content found to print.');
      return;
    }
  
    // Open a new window
    const printWindow = window.open('', '', 'height=800, width=800');
  
    if (printWindow) {
      printWindow.document.write('<html><head><title>Report</title>');
      
      // Add some basic CSS for printing (you can customize further if needed)
      printWindow.document.write(`
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          .text-end {
            text-align: end;
          }
          .bg-light {
            background-color: #f8f9fa;
          }
        </style>
      `);
  
      // Add the content
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent || '');
      printWindow.document.write('</body></html>');
  
      // Close the document to finish writing
      printWindow.document.close();
  
      // Wait for the content to load before triggering the print dialog
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close(); // Close the window after printing
      };
    } else {
      console.error('Failed to open the print window.');
    }
  }
 


  loadHeldOrders() {
    const selectedDate = this.paymentForm.value.dates;
    this.guestService.getHeldReportOrdersFood(selectedDate).subscribe((data) => {
      console.log("API Response:", data);
  
      if (!Array.isArray(data) || data.length === 0) {
        console.log("No held orders found.");
        this.HeldList = [];
        this.totalHeldAmount = 0;
        this.pendingCount = 0;
        this.successCount = 0;
        return;
      }
  
      // Normalize and parse item prices and quantities
      this.HeldList = data.map((order: any) => ({
        ...order,
        items: Array.isArray(order.items)
          ? order.items.map((item: any) => ({
              ...item,
              price: Number(item.price) || 0,
              qty: Number(item.qty) || 0
            }))
          : []
      }));
  
      // Calculate total amount for all held orders
      this.totalHeldAmount = this.HeldList.reduce((total, order) => {
        const orderTotal = order.items.reduce((sum: number, item: any) => {
          return sum + item.price * item.qty;
        }, 0);
        return total + orderTotal;
      }, 0);
  
      // Count all 'Pending' orders
      this.pendingCount = this.HeldList.filter(order => order.status === 'Pending').length;
      this.successCount = this.HeldList.filter(order => order.status === 'Confirmed').length;
  
      // Count 'Pending' orders for 'Successako James' (assuming waiter field)
   
      console.log("Processed HeldList:", this.HeldList);
      console.log("Total Held Amount:", this.totalHeldAmount);
      console.log("Total Pending Orders:", this.pendingCount);
      console.log("Pending Orders for Successako James:", this.successCount);
    });
  }

  
  calculateTotal() {
    this.totalHeldAmount = this.HeldList.reduce((sum, order) =>
      sum + order.items.reduce((subSum, item) => subSum + (item.qty * item.price), 0)
    , 0);
  }
  
  
  
  async getFoodChef(d){
  
    var bi =  await this.guestService.searchChefDates(d);
    if(bi) this.chefList=bi
  
  
  }
}
