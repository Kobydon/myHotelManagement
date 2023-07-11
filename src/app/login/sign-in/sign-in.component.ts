import { Component, OnInit } from '@angular/core';
import { FormGroup,FormBuilder, Validators} from '@angular/forms';
import { FormControlName } from '@angular/forms';
import { Router } from '@angular/router';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {
  createForm!:FormGroup;  
  submitted = false;
  loading = false;
  id?:string|null;
  isUserLoggedIn = false;
  user:any;
  constructor(private fb:FormBuilder,private router:Router,private userService:userService,private toastr:ToastrService) { 


    this.createForm = this.fb.group({

      username:['',Validators.required],
      password:['',Validators.required]
      // condition:['',Validators.required],
      // phone:['',Validators.required],
      // price:['',Validators.required],
      // description:['',Validators.required],
      // city:['',Validators.required],
      // negotiable:['',Validators.required],
      // image:['',Validators.required]
      

    })

  }

  ngOnInit(): void {
  }






  async loginUser(){
    this.submitted= true;
   
   

    if(this.createForm.invalid){
      return;
    }

      
    

    const user:any ={
     
      username:this.createForm.value.username,
      password:this.createForm.value.password,
      condition:this.createForm.value.condition,
     
      // phone:this.createForm.value.phone,
      // price:this.createForm.value.price,
      // description:this.createForm.value.description,
      // city:this.createForm.value.city,
      // negotiable:this.createForm.value.negotiable,
      // image:this.createForm.value.image,
      
      
    }
    //this.loading=true;
    // ad.image= this.base64_string
   try{

    var res = await this.userService.loginUser(user,user.username,user.password)
    if(res) this.userService.setSession(res);

    var x = await this.userService.getUser();
    if(x) this.user=x;

   }catch(error){
   this.toastr.error(null,error.message)
   }
   finally{
    if(this.user[0].roles=="guest")
    this.router.navigate(["/home/features"]);
    else{
      this.router.navigate(["/dashboard"])
    }
   }



  }
 

}
