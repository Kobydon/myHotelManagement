import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, lastValueFrom, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// import { guest } from '../guest';


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class GuestService {

  // private guestUrl = 'https://renderdemo-w1s0.onrender.com';  // URL to REST API
  private guestUrl = 'https://renderdemo-hwz6.onrender.com';

  constructor(private http: HttpClient,private router:Router) { }

  /** GET guests from the server */
  getroomType(): Observable<any[]> {
    return this.http.get<any[]>(this.guestUrl + '/room/get_room_type');
  }

getrooms():Observable<any[]>{
   return this.http.get<any[]>(this.guestUrl + '/room/get_room');
}

getGuests(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_all_guest')) ;
}

CustomReservation(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_reserve')) ;
}


allReservation(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_all_reserve')) ;
}




getmaleGuests(): Observable<any[]>{

    return  this.http.get<any[]>(this.guestUrl + '/guest/get_male_guest')

}
addExpense(dep:any) {
  //console.log(guest);
    return  lastValueFrom (  this.http.post(this.guestUrl + '/gust/add_expense', dep, httpOptions));
  }  
  deleteExpense(id:number) {
    if (confirm("do you want to delete?")) {
    // const id = typeof ad === 'number' ? ad : ad.id;
    const url = `${this.guestUrl}/school/delete_expense/${id}`;
    return  lastValueFrom(  this.http.delete(url, httpOptions))
    }
    return of({});
  }
   
  getExpenseList() {
    //console.log(guest);
      return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/school/get_expense_list'));
    }
    searchExpenseDate(d){
      return 
       lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates', d, httpOptions));
    }
    
  updateExpense(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_expense', dep, httpOptions));
    }       
  
getExpense(id: number){
  const url = `${this.guestUrl}/guest/get_expense/${id}`;
  return   lastValueFrom( this.http.get<any>(url));
}
getfemaleGuest(): Observable<any[]>{

  return  this.http.get<any[]>(this.guestUrl + '/guest/get_female_guest')

} 


getcheckOut(): Observable<any[]>{

  return  this.http.get<any[]>(this.guestUrl + '/guest/checkout_today')

} 

  /** GET guest by id. Will 404 if id not found */
  getEmployee(id: any): Observable<any> {
    const url = `${this.guestUrl}/guests/${id}`;
    return this.http.get<any>(url);
  }

  get_reserve_for(id: any){
    const url = `${this.guestUrl}/guest/get_reserve_for/${id}`;
    return  lastValueFrom ( this.http.get<any>(url));
  }

  cancelReservation(id:number) {
	  if (confirm("Are you sure to calcel Reservation?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/cancel_reservation/${id}`;
		return  lastValueFrom(  this.http.put(url, httpOptions))
	  }
	  return of({});
  }
  


  

  getGuest_info(id: number){
    const url = `${this.guestUrl}/guest/guest_info/${id}`;
    return   lastValueFrom( this.http.get<any>(url));
  }
  
  
  /** POST: add a new guest to the server */
 
  getGuest(id: number): Observable<any> {
    const url = `${this.guestUrl}/guest/get_guest/${id}`;
    return this.http.get<any[]>(url);


   
  }




  addGuest(guest:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_guest', guest, httpOptions));
    }

    getTask():Observable<any[]>{
      return this.http.get<any[]>(this.guestUrl + '/room/get_task');
    }
     

  postroom_type(ad:any) {
    //console.log(guest);
      return this.http.post(this.guestUrl + '/room/add_room_type', ad, httpOptions);
    }

    addReservation(ad:any){
      return lastValueFrom(this.http.post(this.guestUrl + '/guest/add_reservation',ad,httpOptions));
  
          
    }
 
    postroom_room(ad:any) {
      //console.log(guest);
        return this.http.post(this.guestUrl + '/room/add_room', ad, httpOptions);
      }
      
  /** PUT: update the guest on the server */
  updateHouse(house: any) {
    return this.http.put(this.guestUrl + '/room/update_house', house, httpOptions)
  }
  updateReservation(house: any) {
    return  lastValueFrom (this.http.put(this.guestUrl + '/guest/update_reservation', house, httpOptions));
  }


  
  updateGuest(guest: any) {
    return lastValueFrom ( this.http.put(this.guestUrl + '/guest/update_guest', guest, httpOptions))
  }
  
  /** DELETE: delete the guest from the server */
  /** DELETE: delete the guest from the server */
  deleteGuest(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_guest/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  


  fetchBookings(id:number){
    const url = `${this.guestUrl}/room/get_booking_details/${id}`;
    return  lastValueFrom(this.http.get<any[]>(url));
 }
  

  checkout(id: any){
    const url = `${this.guestUrl}/guest/checkout/${id}`;
    return  lastValueFrom( this.http.put(url ,  httpOptions));
  }
}

