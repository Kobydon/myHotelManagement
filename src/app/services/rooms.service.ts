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
export class RoomService {

  // private roomUrl = 'https://renderdemo-w1s0.onrender.com'  // URL to REST API
  private roomUrl = 'https://renderdemo-hwz6.onrender.com';

  constructor(private http: HttpClient,private router:Router) { }

  /** GET users from the server */
  getroomType(){
    return lastValueFrom( this.http.get<any[]>(this.roomUrl + '/room/get_room_type'));
  }


  getBookingList(){
    return lastValueFrom( this.http.get<any[]>(this.roomUrl + '/room/get_all_bookings'));
  }



  getBookingListNew(){
    return lastValueFrom( this.http.get<any[]>(this.roomUrl + '/room/get_new_bookings'));
  }
  
  updateRoom(ad: any) {
    return lastValueFrom( this.http.put(this.roomUrl + '/room/update_room_type', ad, httpOptions));
}




  
updateBooking(ad: any) {
  return lastValueFrom( this.http.put(this.roomUrl + '/room/update_booking', ad, httpOptions));
}



updateRooms(ad: any) {
  return lastValueFrom( this.http.put(this.roomUrl + '/room/update_room', ad, httpOptions));
}
getrooms(){
   return lastValueFrom( this.http.get<any[]>(this.roomUrl + '/room/get_all_rooms'));
}

getAvailable_rooms():Observable<any[]>{
  return this.http.get<any[]>(this.roomUrl + '/room/get_room_available');
}

getroom_number():Observable<any[]>{
  return this.http.get<any[]>(this.roomUrl + '/room/get_room_number');
}
/** GET user by id. Will 404 if id not found */
  getEmployee(id: number): Observable<any> {
    const url = `${this.roomUrl}/users/${id}`;
    return this.http.get<any>(url);
  }
  
  getroom_for(id): Observable<any> {
    const url = `${this.roomUrl}/room/get_room_for/${id}`;
    return this.http.get<any>(url);
  }
  /** POST: add a new user to the server */
 
  postTask(ad:any) {
    //console.log(user);
      return this.http.post(this.roomUrl + '/room/add_task', ad, httpOptions);
    }

    getTask():Observable<any[]>{
      return this.http.get<any[]>(this.roomUrl + '/room/get_task');
    }
     
    get_room_details(id){
       const url = `${this.roomUrl}/room/get_room_details/${id}`;
       return  lastValueFrom(this.http.get<any[]>(url));
    }

    fetchRoomsByType(type){
      const url = `${this.roomUrl}/room/get_by_type/${type}`;
      return  lastValueFrom(this.http.get<any[]>(url));
   }


    get_rooms_details(id){
      const url = `${this.roomUrl}/room/get_rooms_details/${id}`;
      return  lastValueFrom(this.http.get<any[]>(url));
   }


    
  postroom_type(ad:any) {
    //console.log(user);
      return  lastValueFrom(this.http.post(this.roomUrl + '/room/add_room_type', ad, httpOptions));
    }


        
  addBooking(ad:any) {
    //console.log(user);
      return  lastValueFrom(this.http.post(this.roomUrl + '/guest/add_booking', ad, httpOptions));
    }
    

    searchYesterdayRoomDates(ad:any){
      return lastValueFrom(this.http.post(this.roomUrl + '/room/search_yesterday_date', ad, httpOptions)) ;
    }

    searchRoomDates(ad:any){
      return lastValueFrom(this.http.post(this.roomUrl + '/room/search_room_date', ad, httpOptions)) ;
    }

    searchHouse(ad:any) {
      //console.log(user);
        return lastValueFrom(this.http.post(this.roomUrl + '/room/search_house', ad, httpOptions)) ;
      }
 
    post_room(ad:any) {
      //console.log(user);
        return lastValueFrom(this.http.post(this.roomUrl + '/room/add_room', ad, httpOptions)) ;
      }
  /** PUT: update the user on the server */
  updateHouse(house: any) {
    return lastValueFrom( this.http.put(this.roomUrl + '/room/update_house', house, httpOptions));
  }
  
  /** DELETE: delete the user from the server */
  /** DELETE: delete the user from the server */
  deleteRoom(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.roomUrl}/room/delete_room/${id}`;
		return lastValueFrom( this.http.delete(url, httpOptions));
	  }
	  return of({});
  }


  deleteBooking(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.roomUrl}/room/delete_booking/${id}`;
		return lastValueFrom( this.http.delete(url, httpOptions));
	  }
	  return of({});
  }

  

  deleteRoomType(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.roomUrl}/room/delete_room_type/${id}`;
		return  lastValueFrom(this.http.delete(url, httpOptions))
	  }
	  return of({});
  }


  get_booking_details(id){
    const url = `${this.roomUrl}/room/get_booking_details/${id}`;
    return  lastValueFrom(this.http.get<any[]>(url));
 }

  
}