import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { userService } from './user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{ isUserLoggedIn = false;
   constructor(private toastr:ToastrService,private router:Router,private userService:userService){

   }
  checking = false;
  
    ngOnInit() {
      let storeData = localStorage.getItem("isUserLoggedIn");
      console.log("StoreData: " + storeData);

      if( storeData != null && storeData == "true")
         this.isUserLoggedIn = true;
      else if(storeData == null )
{

         this.isUserLoggedIn = false;
         this.toastr.error(null,"session expired,kindly login again");
         this.userService.logout();
      }

         let checkData = localStorage.getItem("checking");
      console.log("checkData: " + checkData);

      if( checkData != null && checkData == "true")
         this.checking = true;
      else


         this.checking = false;
   }





}
