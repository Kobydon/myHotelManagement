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
  selector: 'all-reservations',
  templateUrl: './all-reservations.component.html',
  styleUrls: ['./all-reservations.component.css']
})
export class AllReservationsComponent implements OnInit {
  page = 1;
  pageSize: number = 10;
  header:any;
  openStyle="none";
  displayStyle="none";
  createForm:FormGroup
  @BlockUI('loading') loading!: NgBlockUI
  constructor(private guestService:GuestService,private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService) { 
   this.createForm = this.fb.group({

    id:['',Validators.required],
    adult:['',Validators.required],
    arrival :['',Validators.required],
    departure:['',Validators.required],
    children :['',Validators.required],

    purpose:['',Validators.required],
   room_type:['',Validators.required],
    description :['',Validators.required],

    // image_one :['',Validators.required], 
    // image_two :['',Validators.required],
    country :['',Validators.required],
    price :['',Validators.required],
    name :['',Validators.required],
    status :['',Validators.required],
    payment_status :['',Validators.required],
    room_number :['',Validators.required],
   })
  }
  reserveList:any
  ngOnInit(): void {
    this.getReservation()
  }



  async getReservation(){
    try{
      this.loading.start();
     var res = await this.guestService.allReservation()
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



async openPopup(id) {
  // var date1= new Date ( this.createForm.value.arrival);

  // var date2 = new Date ( this.createForm.value.departure);
  // var difference_in_time = date2.getTime() - date1.getTime();
 
  // console.log(date2);
  // console.log(this.day_differnce);
  try{
    this.header ="Edit Reservation";

    this.displayStyle = "block";
    var res = await this.guestService.get_reserve_for(id);
    this.reserveList=res;
    if (res) this.createForm.patchValue({
      id:this.reserveList[0].id,
      adult:this.reserveList[0].adult,
      arrival :this.reserveList[0].arrival,
      departure:this.reserveList[0].departure,
      children :this.reserveList[0].children,
  
      purpose:this.reserveList[0].purpose,
     room_type:this.reserveList[0].room_type,
      description :this.reserveList[0].description,
  
      // image_one :['',Validators.required], 
      // image_two :['',Validators.required],
      country :this.reserveList[0].country,
      price :this.reserveList[0].price,
      name :this.reserveList[0].name,
      status :this.reserveList[0].status,
      payment_status :this.reserveList[0].Payment_status,
      room_number :this.reserveList[0].room_nmber,

    })
  }
  catch(error){
    console.log(error)
  }
  finally{

  }


  
  // this.fecthRooms(this.bookingForm.value.room_type);

}



async UpdateReservation(record){
  const rsv ={
    adult:record.adult,
    arrival :record.arrival,
    departure:record.departure,
    children :record.children,

    purpose:record.purpose,
   room_type:record.room_type,
    description :record.description,
    country :record.country,
    price :record.price,
    name :record.name,
    status :record.status,
    payment_status :record.payment_status,
    room_number :record.room_number,
    id:record.id


  }

  try{
    this.loading.start();
    var res = await this.guestService.updateReservation(rsv);
    if(res) this.closePopup();this.getReservation();
  } catch(error){
    this.toastr.error(null,error.message)
  }
  finally{
    this.loading.stop();
  }
}

async printReciept(id:number){

  this.openStyle ="block"

    try{
      this.loading.start();
      var res = await this.guestService.get_reserve_for(id);
      if (res) this.reserveList=res;
      if(this.reserveList[0].payment_status="Pending"){
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
closePopup() {
  this.displayStyle = "none";
  this.openStyle = "none";
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

