import { Component, OnInit } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { error } from 'console';
import { userService } from 'app/user.service';


@Component({
  selector: 'bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  user:any;
  header:any;
  bookingForm:FormGroup;
  room_info:any;
  booking_info:any;
  rooms:any;
  base64_string:any;
  displayStyle = "none";
  roomtype:any;
  bookings:any;
  guestList:any;
  roomList:any;
  guestDetails:any;
  load=false;
  page = 1;
  pageSize: number = 10;

  @BlockUI('loading') loading!: NgBlockUI
  constructor(private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService,private guestService:GuestService,
    private userService:userService) { 

    this.bookingForm =  
      
    this.fb.group({

      id:['',Validators.required],
      name:['',Validators.required],
      room_type:['',Validators.required],
      country:['',Validators.required],
      nema:['',Validators.required],
      
      // Language:['',Validators.required],
      purpose:['',Validators.required],
      
      // checkin:['',Validators.required],
      departure_date:['',Validators.required],
      // checkout :['',Validators.required],
      arrival_date :['',Validators.required],
      adult :['',Validators.required],
      children:['',Validators.required],
      day:['',Validators.required],
      guest_id:['',Validators.required],



      room_number:['',Validators.required],
      // checkout_date:['',Validators.required],
      // rate:['',Validators.required],
      // amount:['',Validators.required],
      // discount_type :['',Validators.required],
      // discount_value :['',Validators.required],
      // payment_type :['',Validators.required],
      status:['',Validators.required],
  })
  }

  ngOnInit(): void {
    this.getBookingList();

    this.getRoomType();
    this.getUser();
 

  }

  canGlow(departureDate: string): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHours = now.getHours();

    return departureDate === today && currentHours >= 12;
  }

  
  async checkOut(id:any){


    try{
      this.loading.start();
      // this.load=true;
  
  
       var res= await this.guestService.checkout(id)
            // this.toastr.success(null,"successfully updated profile
            if(res)  this.getBookingList();
  
    }
    catch(error:any){
      this.toastr.info(null,"kindly pay all pending bills  before checkout")
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
 
    }       
  }
}

async getGuest(){
  try{
    // this.loading.start();
    var res = await this.guestService.getGuests();
    if(res) this.guestList=res; 

  } catch(error){
    this.toastr.error(null,error)
  }
finally{
  this.loading.stop();
}
  
}
  async getRoomType(){
    try{
      // this.loading.start();
     var res = await this.roomService.getroomType()
     if(res) this.roomtype =res;

    }
    catch(error:any){
      // this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
  }
}


  async getRoom(){
    try{
      // this.loading.start();
     var res = await this.roomService.getrooms()
     if(res) this.rooms =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
  }
}


async fetchRooms(record){
      try{
        // this.loading.start();
        var res = await this.roomService.fetchRoomsByType(record);
        if (res) this.roomList =res;
      } catch (error){
        console.log(error)
      }
      finally{
        // this.loading.stop();
      }
}


async fetchGuest(id:number){
  try{
    // this.loading.start();
    var res = await this.guestService.getGuest_info(id);
    if (res) this.guestDetails =res;
    this.bookingForm.patchValue({
      arrival_date: this.guestDetails[0]?.arrival_date, departure_date: this.guestDetails[0]?.checkout_date,
      country:this.guestDetails[0]?.country,guest_id:this.guestDetails[0]?.id,nema:this.guestDetails[0]?.first_name + ' ' + this.guestDetails[0]?.last_name 
    })
  } catch (error){
    this.toastr.error(null,error)
  }
  finally{
    // this.loading.stop();
  }
}





 async addBooking(record){
  const book ={

    name:this.bookingForm.value.nema,
    guest_id:record.guest_id,
    room_type:record.room_type,
    country: record.country,
    // Language:['',Validators.required],
    purpose: record.purpose,
    
    // checkin:['',Validators.required],
    departure_date: record.departure_date,
    // checkout :['',Validators.required],
    arrival_date : record.arrival_date,
    adult : record.adult,
    children: record.children,



    room_number:record.room_number,

    status: record.status

  }
  try{
    this.loading.start();
    var res = await this.roomService.addBooking(book); 
    if (res) this.toastr.success(null,"booking successfully added"); this.closePopup(); this.getBookingList();
  } catch(error){
    this.toastr.error(null,error)
  }
  finally{
    this.loading.stop();
  }
}





async updateBooking(record){


  const book ={
   id:record.id,
    name:record.name,
    room_type:record.room_type,
    country: record.country,
    // Language:['',Validators.required],
    purpose: record.purpose,
    
    // checkin:['',Validators.required],
    departure_date: record.departure_date,
    // checkout :['',Validators.required],
    arrival_date : record.arrival_date,
    adult : record.adult,
    children: record.children,



    room_number:record.room_number,

    status: record.status,
    day: 0

  }
  var date1= new Date ( this.bookingForm.value.arrival_date);
  var date2 = new Date ( this.bookingForm.value.departure_date);
  var difference_in_time = date2.getTime() - date1.getTime();
  let day_difference = difference_in_time/(1000 * 3600*24);
  book.day = day_difference
  try{
    this.loading.start();
    var res = await this.roomService.updateBooking(book); 
    if (res)  this.closePopup(); this.getBookingList();
  } catch(error){
    this.toastr.error(null,error)
  }
  finally{
    this.loading.stop();
  }
  
  
}

openPopup() {

  this.header ="Add Booking";

  this.displayStyle = "block";
  this.getGuest();
  this.getRoomType();
  // this.fecthRooms(this.bookingForm.value.room_type);

}
closePopup() {
  this.displayStyle = "none";
}




async editBooking(id:any) {
    
  this.header ="Edit booking ";

  this.displayStyle = "block";
  try{
    this.loading.start();

    var res =  await this.roomService.get_booking_details(id);

  
    if ( res)   this.booking_info =res;
    this.bookingForm.patchValue({
       id:this.booking_info[0].id, 

       country:this.booking_info[0].country,
       status:this.booking_info[0].status,
       purpose: this.booking_info[0].purpose,
       departure_date:this.booking_info[0].departure_date,
       name:this.booking_info[0].name,

     
      //  departure_date: this.booking_info[0].arrival_date,
       // checkout :['',Validators.required],
       arrival_date : this.booking_info[0].arrival_date,
       adult : this.booking_info[0].adult,
       children:this.booking_info[0].children,
       room_type:this.booking_info[0].room_type,
       room_number: this.booking_info[0].room_number,
  
        //  image_one:this.room_info[0].image_one,image_two:this.room_info[0].image_two,image_three:this.room_info[0].image_three
    })
    console.log(this.bookingForm.value.departure_date)
  }
catch (error:any) {
   console.log(error)
} finally {
  this.loading.stop();

}
  
} async deletebooking(id:number){

  try{
    this.loading.start();
     var res= await this.roomService.deleteBooking(id)
          // this.toastr.success(null,"successfully updated profile
          if(res)  this.getBookingList();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }

}


}

