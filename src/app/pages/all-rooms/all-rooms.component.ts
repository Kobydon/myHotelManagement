import { Component, OnInit } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';


@Component({
  selector: 'all-rooms',
  templateUrl: './all-rooms.component.html',
  styleUrls: ['./all-rooms.component.css']
})
export class AllRoomsComponent implements OnInit {
  header:any;
roomForm:FormGroup;
room_info:any;
rooms:any;
base64_string:any;
displayStyle = "none";
roomtype:any;

page = 1;
pageSize: number = 10;
@BlockUI('loading') loading!: NgBlockUI
  constructor(private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService) {
      this.roomForm =  
      
      this.fb.group({

        id:['',Validators.required],
        room_number:['',Validators.required],
        room_type:['',Validators.required],
    
        floor:['',Validators.required],
        duration:['',Validators.required],
        reserved:['',Validators.required],
        description:['',Validators.required],
        image_one :['',Validators.required],
        status :['',Validators.required],
    
        session:['',Validators.required],

        occupied_by:['',Validators.required]
        
  
    })

     }

  ngOnInit(): void {
    this.getRoom();
    this.getRoomType();
  }

  async getRoomType(){
    try{
      this.loading.start();
     var res = await this.roomService.getroomType()
     if(res) this.roomtype =res;

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
     if(res) this.rooms =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }
}





async addRoom(record){
 
// this.submitted= true;

//   if(this.createForm.invalid){
//     return;
//   }
const room:any ={   
 
        room_number:record.room_number,
        room_type:record.room_type,
    
        floor:record.floor,
        duration:record.duration,
        reserved:record.reserved,
        description:record.description,
        image_one :record.image_one,
    
        session:record.session
}
room.image_one= this.base64_string


  try{
    this.loading.start();
 
  
    var res = await this.roomService.post_room(room);
    if (res) this.toastr.success(null,"room type successfully added") ; this.closePopup(); this.getRoom();
  }
  catch(error:any){
    this.toastr.error(null,error);
  }

  finally{
    this.loading.stop();
  }

}





openPopup() {

  this.header ="Add Room";

  this.displayStyle = "block";

}





async EditRoomPopup(id:any) {
    
  this.header ="Edit Room ";

  this.displayStyle = "block";
  try{
    this.loading.start();
    this.room_info =  await this.roomService.get_rooms_details(id);
  
    if ( this.room_info)  
    this.roomForm.patchValue({
    
      id:this.room_info[0].id,
      room_number:this.room_info[0].room_number,
      room_type:this.room_info[0].room_type,
  
      floor:this.room_info[0].floor,
      duration:this.room_info[0].duration,
      reserved:this.room_info[0].reserved,
      description:this.room_info[0].description,
      image_one :this.room_info[0].image_one,
      status :this.room_info[0].status,  
  
      session:this.room_info[0].session


        //  image_one:this.room_info[0].image_one,image_two:this.room_info[0].image_two,image_three:this.room_info[0].image_three
    })
  }
catch (error:any) {
  this.toastr.error(null,error)
} finally {
  this.loading.stop();

}
  
}

closePopup() {
  this.displayStyle = "none";
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




async updateRoom(record){
  const room_typ:any ={  
    id:record.id,
    room_number:record.room_number,
    room_type:record.room_type,

    floor:record.floor,
    duration:record.duration,
    reserved:record.reserved,
    description:record.description,
    image_one :record.image_one,
    status :record.status,  
    occupied_by:record.occupied_by,

    session:record.session

  }
  room_typ.image_one= this.base64_string

  try{
    this.loading.start();
     var res= await this.roomService.updateRooms(room_typ)
          // this.toastr.success(null,"successfully updated profile
          if(res) this.closePopup(); this.getRoom();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }
}




handleUpload(event:any) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
     this.base64_string = reader.result
  };

}




async deleteRoom(id:number){

  try{
    this.loading.start();
     var res= await this.roomService.deleteRoom(id)
          // this.toastr.success(null,"successfully updated profile
          if(res) this.closePopup(); this.getRoom();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }

    
       
}



}
