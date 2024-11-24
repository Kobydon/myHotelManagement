import { Component, OnInit } from '@angular/core';
import { FormGroup,FormBuilder, Validators} from '@angular/forms';
import { FormControlName } from '@angular/forms';
import { Router } from '@angular/router';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  createForm!:FormGroup;  
  submitted = false;

  id?:string|null;
  isUserLoggedIn = false;

  constructor(private fb:FormBuilder,private router:Router,private userService:userService,private toastr:ToastrService) { 


    this.createForm = this.fb.group({

      username:['',Validators.required],
      password:['',Validators.required],
      firstname:['',Validators.required],
      lastname:['',Validators.required],
      email:['',Validators.required],
      country:['',Validators.required],
      city:['',Validators.required],
      address:['',Validators.required],
      phone:['',Validators.required],
      about:['',Validators.required],
      // negotiable:['',Validators.required],
      // image:['',Validators.required]
      

    })

  }

  ngOnInit(): void {
  }

 async registerGuest(record){
    const gust ={
      username:record.username,
      password:record.password,
      firstname:record.username,
      lastname:record.lastname,
      email:record.lastname,
      country:record.country,
      city:record.city,
      address:record.address,
      phone:record.phone,
      about:record.about,
    }
    try{
   
     var res = await this.userService.addUser(gust);
     if(res) this.toastr.success(null,"registration successfull,kindly login");
     

    }catch(error){
      
    }
    finally{
      this.router.navigate(["/account/signin"]);
    }
  }

}
