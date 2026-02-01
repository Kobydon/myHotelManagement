import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, lastValueFrom, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

// import { User } from '../user';


const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class PaymentService {

  // private paymentUrl = 'https://renderdemo-w1s0.onrender.com' // URL to REST API
  // private paymentUrl = 'https://renderdemo-hwz6.onrender.com'pcar;
  private paymentUrl = 'http://192.168.10.20:5000'
  constructor(private http: HttpClient,private router:Router) { }

  /** GET users from the server */
  getroomType(): Observable<any[]> {
    return this.http.get<any[]>(this.paymentUrl + '/room/get_room_type');
  }

getrooms():Observable<any[]>{
   return this.http.get<any[]>(this.paymentUrl + '/room/get_room');
}

getAvailable_rooms():Observable<any[]>{
  return this.http.get<any[]>(this.paymentUrl + '/room/get_room_available');
}

getroom_number():Observable<any[]>{
  return this.http.get<any[]>(this.paymentUrl + '/room/get_room_number');
}

getRefund(){
  return lastValueFrom( this.http.get<any[]>(this.paymentUrl + '/guest/get_refund'));
}
getWifiCode(d){
  return lastValueFrom( this.http.post(this.paymentUrl + '/guest/get_wifi_code',d,httpOptions));
}

/** GET user by id. Will 404 if id not found */
  getEmployee(id: number): Observable<any> {
    const url = `${this.paymentUrl}/users/${id}`;
    return this.http.get<any>(url);
  }

  getPaymentFilter(ad: any){
    const url = `${this.paymentUrl}/guest/filter_payment_day/${ad}`;
    return  lastValueFrom( this.http.get<any>(url));
  }


  
  
  getroom_for(id): Observable<any> {
    const url = `${this.paymentUrl}/room/get_room_for/${id}`;
    return this.http.get<any>(url);
  }
  /** POST: add a new user to the server */
 
  addPayment(amount:any) {
      return  lastValueFrom( this.http.post(this.paymentUrl + '/guest/add_payment', amount, httpOptions));
    }

    getPayment(){
      return lastValueFrom(this.http.get<any[]>(this.paymentUrl + '/guest/get_payment'));
    }


    getPaymentPos(){
      return lastValueFrom(this.http.get<any[]>(this.paymentUrl + '/guest/get_payment_pos'));
    }
  
    get_payment_for(id: number): Promise<any> {
      const url = `${this.paymentUrl}/guest/get_payment_for/${id}`;
      return lastValueFrom(this.http.get<any>(url)); // Ensure `lastValueFrom` is imported
    }
    
    updateRefund(ad)  {
       return lastValueFrom(this.http.put(this.paymentUrl +'/guest/update_refund',ad,httpOptions));
     
    }
    

    searchDates(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/searchdates', d, httpOptions));
    }

    searchDatesPosTwo(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/search_pos_dates_two', d, httpOptions));
    }

    


    searchDatesPos(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/searchdates_pos', d, httpOptions));
    }



    searchDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/searchdates_two', d, httpOptions));
    }

    searchPaymentDates(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/search_payment_date', d, httpOptions));
    }

    
    searchPaymentHeldDates(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/ qZw2wa', d, httpOptions));
    }



    
    searchPaymentDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/search_payment_date_two', d, httpOptions));
    }
    
    
    searchRefundDates(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/search_refund_dates', d, httpOptions));
    }

    
    searchRefundDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.paymentUrl + '/guest/search_refund_dates_two', d, httpOptions));
    }


  postroom_type(ad:any) {
    //console.log(user);
      return this.http.post(this.paymentUrl + '/room/add_room_type', ad, httpOptions);
    }

    
  addRefund(ad:any) {
    //console.log(user);
      return lastValueFrom(this.http.post(this.paymentUrl + '/guest/add_refund', ad, httpOptions));
    }


 
    postroom_room(ad:any) {
      //console.log(user);
        return this.http.post(this.paymentUrl + '/room/add_room', ad, httpOptions);
      }
  /** PUT: update the user on the server */
  updateHouse(house: any) {
    return this.http.put(this.paymentUrl + '/room/update_house', house, httpOptions)
  }
  
  /** DELETE: delete the user from the server */
  /** DELETE: delete the user from the server */
  deletePayment(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.paymentUrl}/guest/delete_payment/${id}`;
		return lastValueFrom( this.http.delete(url, httpOptions));
	  }
	  return of({});
  }

  updatePayment(ad: any) {
    return lastValueFrom( this.http.put(this.paymentUrl + '/guest/update_payment', ad, httpOptions));
}


updatePaymentCheckout(ad: any) {
  return lastValueFrom( this.http.put(this.paymentUrl + '/guest/update_payment_checkout', ad, httpOptions));
}




}