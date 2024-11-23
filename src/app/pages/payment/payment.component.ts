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

    room_number :['',Validators.required]
    
   
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
  this.getRoomType();

  // this.fecthRooms(this.bookingForm.value.room_type);

}
closePopup() {
  this.displayStyle = "none";
  this.openStyle = "none";
}



async getRoomType(){
  try{
    this.loading.start();
   var res = await this.roomService.getroomType()
   if(res) this.rooms =res;

  }
  catch(error:any){
    this.toastr.error(null,error);
  }
   

finally{
  this.loading.stop();
}
}


async fetchBookings(id:number){
  try{
    this.loading.start();
    var res = await this.roomService.get_booking_details(id);
    if (res) this.bookingDetail =res;
    this.paymentForm.patchValue({
      id:id,    guest_id:this.bookingDetail[0].guest_id, room_number:this.bookingDetail[0].room_number,
      checkin_date: this.bookingDetail[0].arrival_date, checkout_date: this.bookingDetail[0].departure_date,
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
    this.loading.stop();
  }
}






async fetchRoomType(id:number){
  try{
    this.loading.start();
    var res = await this.roomService.get_room_details(id);
    if (res) this.roomD =res;
    this.paymentForm.patchValue({
      // amount:this.roomD[0].base_price *  this.paymentForm.value.duration, 
      // topay:this.roomD[0].base_price *  this.paymentForm.value.duration
      amount:this.roomD[0].base_price  ,
      topay:this.roomD[0].base_price
    })
  } catch (error){
    this.toastr.error(null,error)
  }
  finally{
    this.loading.stop();
  }
}


calDiscount(record){
  this.paymentForm.patchValue({amount:this.paymentForm.value.amount - this.paymentForm.value.amount
  * this.paymentForm.value.discount/100})
  // this.roomForList[0].base_price*this.createForm.value.duration - 
  //     this.roomForList[0].base_price *this.createForm.value.duration*this.createForm.value.discount/100

}



 async addpayment(record){
  const payment:any = {
   amount:record.amount,    
    name: record.name,
    guest_id:record.guest_id,

     discount : record.discount,
      // reserved:['',Validators.required],
    method: record.method,
    room_type : record.room_type,
   
    payment_date : record.payment_date,

    checkin_date : record.checkin_date,
    checkout_date :record.checkout_date,
    status :record.status,

    children :record.children,
    room_number:record.room_number,
    adult :record.adult,
    balance: this.paymentForm.value.topay - record.amount
}


try{
  this.loading.start();
  var res = await this.paymentService.addPayment(payment);
  if(res) this.toastr.success(null,"Payment successfully added"); this.closePopup();this.getPaymentList();
}catch(error){
  this.toastr.error(null,error);
}

  finally{
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


async getUser(){
  try{
      var res = await this.userService.getUser()
      if (res) this.user=res;

  }catch(err){console.log(err)}
  finally{console.log("success");}



}



async printReciept(id:number){
  this.header ="Receipt"
  this.openStyle ="block"

    try{
      this.loading.start();
      var res = await this.paymentService.get_payment_for(id);
      if (res) this.payList=res;
    }
    catch(error){
      this.toastr.error(null,error);
    }
    finally{
      this.loading.stop();
    }



}



async updatePayment(record){
  const payment:any = {
    id:record.id,
   amount:record.amount,    
    name: record.name,

     discount : record.discount,
      // reserved:['',Validators.required],
    method: record.method,
    room_type : record.room_type,
   
    payment_date : record.payment_date,

    checkin_date : record.checkin_date,
    checkout_date :record.checkout_date,
    status :record.status,

    children :record.children,
    adult :record.adult,

}

try{
  this.loading.start();
  var res = await this.paymentService.updatePayment(payment);
  if(res)  this.closePopup();this.getPaymentList();
}catch(error){
  this.toastr.error(null,error);
}

  finally{
    this.loading.stop();
  }

}

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
