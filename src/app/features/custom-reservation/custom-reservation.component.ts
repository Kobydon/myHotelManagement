import { Component, OnInit } from '@angular/core';
import { userService } from 'app/user.service';
import { lastValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { Router } from '@angular/router';


@Component({
  selector: 'custom-reservation',
  templateUrl: './custom-reservation.component.html',
  styleUrls: ['./custom-reservation.component.css']
})
export class CustomReservationComponent implements OnInit {
  room_info:any;
  rooms:any;
  base64_string:any;
  createForm:FormGroup
  day_differnce:any;

  
  page = 1;
  pageSize: number = 10;
  showRoom ="none";
  displayStyle="none";
  header:any;
  
  @BlockUI('loading') loading!: NgBlockUI;
  
  constructor(private userService:userService,private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService,private guestService:GuestService,private router:Router) { 
    this.createForm =  
      
      this.fb.group({

        id:['',Validators.required],
        adult:['',Validators.required],
        arrival :['',Validators.required],
        departure:['',Validators.required],
        children :['',Validators.required],

        purpose:['',Validators.required],
       room_type:['',Validators.required],
        description :['',Validators.required],

        email :['',Validators.required], 
        phone :['',Validators.required],
        country :['',Validators.required],
        price :['',Validators.required],
        name :['',Validators.required]

    })


    


  }

  ngOnInit(): void {
  }


  async searchRooms(record){
    try{
     if(record.children=="" || record.adult==""|| record.arrival ==""||record.departure==""){
     
        this.toastr.error(null,"kindly fill all fields")
       

     }
     else{
      this.loading.start()
      this.createForm.patchValue({children:record.children,adult:record.adult,arrival:record.arrival,
      departure:record.departure});
      var res = await this.roomService.getroomType();
      if(res)
      this.rooms=res;
    }
  }catch(error){
      this.toastr.error(null,error)
    }
    finally{
      this.showRoom="yes"
      this.loading.stop()
    }
 
  }


  async openPopup(id) {
    var date1= new Date ( this.createForm.value.arrival);

    var date2 = new Date ( this.createForm.value.departure);
    var difference_in_time = date2.getTime() - date1.getTime();
    this.day_differnce = difference_in_time/(1000 * 3600*24);
    console.log(date2);
    console.log(this.day_differnce);
    try{
      this.header ="Add Reservation";
  
      this.displayStyle = "block";
      var res = await this.roomService.get_room_details(id);
      this.room_info=res;
      if (res) this.createForm.patchValue({price:this.room_info[0].base_price*this.day_differnce,
        room_type:this.room_info[0].room_type})
    }
    catch(error){
      console.log(error)
    }
    finally{

    }

  
    
    // this.fecthRooms(this.bookingForm.value.room_type);
  
  }



async addReservation(record){
    const reserve ={
      adult:record.adult,
      arrival :record.arrival,
      departure:record.departure,
      children :record.children,

      purpose:record.purpose,
      room_type:record.room_type,
      name:record.name,
      email: record.email,
      phone: record.phone,
   

      // image_one :['',Validators.required], 
      // image_two :['',Validators.required],
      country :record.country,
      price :record.price

    }

    try{
      this.loading.start();
      var res = this.guestService.addReservation(reserve);
      
      if(res) this.toastr.success(null,"Successfull");
      this.closePopup();
    }catch(error){
      this.toastr.error(error.message)
    }
   finally{
    this.loading.stop();
    this.router.navigate(['/home/track-reservation']);

   }
}



  closePopup() {
    this.displayStyle = "none";
  }
  
}
