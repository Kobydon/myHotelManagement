import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { userService } from './user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{ isUserLoggedIn = false; isAdmin = false;
   constructor(private toastr:ToastrService,private router:Router,private userService:userService){

   }
  checking = false;
  
    ngOnInit() {
      let storeData = localStorage.getItem("isUserLoggedIn");
      let adminData = localStorage.getItem("isAdmin");
  

      // if( adminData != null && adminData == "true")
      // this.isAdmin = true;
      // console.log("adminData: " + adminData);

    if(adminData == null )
  
{
   this.router.navigate(['home/features'])
      // this.isUserLoggedIn = false;
      // this.toastr.error(null,"session expired,kindly login again");
      // this.userService.logout();
   }

      if( storeData != null && storeData == "true")
         this.isUserLoggedIn = true;
      else if(storeData == null )
{


         this.toastr.error(null,"session expired,kindly login again");
         this.userService.logout();
      }

         let checkData = localStorage.getItem("checking");
      console.log("admin: " + adminData);

      if( checkData != null && checkData == "true")
         this.checking = true;
      else


         this.checking = false;
   }





}
