import { Component, OnInit } from '@angular/core';

import { FormGroup,FormBuilder, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { FormControlName } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { ToastrService } from 'ngx-toastr';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
@Component({
  selector: 'guest',
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.css']
})
export class GuestComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  base64_string:any;
  header:any;
  displayStyle ="none";
  // @Input() ad: Adds ={brand:'',category:'',condition:'',price:'',description:'',
  //                     phone:'',negotiable:'',city:'',image:'',post_by_id:''};
  //  login:Login[]=[];
  createForm!:FormGroup;  
  submitted = false;

  id?:string|null;
  title ='Create Ad';
  isNew = true;
  post = true;
  update = false;
  i_id !:number;
  public roomList:any;
  guestList:any;
  guest_info:any;
page = 1;
pageSize: number = 10;

  constructor(
    private roomService:RoomService,private router:Router,
      private fb:FormBuilder,private route:ActivatedRoute,private guestService:GuestService,
      private toastr:ToastrService
     ) {

        this.createForm = this.fb.group({

          id:['',Validators.required],
        
          room_number:['',Validators.required],
          username:['',Validators.required],
          email:['',Validators.required],
          password:['',Validators.required],
          confirm_password:['',Validators.required],
          dob:['',Validators.required],
          country:['',Validators.required],
          arrival_date :['',Validators.required],
          photo :['',Validators.required],
          id_type :['',Validators.required],
          id_upload:['',Validators.required],



          id_number:['',Validators.required],
          checkout_date:['',Validators.required],
          remark:['',Validators.required],
          work:['',Validators.required],
          city :['',Validators.required],
          gender :['',Validators.required],
          phone :['',Validators.required],
          address:['',Validators.required],
          first_name:['',Validators.required],
          last_name:['',Validators.required],
          region:['',Validators.required],
        
          
          
    
          
    
        })

     

  }

  ngOnInit(): void {
    this.getGuest();
  }

   async  addGuest(record){


    const guest : any ={

      room_number: record.room_number,
      username: record.username,
  
      email: record.email,
      password: record.password,
      dob: record.dob,
      country: record.country,
      arrival_date : record.arrival_date,
      photo : record.photo,
      id_type : record.id_type,
      id_upload: record.id_upload,

      id_number: record.id_number,
      checkout_date: record.checkout_date,
      remark: record.remark,
      work: record.work,
      city : record.city,
      gender : record.gender,
      phone : record.phone,
      address: record.address,
      confirm_password:record.confirm_password,
      first_name:record.first_name,
      last_name:record.last_name,
      region:record.region
    
 

    }
    guest.photo= this.base64_string
    guest.id_upload= this.base64_string
    // console.log(guest.password)
    // console.log(guest.confirm_password)
    // guest.image_three= this.base64_string
    try{
      this.loading.start();
     var res  = await this.guestService.addGuest(guest);
     if(res)this.toastr.success(null,"Guest successfully added"); this.closePopup();this.getGuest();

    
    } catch(error){
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

openPopup() {

  this.header ="Add Guest";

  this.displayStyle = "block";

}
closePopup() {
  this.displayStyle = "none";
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


handleUpload(event:any) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
     this.base64_string = reader.result
  };

}





async EditGuest(id:any) {
    
  this.header ="Edit Guest";

  this.displayStyle = "block";
  try{
    this.loading.start();
    this.guest_info =  await this.guestService.getGuest_info(id);
  
    if ( this.guest_info)  
    this.createForm.patchValue({
     id:this.guest_info[0].id,
      username:this.guest_info[0].username,
      email:this.guest_info[0].email,
      dob:this.guest_info[0].dob,
      country:this.guest_info[0].country,
      arrival_date :this.guest_info[0].arrival_date,

      checkout_date:this.guest_info[0].checkout_date,
      remark:this.guest_info[0].remark,
      work:this.guest_info[0].work,
      city :this.guest_info[0].city,
      gender :this.guest_info[0].gender,
      phone :this.guest_info[0].phone,
      address:this.guest_info[0].address,
      first_name:this.guest_info[0].first_name,
      last_name:this.guest_info[0].last_name,
      region:this.guest_info[0].region
    
      
        //  image_one:this.guest_info[0].image_one,image_two:this.guest_info[0].image_two,image_three:this.guest_info[0].image_three
    })
  }
catch (error:any) {
  this.toastr.error(null,error)
} finally {
  this.loading.stop();

}
  
}


async updateGuest(record){
 
  const guest : any ={
    id:record.id,
    room_number: record.room_number,
    username: record.username,

    email: record.email,
    password: record.password,
    dob: record.dob,
    country: record.country,
    arrival_date : record.arrival_date,
    // photo : record.photo,
    // id_type : record.id_type,
    // id_upload: record.id_upload,

    // id_number: record.id_number,
    checkout_date: record.checkout_date,
    remark: record.remark,
    work: record.work,
    city : record.city,
    gender : record.gender,
    phone : record.phone,
    address: record.address,
    confirm_password:record.confirm_password,
    first_name:record.first_name,
    last_name:record.last_name,
    region:record.region
  


  }
  guest.photo= this.base64_string
  guest.id_upload= this.base64_string
  try{
    this.loading.start();
     var res= await this.guestService.updateGuest(guest)
          // this.toastr.success(null,"successfully updated profile
          if(res) this.closePopup(); this.getGuest();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }
}

  




async checkOut(id:any){


  try{
    this.loading.start();
     var res= await this.guestService.checkout(id)
          // this.toastr.success(null,"successfully updated profile
          if(res)  this.getGuest();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }

}
       



async deleteGuest(id:number){

  try{
    this.loading.start();
     var res= await this.guestService.deleteGuest(id)
          // this.toastr.success(null,"successfully updated profile
          if(res)  this.getGuest();

  }
  catch(error:any){
    this.toastr.error(null,error)
  }
 finally{
  this.loading.stop();

 }

    
       
}








}
