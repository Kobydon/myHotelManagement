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
  selector: 'detailed-report',
  templateUrl: './detailed-report.component.html',
  styleUrls: ['./detailed-report.component.css']
})
export class DetailedReportComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  fileName= 'detailed_sales_report.xlsx';
  paymentForm:FormGroup;
  page = 1;
  pageSize: number = 10;
  header:any;

 yester_daytodate:any;
  room_info:any;
  booking_info:any;
  rooms:any;
  base64_string:any;
  displayStyle = "none";
  openStyle="none";
  roomtype:any;
  bookings:any;
  guestList:any;
  roomList:any;
  yesterdayList:any;
  
  paymentList:any;
  day_difference:any;
  payList:any;
  refundList:any;
  totalRefundAmount:any;
  yesterday_total:any
  totalAvailableRooms:any;
  totalOcccupiedRooms:any;
  occupancy:any;
  incomeList:any;
  attendaceList:any;
  expenseList:any;
  
  totalAttendance:any;
  totalExpenses:any;
  totalIncome:any;
  totalAmount:any;
  user:any;
  purchaseList:any;
  orderList:any;
 receivedList:any;
 stockList:any;
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
  


  async getPaymentList(){
    try{
      // this.loading.start();
     var res = await this.paymentService.getPayment()
     if(res) {this.paymentList =res; this.paymentForm.patchValue({amount:this.paymentList[0].amount})}
     let sum :number= 0;

     for (let index = 0; index < this.paymentList.length; index++) {
      sum += parseInt(this.paymentList[index].amount);
      this.totalAmount=sum;
      console.log(sum);
  }
     

    }

    
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
  }

  
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

    const selectedDate = this.paymentForm.value.dates;
    if (!selectedDate) {
      throw new Error("Please select a valid date.");
    }

    const d = { date: selectedDate };

    // Fetch payments
    const paymentRes = await this.paymentService.searchDates(d);
    this.paymentList = paymentRes || [];
    this.totalAmount = this.paymentList.reduce((sum, item) => sum + parseInt(item.amount), 0);
    const receivedRes = await this.guestService.searchReceivedDate(d);
    this.receivedList = receivedRes || [];

    const stockRes = await this.guestService.searchStockDate(d);
    this.stockList = stockRes || [];
    // Fetch refunds
    const refundRes = await this.paymentService.searchRefundDates(d);
    this.refundList = refundRes || [];
    this.totalRefundAmount = this.refundList.reduce((sum, item) => sum + parseInt(item.refund_amount), 0);

    // Fetch room data
    const roomRes = await this.roomService.searchRoomDates(d);
    this.rooms = roomRes || [];
    this.totalAvailableRooms = this.roomList.length - this.rooms.length;
    this.totalOcccupiedRooms = this.rooms.length;
    this.occupancy = (this.totalOcccupiedRooms / this.roomList.length) * 100;

    // Prepare yesterday's data
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const z = { date: yesterday.toISOString().split("T")[0] };

    // Fetch income, expenses, and attendance
    const incomeRes = await this.guestService.searchIncomeDates(d);
    const expenseRes = await this.guestService.searchExpenseDate(d);
    const attendanceRes = await this.guestService.searchattendanceDate(d);
    const purchaseRes = await this.guestService.searchPurchaseDate(d);
    const orderRes = await this.guestService.searchOrderDate(d);
    this.incomeList = incomeRes || [];
    this.expenseList = expenseRes || [];
    this.attendaceList = attendanceRes || [];

    this.purchaseList = purchaseRes || [];
    this.orderList = orderRes || [];

    this.totalIncome = this.incomeList.reduce((sum, item) => sum + parseInt(item.amount), 0);
    this.totalExpenses = this.expenseList.reduce((sum, item) => sum + parseInt(item.amount), 0);
    this.totalAttendance = this.attendaceList.length;

    // Fetch yesterday's room data
    const yesterdayRoomRes = await this.roomService.searchYesterdayRoomDates(z);
    this.yesterdayList = yesterdayRoomRes || [];
    this.yesterday_total = this.yesterdayList.reduce((sum, item) => sum + parseInt(item.amount), 0);

    // Calculate cumulative totals
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


}
