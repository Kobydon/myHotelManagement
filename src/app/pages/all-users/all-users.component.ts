import { Component, OnInit } from '@angular/core';
import { userService } from 'app/user.service';
import { lastValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'all-users',
  moduleId: module.id,
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css']
})
export class AllUsersComponent implements OnInit {
users:any[];
// @BlockUI() blockUI: NgBlockUI;
header:any;
userForm:FormGroup;
user_info:any;

page = 1;
pageSize: number = 10;

@BlockUI('loading') loading!: NgBlockUI;
  constructor(private userService:userService,private toastr:ToastrService,private fb: FormBuilder
    ) { 
      this.userForm = this.fb.group({
        id : ['',Validators.required],
        firstname : ['',Validators.required],
        about : ['',Validators.required],
        lastname : ['',Validators.required],
        phone : ['',Validators.required],
        username : ['',Validators.required],
        password : ['',Validators.required],
        role : ['',Validators.required],
        country : ['',Validators.required],
        city : ['',Validators.required],
        address : ['',Validators.required],
        email : ['',Validators.required],

    })
    }

  ngOnInit(): void {
    this.getUsers();
      
    
    
   

    
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

  displayStyle = "none";
  
  openPopup() {

    this.header ="Add User";

    this.displayStyle = "block";

  }


    async EditUserPopup(id:any) {
    
    this.header ="Edit User";

    this.displayStyle = "block";
    try{
      this.loading.start();
      this.user_info =  await this.userService.get_user_details(id);
      console.log(id);
      if ( this.user_info)  
      this.userForm.patchValue({
         id:this.user_info[0].id, firstname:this.user_info[0].firstname,username:this.user_info[0].username,
         about:this.user_info[0].about,
          lastname:this.user_info[0].lastname,country:this.user_info[0].country,city:this.user_info[0].city,role:this.user_info[0].roles,
          email:this.user_info[0].email,address:this.user_info[0].address,phone:this.user_info[0].phone
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

  async getUsers(){ 
    try{
      this.loading.start();
      this.users = await this.userService.getUsers();
    
   
      
    }


catch (error) {
  // this.toastr.error(null,"something went")
  } finally {

    this.loading.stop();
   

   


   
  }
    console.log(this.users);
  }

  async addUser(record){

    const new_info = {


      firstname :record.firstname,
      about : record.about,
      lastname : record.lastname,
      phone : record.phone,
      username :record.username,
      password :record.password,
      country :record.country,
      city : record.city,
      address :record.address,
      email : record.email,
      role : record.role
  }

  try {
  
    this.loading.start();
    var res = await this.userService.addUser(new_info);
    if (res)this.toastr.success(null,"user successfully added"); this.closePopup(); this.getUsers();
  } catch (error:any) {
    this.toastr.error(null,error)
  } finally {
    this.loading.stop();
  }
  }
 async  updateProfile(record){
    const new_info = {

        id : record.id,
        firstname :record.firstname,
        about : record.about,
        lastname : record.lastname,
        phone : record.phone,
        username :record.username,
        password :record.password,
        country :record.country,
        city : record.city,
        address :record.address,
        email : record.email,
        role:record.role
    }
    try{
       var res=  await this.userService.updateUserProfile(new_info)
            // this.toastr.success(null,"successfully updated profile
            if(res) this.closePopup(); this.getUsers();

    }
    catch(error:any){
      this.toastr.error(null,error)
    }
   finally{
    this.loading.stop();

   }
}

async deleteUser(id){

  try{
    this.loading.start();
    var res = await this.userService.deleteUser(id);
    if (res) this.getUsers();
  }catch(error){
    this.toastr.error(null,error)
  }
  finally{
    this.loading.stop();
  }

}

}


