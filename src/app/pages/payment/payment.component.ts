import { Component, OnInit } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

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
@Component({
  selector: 'payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
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
  constructor(private fb:FormBuilder,private roomService:RoomService,private toastr:ToastrService,
    private paymentService:PaymentService,private guestService:GuestService) { 
      
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
    filter: ['',Validators.required]
    
   
  })
}


  ngOnInit(): void {

    this.getPaymentList();
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
     if(res) {this.paymentList =res;}
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
  this.loading.start();
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
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
      this.loading.stop();
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
      id:id,
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
      amount:this.roomD[0].base_price *  this.paymentForm.value.duration
     
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
  var res = await this.paymentService.addPayment(payment);
  if(res) this.toastr.success(null,"Payment successfully added"); this.closePopup();this.getPaymentList();
}catch(error){
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


}
