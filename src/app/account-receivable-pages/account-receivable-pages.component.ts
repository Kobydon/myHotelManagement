import { Component, OnInit,NgZone } from '@angular/core';
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
  selector: 'account-receivable',
  templateUrl: './account-receivable-pages.component.html',
  styleUrls: ['./account-receivable-pages.component.css']
})
export class AccountReceivablePagesComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  fileName= 'account_receivable.xlsx';
  paymentForm:FormGroup;
  page = 1;
  pageSize: number = 10;
  header:any;
  HeldList: any;
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
  totalHeldAmount=0;
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
  totalPurchases: number = 0;
  balance:number=0;
  totalAttendance:any;
  totalExpenses:any;
  totalIncome:any;
  totalAmount:any;
  user:any;
  purchaseList:any;
  orderList:any;
 receivedList:any;
 stockList:any;
 heldCart:any;
 returnList:any;
  constructor(private fb:FormBuilder,private roomService:RoomService,private toastr:ToastrService,
    private paymentService:PaymentService,private guestService:GuestService,private userService:userService,
  private ngZone: NgZone) {
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
        date_two: ['',Validators.required],
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
        this.loadHeldOrders();
    
        const selectedDate = this.paymentForm.value.dates;
        if (!selectedDate) {
          throw new Error("Please select a valid date.");
        }
    
        const d = { date: selectedDate,date_two:this.paymentForm.value.date_two };
    
        // Fetch data for payments (room charges)
        const paymentRes = await this.paymentService.searchPaymentDatesTwo(d);
        this.paymentList = paymentRes || [];
        
        // Sum up the balance of each payment
        this.totalAmount = this.paymentList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
        // Fetch data for purchases (optional)
        const purchaseRes = await this.paymentService.searchPaymentDates(d);
        this.purchaseList = purchaseRes || [];
    
        // Sum up the total cost of each purchase
        this.totalPurchases = this.purchaseList.reduce((sum, item) => sum + parseFloat(item.total_cost), 0);
    
        // Compute the total balance
        this.balance = this.paymentList.reduce((sum, item) => sum + parseFloat(item.balance), 0);
        
        // Compute the balance (total amount owed - payments made)
        // this.balance = this.totalAmount - this.totalPurchases;  // Adjust this as needed for your calculation logic
        
      } catch (err) {
        console.error("Error fetching data:", err.message || err);
      } finally {
        this.loading.stop();
      }
    }
    
    
     

    loadHeldOrders() {
      const selectedDate = this.paymentForm.value.dates;
       const d = { date: selectedDate,date_two:this.paymentForm.value.date_two };
      this.guestService.getHeldReportOrdersTwo(d).subscribe((data) => {
        console.log("API Response:", data); // Debugging: Check if data is received
    
        if (!Array.isArray(data) || data.length === 0) {
          console.log("No held orders found.");
          this.HeldList = []; // Set empty array if no data
          this.totalHeldAmount = 0;
          return;
        }
    
        // Ensure 'items' is always an array and convert price to a number
        this.HeldList = data.map((order: any) => ({
          ...order,
          items: Array.isArray(order.items)
            ? order.items.map((item: any) => ({
                ...item,
                price: Number(item.price) || 0, // Convert price to a number
                qty: Number(item.qty) || 0 // Ensure qty is a number
              }))
            : []
        }));
    
        console.log("Processed HeldList:", this.HeldList);
        this.calculateTotal();
      });
    }
    
    calculateTotal() {
      this.totalHeldAmount = this.HeldList.reduce((sum, order) =>
        sum + order.items.reduce((subSum, item) => subSum + (item.qty * item.price), 0)
      , 0);
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
      const table = document.getElementById('receivable-table');
      if (table) {
        const workbook = XLSX.utils.table_to_book(table);
        XLSX.writeFile(workbook, 'Hotel_Report.xlsx');
      } else {
        console.error("Table not found for exporting to Excel.");
      }
    }

      exportexcel()
      {
        /* pass here the table id */
        let element = document.getElementById('receivable-table');
        const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      
        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
        /* save to file */  
        XLSX.writeFile(wb, this.fileName);
      
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
      const printContent = document.getElementById('receivable-table')?.outerHTML;
    
      if (!printContent) {
        console.error('No content found to print.');
        return;
      }
    
      // Open a new window
      const printWindow = window.open('', '', 'height=800, width=800');
    
      if (printWindow) {
        printWindow.document.write('<html><head><title>Report</title>');
        
        // Add some basic CSS for printing
        printWindow.document.write(`
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .text-end { text-align: end; }
            .bg-light { background-color: #f8f9fa; }
          </style>
        `);
    
        // Add the content
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent || '');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    
        // Wait for the content to load before triggering the print dialog
        this.ngZone.run(() => {
          printWindow.onload = () => {
            printWindow.print();
            printWindow.close(); // Close the window after printing
          };
        });
      } else {
        console.error('Failed to open the print window.');
      }
    }
    
}
