import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


import { Observable, lastValueFrom, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import {shareReplay } from 'rxjs/operators'



import * as moment from 'moment';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({ providedIn: 'root' })
export class userService {
message:any;
user:any;
  private userUrl = 'https://renderdemo-w1s0.onrender.com  ';  // URL to REST API
   
 
  isUserLoggedIn: boolean = false;
  redirectUrl?: string;
  isAdmin: boolean = false;

  constructor(private http: HttpClient,private router:Router,private toastr:ToastrService) { }

  // /** GET users from the server */
  // getAds(): Observable<Ads[]> {
    
  //   return this.http.get<Ads[]>(this.userUrl + '/ads_by_user/');
  // }
  
  // /** GET user by id. Will 404 if id not found */
  // getAdds(id: number): Observable<any> {
  //   const url = `${this.userUrl}/ads_to_get/${id}`;
  //   return this.http.get<Ads>(url).pipe(map((res:any)=>{

  //     return res;

  //    }))


   
  // }
  
  /** POST: add a new user to the server */

  



  addUser(ad:any){
    return lastValueFrom(this.http.post(this.userUrl + '/user/register_quick',ad,httpOptions));

        
  }

  
  loginUser(user,password:any,username:any) {
    
      
    this.isUserLoggedIn = username == user.username && password == user.password;
    localStorage.setItem('isUserLoggedIn', this.isUserLoggedIn ? "true" : "false");
    localStorage.setItem('is_Admin', this.isAdmin ? "true" : "false");
 
  
    return lastValueFrom (  this.http.post(this.userUrl + '/user/get_signin_client', user, httpOptions));
      
        
   
         

          
     
       
        
     
      
     
        
  
   
    
      
    
 
      // we'll proceed, but let's report it
      // this.errorMessage();
    

  


    
      
      
  



      
      }

	//console.log(user);
  logout() {
    this.isUserLoggedIn = false;
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
  
    localStorage.removeItem('isUserLoggedIn');
    localStorage.removeItem('isAdmin');
    return this.router.navigate(['/account/signin']) 
  }
public isLoggedIn() {
    return moment().isBefore(this.getExpiration());
}

// isLoggedOut() {
//     return !this.isLoggedIn();
// }

 setSession(authResult:any) {
  const expiresAt = moment().add(authResult.expiresIn,'second');

   localStorage.setItem("id_token",(<any>authResult).id_token)
   let data =    localStorage.getItem("id_token");
   if (data ){
    localStorage.setItem('isUserLoggedIn','true');
  
   }

}

getExpiration() {
    const expiration :any = localStorage.getItem("expires_at");
    const expiresAt  = JSON.parse(expiration);
    return moment(expiresAt);
}    


getUser(){
  return lastValueFrom( this.http.get<any[]>(this.userUrl + '/user/get_info'));
}n

getUsers(){
return lastValueFrom(this.http.get<any[]>(this.userUrl + '/user/get_users'));
}




get_user_details(id: any){
  const url = `${this.userUrl}/user/get_user_details/${id}`;
  return  lastValueFrom(this.http.get<any[]>(url));
}

updateUserProfile(ad: any) {
     return lastValueFrom( this.http.put(this.userUrl + '/user/update_user_profile', ad, httpOptions));
}
  // postcart(cart:any) {
  //   //console.log(user);
  //     return this.http.post(this.userUrl + '/cart', cart, httpOptions);
  //   }
  
  // /** PUT: update the user on the server */
  // // updateAd(ad:any) :observable<any>  {
  // //   return this.http.put(this.userUrl + '/update_ad_by_user/', ad, httpOptions);
  // // }
  //  /** PUT: update the user on the server */
  //  updateAd(ad: any): Observable<any> {
  //   return this.http.put(this.userUrl + '/update_ad_by_user', ad, httpOptions);
  // }


  
  
  /** DELETE: delete the user from the server */
  deleteUser(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.userUrl}/user/delete_user/${id}`;
		return lastValueFrom(   this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  
}