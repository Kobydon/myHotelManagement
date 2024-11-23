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
import { Router } from '@angular/router';

@Component({
  selector: 'refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.css']
})
export class RefundComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  fileName= 'Booking_Payments.xlsx';
  refundForm:FormGroup
  page = 1;
  pageSize: number = 10;
  header:any;
  roomD:any;
 

  base64_string:any;
  displayStyle = "none";
 
  refundList:any;
  
  payList:any;
  payment:any;
  
  totalAmount:any;
  user:any;
  constructor(private fb:FormBuilder,private roomService:RoomService,private toastr:ToastrService,private router:Router,
    private paymentService:PaymentService,private guestService:GuestService,private userService:userService) {
      this.refundForm = this.fb.group({
        id:['',Validators.required],
        payment_id:['',Validators.required],
        name:['',Validators.required],
       
    
        reason:['',Validators.required],
        description:['',Validators.required],
        authorized_by:['',Validators.required],
        refund_amount:['',Validators.required],
        dates:['',Validators.required],

    
    
    
        
       
      })

     }

  ngOnInit(): void {
    this.getRefund();
    this.getUser();
  }

  openPopup(): void {

    this.header ="Add Payment";
  
    this.displayStyle = "block";
   
  
    // this.fecthRooms(this.bookingForm.value.room_type);
  
  }
  closePopup() {
    this.displayStyle = "none";

  }
  
  
  


  async getRefund(){
    try{
      this.loading.start();
     var res = await this.paymentService.getRefund()
     if(res) { this.refundList =res;}
     let sum :number= 0;

     for (let index = 0; index < this.refundList.length; index++) {
      sum += parseInt(this.refundList[index].refund_amount);
      this.totalAmount=sum;
      // console.log(sum);
  }
     

    }

    
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }

  
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

async getUser(){
  try{
      var res = await this.userService.getUser()
      if (res) this.user=res;

  }catch(err){console.log(err)}
  finally{console.log("success");}



}

async searchDates(){

  const d = {
    date: this.refundForm.value.dates
  }
    try{
      this.loading.start();
      var res = await this.paymentService.searchRefundDates(d);
      if(res) {this.refundList =res;}
      let sum :number= 0;

      for (let index = 0; index < this.refundList.length; index++) {
       sum += parseInt(this.refundList[index].refund_amount);
       this.totalAmount=sum;
       console.log(sum);
   }
      
    

    }
    catch(err){this.toastr.error(null,err.message)}

    finally{this.loading.stop();}
}

navigate(){
  this.router.navigate(['/payment'])
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
async approveRefund(id: string) {
  const lst = {
    id: id
  };

  try {
    this.loading.start();  // Show loading indicator

    // Await the response from the updateRefund service
    const res = await this.paymentService.updateRefund(lst);
    
    // If the response is successful, get the updated refund data
    if (res) {
      this.getRefund();
    }
  } catch (error) {
    // Handle the error and display the error message using Toastr
    // Ensure the error.message exists or display a generic error message
    const errorMessage = error?.message || 'An unexpected error occurred. Please try again later.';
    this.toastr.error(errorMessage, 'Refund Approval Failed');
  } finally {
    // Stop the loading indicator whether success or failure
    this.loading.stop();
  }
}

}
