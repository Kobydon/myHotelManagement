import { Component, OnInit } from '@angular/core';

import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { error } from 'console';

import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import htmlToPdfmake from 'html-to-pdfmake';
import {  ViewChild, ElementRef  } from '@angular/core';

@Component({
  selector: 'track-reservation',
  templateUrl: './track-reservation.component.html',
  styleUrls: ['./track-reservation.component.css']
})
export class TrackReservationComponent implements OnInit {
  page = 1;
  pageSize: number = 10;
  header:any;
  openStyle="none";
  displayStyle="none";
  @BlockUI('loading') loading!: NgBlockUI
  constructor(private guestService:GuestService,private toastr:ToastrService) { }
  reserveList:any
  ngOnInit(): void {
    this.getReservation()
  }



  async getReservation(){
    try{
      this.loading.start();
     var res = await this.guestService.CustomReservation()
     if(res) this.reserveList =res;

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



async printReciept(id:number){

  this.openStyle ="block"

    try{
      this.loading.start();
      var res = await this.guestService.get_reserve_for(id);
      if (res) {this.reserveList=res;}
      if(this.reserveList[0].payment_status=="Pending"){
        this.header ="Invoice";
      }
      else{
        this.header ="Receipt";
      }
    }
    catch(error){
      this.toastr.error(null,error);
    }
    finally{
      this.loading.stop();
    }



}


  async cancelReservation(id){
  try{
    this.loading.start();
    var res= await this.guestService.cancelReservation(id)
    if(res) this.getReservation();
  }catch(error){
    this.toastr.error(null,error.message)
  }
  finally{
    this.loading.stop();
  }
}


closePopup() {
  this.displayStyle = "none";
  this.openStyle = "none";
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
}

