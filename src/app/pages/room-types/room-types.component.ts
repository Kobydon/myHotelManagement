import { Component, OnInit } from '@angular/core';
import { userService } from 'app/user.service';
import { lastValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';

@Component({
  selector: 'room-types',
  templateUrl: './room-types.component.html',
  styleUrls: ['./room-types.component.css']
})
export class RoomTypesComponent implements OnInit {
  header:any;
roomTypeForm:FormGroup;
room_info:any;
rooms:any;
base64_string:any;

page = 1;
pageSize: number = 10;

@BlockUI('loading') loading!: NgBlockUI;

  constructor(private userService:userService,private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService) { 
    this.roomTypeForm =  
      
      this.fb.group({

        id:['',Validators.required],
        type:['',Validators.required],
        base_occupancy :['',Validators.required],
        extral_bed_price:['',Validators.required],
        kids_occupancy :['',Validators.required],

        base_price:['',Validators.required],
        amenities :['',Validators.required], 
        description :['',Validators.required],

        image_one :['',Validators.required], 
        image_two :['',Validators.required],
        image_three :['',Validators.required]

    })


    


  }

  ngOnInit(): void {
    this.getRoomType();
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


displayStyle = "none";

// async EditUserPopup(id:any) {
    
//   this.header ="Edit User";

//   this.displayStyle = "block";
//   try{
//     this.loading.start();
//     this.room_info =  await this.userService.get_user_details(id);
//     console.log(id);
//     if ( this.room_info)  
//     this.userForm.patchValue({
//        id:this.room_info[0].id, firstname:this.room_info[0].firstname,username:this.room_info[0].username,
//        about:this.room_info[0].about,
//         lastname:this.room_info[0].lastname,country:this.room_info[0].country,city:this.room_info[0].city,role:this.room_info[0].roles,
//         email:this.room_info[0].email,address:this.room_info[0].address,phone:this.room_info[0].phone
//     })
//   }
// catch (error:any) {
//   this.toastr.error(null,error)
// } finally {
//   this.loading.stop();

// }
  
// }
 
openPopup() {

  this.header ="Add Room";

  this.displayStyle = "block";

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




async addRoomType(record){
  console.log(record);
// this.submitted= true;

//   if(this.createForm.invalid){
//     return;
//   }
const room_typ:any ={   
  type:record.type,
  base_occupancy:record.base_occupancy,
  extral_bed_price:record.extral_bed_price,
  kids_occupancy:record.kids_occupancy,
  base_price:record.base_price,
  amenities:record.amenities,  
  description:record.description,
  image_one:record.image_one,
  image_two:record.image_two,
  image_three:record.image_three   
}
room_typ.image_one= this.base64_string
room_typ.image_two= this.base64_string
room_typ.image_three= this.base64_string

  try{
    
 
  
    var res = await this.roomService.postroom_type(room_typ);
    if (res) this.toastr.success(null,"room type successfully added") ; this.closePopup(); this.getRoomType();
  }
  catch(error:any){
    this.toastr.error(null,error);
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



async EditRoomPopup(id:any) {
    
  this.header ="Edit Room Type";

  this.displayStyle = "block";
  try{
    this.loading.start();
    this.room_info =  await this.roomService.get_room_details(id);
  
    if ( this.room_info)  
    this.roomTypeForm.patchValue({
       id:this.room_info[0].id, description:this.room_info[0].description,base_price:this.room_info[0].base_price,
       kids_occupancy:this.room_info[0].kids_occupancy,
        base_occupancy:this.room_info[0].base_occupancy,amenities:this.room_info[0].amenities,type:this.room_info[0].room_type,extral_bed_price:this.room_info[0].extral_bed_price,
        //  image_one:this.room_info[0].image_one,image_two:this.room_info[0].image_two,image_three:this.room_info[0].image_three
    })
  }
catch (error:any) {
  this.toastr.error(null,error)
} finally {
  this.loading.stop();

}
  
}


async updateRoomType(record){
  const room_typ:any ={  
    id:record.id, 
    type:record.type,
    base_occupancy:record.base_occupancy,
    extral_bed_price:record.extral_bed_price,
    kids_occupancy:record.kids_occupancy,
    base_price:record.base_price,
    amenities:record.amenities,  
    description:record.description,
    image_one:record.image_one,
    image_two:record.image_two,
    image_three:record.image_three   
  }
  room_typ.image_one= this.base64_string
  room_typ.image_two= this.base64_string
  room_typ.image_three= this.base64_string
  try{
    this.loading.start();
     var res= await this.roomService.updateRoom(room_typ)
          // this.toastr.success(null,"successfully updated profile
          if(res) this.closePopup(); this.getRoomType();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }
}


 async deleteRoom(id:number){

  try{
    this.loading.start();
     var res= await this.roomService.deleteRoomType(id)
          // this.toastr.success(null,"successfully updated profile
          if(res)  this.getRoomType();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }

    
       
}

}
