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


        dates: ['',Validators.required],
    
    
    
        
       
      })
     }

  ngOnInit(): void {
    this.getRoom();

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
async getRoom(){
  try{
    this.loading.start();
   var res = await this.roomService.getrooms()
   if(res) this.roomList =res;

  }
  catch(error:any){
    this.toastr.error(null,error);
  }
   

finally{
  this.loading.stop();
}
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
   var resp = await this.paymentService.searchRefundDates(d);
   if(res) {this.refundList =resp;}
   let summ :number= 0;

   for (let index = 0; index < this.refundList.length; index++) {
    summ += parseInt(this.refundList[index].refund_amount);
    this.totalRefundAmount=summ;
    console.log(sum);
}
   

var rep = await this.roomService.searchRoomDates(d)
if(res) this.rooms =res;
 
   this.totalAvailableRooms =this.roomList.length - this.rooms.length;
   this.totalOcccupiedRooms = this.rooms.length;
  this.occupancy = this.totalOcccupiedRooms / this.roomList.length * 100

  var date1:any = new Date ( this.paymentForm.value.dates);
  var yesterday_date =date1.getDate()-1;  
  
  const z ={
       date: yesterday_date
  }
var ress = await this.roomService.searchYesterdayRoomDates(z);
if(ress) this.yesterdayList =ress;
 let summm :number= 0;

for (let index = 0; index < this.yesterdayList.length; index++) {

  summm += parseInt(this.yesterdayList[index].amount);
  this.yesterday_total=summm;
  console.log(summm);
}

this.yester_daytodate =this.yesterday_total + this.totalAmount;
 


    }

    
    
    catch(err){}

    finally{this.loading.stop();}




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


}
