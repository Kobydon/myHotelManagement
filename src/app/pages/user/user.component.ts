import { Component, OnInit } from '@angular/core';
import { userService } from 'app/user.service';
import { lastValueFrom } from 'rxjs';
import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
@Component({
    selector: 'user-cmp',
    moduleId: module.id,
    templateUrl: 'user.component.html'
})


export class UserComponent implements OnInit{
    @BlockUI('loading') loading!: NgBlockUI
    constructor(private userService: userService,private fb:FormBuilder,private toastr:ToastrService){
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
    user_info;
    userForm:FormGroup;

    ngOnInit(){
        this.getUserDetail();
    }


    errorMessage(){
        try {
          throw new Error('username or password is wrong')
        } catch (error) {
          // we'll proceed, but let's report it
          // reportError({message: error.message})
          this.toastr.error(error.message)
        }
    
      } 
  async  getUserDetail(){
        // const res =  await this.userService.getUser();
        // this.user_info = await laxpstValueFrom(res);
         var res = await this.userService.getUser();
         if(res)
            this.user_info=res
            this.userForm.patchValue({
               id:res[0].id, firstname:res[0].firstname,username:res[0].username,about:res[0].about,
                lastname:res[0].lastname,country:res[0].country,city:res[0].city,role:res[0].roles,
                email:res[0].email,address:res[0].address,phone:res[0].phone
            })

       
  

    }

   async updateProfile(record){
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
        }
        try{
   this.loading.start();
            var res = await this.userService.updateUserProfile(new_info)
            if(res)   this.getUserDetail();

         

        }
        catch(err){
          this.errorMessage()
        }
       finally{
        this.loading.start();
     
       }
    }
}
