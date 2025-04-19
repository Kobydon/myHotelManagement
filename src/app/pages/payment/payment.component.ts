import { Component, OnInit } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
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
@Component({
  selector: 'payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  fileName= 'Booking_Payments.xlsx';
  paymentForm:FormGroup
  page = 1;
  pageSize: number = 10;
  header:any;
  roomD:any;
 
  room_info:any;
  booking_info:any;
  rooms:any;
  base64_string:any;
  displayStyle = "none";
  displayRefundStyle="none";
  openStyle="none";
  roomtype:any;
  bookings:any;
  guestList:any;
  roomList:any;
  bookingDetail:any;
  paymentList:any;
  day_difference:any;
  payList:any;
  payment:any;
  earlyCheckin:number =10;
  
  totalAmount:any;
  user:any;
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
    payment_date :['',Validators.required],

    checkin_date :['',Validators.required],
    checkout_date :['',Validators.required],
    status :['',Validators.required],

    children :['',Validators.required],
    adult :['',Validators.required],
    filter: ['',Validators.required],
    balance: ['',Validators.required],
    topay: ['',Validators.required],
    dates: ['',Validators.required],
    reason:['',Validators.required],
    description:['',Validators.required],
    authorized_by:['',Validators.required],
    refund_amount:['',Validators.required],
    guest_id:['',Validators.required],

    room_number :['',Validators.required],
    default_amount :['',Validators.required],
    booking_id :['',Validators.required]    ,
    nema:['',Validators.required],
    short:['',Validators.required],
   
  })
}


  ngOnInit(): void {

    this.getPaymentList();
    this.getUser();
    // this.getGuest();
  }
  async getGuest(){
    try{
      this.loading.start();
      var res = await this.guestService.getGuests();
      if(res) this.guestList=res; 
  
    } catch(error){
      this.toastr.error(null,error)
    }
  finally{
    this.loading.stop();
  }
    
  }
  
 

  async getPaymentList(){
    try{
      this.loading.start();
     var res = await this.paymentService.getPayment()
     if(res) {this.paymentList =res; this.paymentForm.patchValue({amount:this.paymentList[0]?.amount})}
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
    this.loading.stop();
  }

  
}




  async getBookingList(){
    try{
      // this.loading.start();
     var res = await this.roomService.getBookingList()
     if(res) this.bookings =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
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
  this.getRoomType();

  // this.fecthRooms(this.bookingForm.value.room_type);

}
closePopup() {
  this.displayStyle = "none";
  this.displayRefundStyle ="none";
  this.openStyle = "none";
}



async getRoomType(){
  try{
    // this.loading.start();
   var res = await this.roomService.getroomType()
   if(res) this.rooms =res;

  }
  catch(error:any){
    this.toastr.error(null,error);
  }
   

finally{
  // this.loading.stop();
}
}


async fetchBookings(id:number){
  try{
    // this.loading.start();
    var res = await this.roomService.get_booking_details(id);
    if (res) this.bookingDetail =res;
    this.paymentForm.patchValue({
      id:id,    guest_id:this.bookingDetail[0].guest_id, room_number:this.bookingDetail[0].room_number,
      checkin_date: this.bookingDetail[0].arrival_date, checkout_date: this.bookingDetail[0].departure_date,nema:this.bookingDetail[0]?.name,
      room_type: this.bookingDetail[0].room_type, children:this.bookingDetail[0].children,adult:this.bookingDetail[0].adult
     
    })
    var date1= new Date ( this.bookingDetail[0].arrival_date);
    var date2 = new Date ( this.bookingDetail[0].departure_date);
    var difference_in_time = date2.getTime() - date1.getTime();
    this.day_difference = difference_in_time/(1000 * 3600*24);
    this.paymentForm.value.duration = this.day_difference
    console.log( this.paymentForm.value.duration)

  } catch (error){
    this.toastr.error(null,error)
  }
  finally{
    // this.loading.stop();
    this.fetchRoomType(this.paymentForm.value.room_type);
  }
}


async fetchRooms(record){
  try{
    // this.loading.start();
    var res = await this.roomService.fetchRoomsByType(record.room_type);
    if (res) this.roomList =res;
  } catch (error){
    console.log(error)
  }
  finally{
    // this.loading.stop();
  }
}

async fetchRoomType(id: any) {
  try {
    const res = await this.roomService.get_by_type_two(id);
    if (res) this.roomD = res;

    // Get the base price of the room
    const basePrice = parseInt(this.roomD[0]?.base_price);

    // Assume you have check-in and check-out dates in your form
    const checkinDate = new Date(this.paymentForm.value.checkin);  // example format: "2025-04-12"
    const checkoutDate = new Date(this.paymentForm.value.checkout); // example format: "2025-04-14"

    // Calculate duration in days
    const durationInMs = checkoutDate.getTime() - checkinDate.getTime();
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)); // round up for partial days

    // Total amount calculation
    const totalAmount = this.paymentForm.value.duration * basePrice;

    // Update the form with the calculated amounts
    this.paymentForm.patchValue({
      amount: totalAmount,
      topay: totalAmount
    });

  } catch (error) {
    this.toastr.error(null, error);
  } finally {
    // this.loading.stop();
  }
}


calDiscount(record){
  this.paymentForm.patchValue({amount:this.paymentForm.value.amount +  this.earlyCheckin - this.paymentForm.value.amount
  * this.paymentForm.value.discount/100,topay:this.paymentForm.value.amount - this.paymentForm.value.amount
    * this.paymentForm.value.discount/100})
  // this.roomForList[0].base_price*this.createForm.value.duration - 
  //     this.roomForList[0].base_price *this.createForm.value.duration*this.createForm.value.discount/100

}

async addPayment(record) {
  const amountToPay = Number(this.paymentForm.value.topay)  // Convert to number
  const totalAmount = Number(record.amount)  // Convert to number
  let balance = amountToPay - totalAmount;
  if (this.paymentForm.value.short === "yes") {
    balance = 0;
  }
  const b ="0"
  
  const payment: any = {
    booking_id:record.id,
    amount: record.amount,    
    name: this.paymentForm.value.nema,
    guest_id: record.guest_id,
    discount: record.discount,
    method: record.method,
    room_type: record.room_type,
    payment_date: record.payment_date,
    checkin_date: record.checkin_date,
    checkout_date: record.checkout_date,
    status: record.status,
    children: record.children,
    room_number: record.room_number,
    adult: record.adult,
    balance:balance
    
    // Adjusted balance calculation: Add the amount and discount

    
  };
  const formatDateToWords = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper function to calculate the number of days between two dates
  const calculateDaysBetweenDates = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  };

  // Format dates
  const checkinDate = formatDateToWords(record.checkin_date);
  const checkoutDate = formatDateToWords(record.checkout_date);
  const paymentDate = formatDateToWords(payment.payment_date);

  // Calculate number of nights
  const numberOfNights = calculateDaysBetweenDates(payment.checkin_date, payment.checkout_date);
  const d = {
    days:numberOfNights
  }
  // if (payment.discount !=="") {
  //  payment.balace=b
  // }
payment.days=d.days
  try {
    this.loading.start();
    const res = await this.paymentService.addPayment(payment);
    if (res) {
      this.toastr.success(null, "Payment successfully added");
      this.closePopup();
      this.getPaymentList();
    }
  } catch (error) {
    this.toastr.error(null, error);
  } finally {
    this.loading.stop();
  }
}

async openRefund(id){
  
  this.header ="Add Refund"

  this.displayRefundStyle= "block"

    try{
      this.loading.start();
      var res = await this.paymentService.get_payment_for(id);
      if (res) this.payment=res;
      this.paymentForm.patchValue({
   id:this.payment[0].id,
    name:this.payment[0].name,
    amount:this.payment[0].amount,

    

  
    // reserved:['',Validators.required],
    method:this.payment[0].method,
    room_type :this.payment[0].room_type,
    discount :this.payment[0].discount,
    payment_date :this.payment[0].payment_date,

    checkin_date :this.payment[0].checkin_date,
    checkout_date :this.payment[0].checkout_date,
    status :this.payment[0].status,

    children :this.payment[0].children,
    adult :this.payment[0].adult,
    
      })
    }
    catch(error){
      this.toastr.error(null,error);
    }
    finally{
      this.loading.stop();
    }


}

async  editPayment(id:number){

  this.header ="Edit Payment"
  this.displayStyle ="block"


    try{
      this.loading.start();
      var res = await this.paymentService.get_payment_for(id);
      if (res) this.payment=res;
      this.paymentForm.patchValue({
   id:this.payment[0].id,
    name:this.payment[0].name,
    amount:this.payment[0].amount,
    balance:this.payment[0].balance,
    default_amount:this.payment[0].amount,

  
    // reserved:['',Validators.required],
    method:this.payment[0].method,
    room_type :this.payment[0].room_type,
    discount :this.payment[0].discount,
    payment_date :this.payment[0].payment_date,

    checkin_date :this.payment[0].checkin_date,
    checkout_date :this.payment[0].checkout_date,
    status :this.payment[0].status,

    children :this.payment[0].children,
    adult :this.payment[0].adult,
    booking_id:this.payment[0].booking_id,
    guest_id: this.payment[0].guest_id
    
      })
    }
    catch(error){
      this.toastr.error(null,error);
    }
    finally{
      this.loading.stop();
    }



}


async getUser(){
  try{
      var res = await this.userService.getUser()
      if (res) this.user=res;

  }catch(err){console.log(err)}
  finally{console.log("success");}



}
async printReciept(id: number) {
  try {
    const response = await this.paymentService.get_payment_for(id);

    if (response && response.length > 0) {
      const payment = response[0];

      const formatDateToWords = (dateString: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      };

      const calculateDaysBetweenDates = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };

      const checkinDate = formatDateToWords(payment.checkin_date);
      const checkoutDate = formatDateToWords(payment.checkout_date);
      const paymentDate = formatDateToWords(payment.payment_date);
      const numberOfNights = calculateDaysBetweenDates(payment.checkin_date, payment.checkout_date);

      const receiptContent = `
        <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: monospace;
              font-size: 10px;
              width: 72mm;
              margin: 0;
              padding: 5px;
              text-align: center;
            }
            .header {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .sub-info, .line, .section {
              margin: 2px 0;
            }
            .line {
              border-top: 1px dashed black;
              margin: 4px 0;
            }
            .left {
              text-align: left;
            }
            .bold {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">Longford Royal Hotel</div>
          <div class="sub-info">AS-060-771</div>
          <div class="sub-info">Tel: 0322497756</div>
          <div class="sub-info">Sepe-dote Opp. Akate Farms</div>
          <div class="line"></div>

          <div class="left section"><span class="bold">Receipt:</span> #${payment.id}</div>
          <div class="left section"><span class="bold">Received From:</span> ${payment.name || 'N/A'}</div>
          <div class="left section"><span class="bold">Amount:</span> GH₵${payment.amount || '0'}.00</div>
          <div class="left section"><span class="bold">Payment Method:</span> ${payment.method || 'N/A'}</div>
          <div class="left section"><span class="bold">Balance:</span> GH₵${payment.balance || '0'}.00</div>
          <div class="left section"><span class="bold">Discount:</span> ${payment.discount || '0'}%</div>
          <div class="left section"><span class="bold">Room Type:</span> ${payment.room_type || 'N/A'}</div>
          <div class="left section"><span class="bold">Check-in:</span> ${checkinDate}</div>
          <div class="left section"><span class="bold">Check-out:</span> ${checkoutDate}</div>
          <div class="left section"><span class="bold">Nights:</span> ${numberOfNights}</div>
          <div class="left section"><span class="bold">Payment Date:</span> ${paymentDate}</div>
          <div class="left section"><span class="bold">Wi-Fi Code:</span> ${payment.wifi_code || 'N/A'}</div>
          <div class="line"></div>

          <div class="section">Thank you for choosing</div>
          <div class="section"> Longford  Royal Hotel!</div>
          <div class="section">We hope to serve you again soon.</div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(receiptContent);
        printWindow.document.close();

        // Delay print to ensure content is fully rendered
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        console.error('Unable to open print window.');
      }
    } else {
      this.toastr.error('No payment details found.');
    }
  } catch (error) {
    this.toastr.error('Failed to fetch payment details or print receipt.');
    console.error('Error:', error);
  }
}



async generateInvoice(id: number) {
  try {
    // Fetch payment details for the given ID
    const response = await this.paymentService.get_payment_for(id);

    // Ensure we have data and access the first element
    if (response && response.length > 0) {
      const payment = response[0]; // Access the first (and likely only) object

      // Helper function to format date to words
      const formatDateToWords = (dateString: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
      };

      // Format dates
      const checkinDate = formatDateToWords(payment.checkin_date);
      const checkoutDate = formatDateToWords(payment.checkout_date);
      const paymentDate = formatDateToWords(payment.payment_date);

      // Dynamically create invoice content
      const invoiceContent = `
        <div style="width: 58mm; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; border: 1px solid #000; padding: 10px; margin: 0 auto;">
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px;">
            <h2 style="margin: 0; font-size: 14px;">Longford Royal Hotel</h2>
            <p style="margin: 5px 0;">AS-060-7751</p>
            <p style="margin: 5px 0;">Tel: 0322497756</p>
            <p style="margin: 5px 0;">Location: Sepe-dote Opp. Akate Farms</p>
          </div>

          <div style="margin: 10px 0;">
            <p><strong>Invoice ID:</strong> #${payment.id || 'N/A'}</p>
            <p><strong>Guest Name:</strong> ${payment.name || 'N/A'}</p>
            <p><strong>Total Amount:</strong> GH₵${payment.amount || '0'}.00</p>
            <p><strong>Payment Method:</strong> ${payment.method || 'N/A'}</p>
            <p><strong>Balance:</strong> GH₵${payment.balance || '0'}.00</p>
            <p><strong>Discount:</strong> ${payment.discount || '0'}%</p>
            <p><strong>Room Type:</strong> ${payment.room_type || 'N/A'}</p>
            <p><strong>Check-in Date:</strong> ${checkinDate}</p>
            <p><strong>Check-out Date:</strong> ${checkoutDate}</p>
            <p><strong>Invoice Date:</strong> ${paymentDate}</p>
          </div>

          <div style="text-align: center; border-top: 1px dashed #000; padding-top: 10px;">
            <p>Thank you for staying with us atLongford Royal </p>
            <p>We look forward to hosting you again soon.</p>
          </div>
        </div>
      `;

      // Open a new print window
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        console.error('Unable to open print window.');
      }
    } else {
      this.toastr.error('No payment details found.');
    }
  } catch (error) {
    // Show error message if something goes wrong
    this.toastr.error('Failed to fetch payment details or generate invoice.');
    console.error('Error:', error);
  }
}




async updatePaymentCheckout(record: any) {
  const payment = {
    id: record.id,
      amount: record.amount,
      name: record.name,
      discount: record.discount,
      method: record.method,
      room_type: record.room_type,
      payment_date: record.payment_date,
      checkin_date: record.checkin_date,
      checkout_date: record.checkout_date,
      status: record.status,
      children: record.children,
      adult: record.adult,
      booking_id:record.booking_id,
      balance: record.balance || 0,
      guest_id:record.guest_id  
    // Ensure balance is initialized
  };

  // Calculate the new balance
//  const balance = parseInt(payment.amount) + parseInt(payment.balance) - parseInt(this.paymentForm.value.default_amount);
  // console.log(balance)

  try {
    // Start loading indicator
    this.loading.start();

    // Call the service to update payment
    const res = await this.paymentService.updatePaymentCheckout(payment);

    if (res) {
      // Close popup and refresh the payment list
      this.closePopup();
      this.getPaymentList();
    }
  } catch (error) {
    // Show error notification if something fails
    this.toastr.error(null, error);
  } finally {
    // Stop loading indicator
    this.loading.stop();
  }}
  // Calculate the new balance
  async updatePayment(record: any) {
    const payment = {
      id: record.id,
      amount: record.amount,
      name: record.name,
      discount: record.discount,
      method: record.method,
      room_type: record.room_type,
      payment_date: record.payment_date,
      checkin_date: record.checkin_date,
      checkout_date: record.checkout_date,
      status: record.status,
      children: record.children,
      adult: record.adult,
      balance: record.balance || 0, // Ensure balance is initialized
    };
  
    // Calculate the new balance
  //  const balance = parseInt(payment.amount) + parseInt(payment.balance) - parseInt(this.paymentForm.value.default_amount);
    // console.log(balance)
  
    try {
      // Start loading indicator
      this.loading.start();
  
      // Call the service to update payment
      const res = await this.paymentService.updatePayment(payment);
  
      if (res) {
        // Close popup and refresh the payment list
        this.closePopup();
        this.getPaymentList();
      }
    } catch (error) {
      // Show error notification if something fails
      this.toastr.error(null, error);
    } finally {
      // Stop loading indicator
      this.loading.stop();
    }}
async addRefund(record){
    const lst = {
      id :record.id,
      name: record.name,
      refund_amount: record.refund_amount,
      reason: record.reason,
      authorized_by: record.authorized_by
    }
  try{
    this.loading.start();
    console.log(this.paymentForm.value.amount)
    if(lst.refund_amount > this.paymentForm.value.amount){this.toastr.info(null,"Please check,Refund Amount is Greater than what Guest Paid")}
    else{
    var res = await this.paymentService.addRefund(lst);
    if(res) this.toastr.success(null,"Refund process initiated"); this.closePopup(); 
    this.getPaymentList();}
  }catch(error){
    this.toastr.error(null,error);
  }
  
    finally{
      this.loading.stop();
    }
  

}

async deletePayment(id:number){
  try{
    this.loading.start();
    var res = await this.paymentService.deletePayment(id);
    if(res) this.getPaymentList();
  }catch(error){
    this.toastr.error(null,error);
  }
  
    finally{
      this.loading.stop();
    }

}

@ViewChild('pdfTable') pdfTable: ElementRef;
// ...
//PDF genrate button click function
public downloadAsPDF() {
  const doc = new jsPDF();
  //get table html
  const pdfTable = this.pdfTable.nativeElement;
  //html to pdf format
  var html = htmlToPdfmake(pdfTable.innerHTML);
 
  const documentDefinition = { content: html };
  pdfMake.createPdf(documentDefinition).open()
  

}

async searchDates(){

  const d = {
    date: this.paymentForm.value.dates
  }
    try{
      this.loading.start();
      var res = await this.paymentService.searchDates(d);
      if(res) {this.paymentList =res;}
      let sum :number= 0;

      for (let index = 0; index < this.paymentList.length; index++) {
       sum += parseInt(this.paymentList[index].amount);
       this.totalAmount=sum;
       console.log(sum);
   }
      
    

    }
    catch(err){this.toastr.error(null,err.message)}

    finally{this.loading.stop();}
}
  



download(){
  var element = document.getElementById('table');
var opt = {
margin:       1,
filename:     'payments.pdf',
image:        { type: 'jpeg', quality: 0.98 },
html2canvas:  { scale: 2 },
jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
};

// New Promise-based usage:
html2pdf().from(element).set(opt).save();
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

}
