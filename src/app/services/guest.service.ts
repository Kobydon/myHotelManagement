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
  private guestUrl = 'http://127.0.0.1:5000'

  // 

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



getCustomers(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_customers')) ;
}

CustomReservation(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_reserve')) ;
}


allReservation(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_all_reserve')) ;
}

getExpiry(){
  return  lastValueFrom(this.http.get<any[]>(this.guestUrl + '/guest/get_expiry')) ;
}




getmaleGuests(): Observable<any[]>{

    return  this.http.get<any[]>(this.guestUrl + '/guest/get_male_guest')

}
addExpense(dep:any) {
  //console.log(guest);
    return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_expense', dep, httpOptions));
  }  

  addCustomer(dep:any) {
  //console.log(guest);
    return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_customer', dep, httpOptions));
  }  
  

  addChef(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_chef', dep, httpOptions));
    }  
  


    getChefList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_chef_list'));
      }
  
       async getStockItems(): Promise<any[]> {
    return await lastValueFrom(this.http.get<any[]>(`${this.guestUrl}/guest/get_stock_items`));
  }

  
  startSession(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_session', dep, httpOptions));
    }  
  

 

  addDepartment(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_department', dep, httpOptions));
    } 


    addStockTransfer(dep:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_stock_transfer', dep, httpOptions));
      } 
  

      addStockTransferOutside(dep:any) {
        //console.log(guest);
          return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_stock_transfer_outside', dep, httpOptions));
        } 
      
      

    addVendor(dep:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_vendor', dep, httpOptions));
      } 
  
 

  addItem(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_item', dep, httpOptions));
    } 


    getFood(id: any) {
      const url = `${this.guestUrl}/guest/get_food/${id}`;
      return lastValueFrom(this.http.get<any>(url).pipe(
        catchError((error) => {
          console.error('Error fetching event:', error);
          throw new Error('Failed to fetch event data');
        })
      ));
    }


    
    getFoodVip(id: any) {
      const url = `${this.guestUrl}/guest/get_food_vip/${id}`;
      return lastValueFrom(this.http.get<any>(url).pipe(
        catchError((error) => {
          console.error('Error fetching event:', error);
          throw new Error('Failed to fetch event data');
        })
      ));
    }
    

    deleteItem(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_item/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }

    deleteChef(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_chef/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }



    


    deleteDepartment(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_department/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }


    
    deleteStockTransfer(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_stock_transfer/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }

    
    deleteStock(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_stock/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }


    deleteUnit(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_unit/${id}`;
      return  lastValueFrom(  this.http.delete(url, httpOptions))
      }
      return of({});
    }



  deleteExpense(id:number) {
    if (confirm("do you want to delete?")) {
    // const id = typeof ad === 'number' ? ad : ad.id;
    const url = `${this.guestUrl}/guest/delete_expense/${id}`;
    return  lastValueFrom(  this.http.delete(url, httpOptions))
    }
    return of({});
  }
   
  getExpenseList() {
    //console.log(guest);
      return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_expense_list'));
    }

    getCurrentSession(){
      return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_current_session'));

    }

    getVendorList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_vendor_list'));
      }
  

    getStockTransferList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_stock_transfer'));
      }

      getStockTransferListOutside() {
        //console.log(guest);
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_stock_transfer_outside'));
        }

      

    getCategoryList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_category_list'));
      }

      getUnitList() {
        //console.log(guest);
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_unit_list'));
        }

        getStockList() {
          //console.log(guest);
            return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_stock_list'));
          }
        getFamilyList() {
          //console.log(guest);
            return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_family_list'));
          }


        
        
  
          getgopList() {
            //console.log(guest);
              return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_gop_list'));
            }
      

          getGroupList() {
            //console.log(guest);
              return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_group_list'));
            }

            getSessionList() {
              //console.log(guest);
                return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_all_session'));
              }
        
            updateVendor(dep:any) {
              //console.log(guest);
                return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_vendor', dep, httpOptions));
              }   

               
              confirmOrder(dep:any) {
              //console.log(guest);
                return  lastValueFrom ( this.http.put(this.guestUrl + '/guest/confirm_order', dep, httpOptions ));
              }   

                    
              confirmOrderTwo(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/confirm_oder_two', dep, httpOptions));
                }   

           



              closeSession(dep:any) {
                //console.log(guest);
                if (confirm("Are you sure to close session?")) {
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/close_session', dep, httpOptions));}
                 
                } 


              updateRecievedItem(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_received_item', dep, httpOptions));
                }  

            updateUnit(dep:any) {
              //console.log(guest);
                return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_unit', dep, httpOptions));
              }   

              updatePurchase(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_purchase', dep, httpOptions));
                }   
                approvePurchase(dep:any) {
                  //console.log(guest);
                    return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/approve_purchase', dep, httpOptions));
                  } 

                  approveReturnRequest(dep:any) {
                    //console.log(guest);
                      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/approve_return_request', dep, httpOptions));
                    } 

                  

              updateDepartment(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_department', dep, httpOptions));
                }   

                updateStockTransfer(dep:any) {
                  //console.log(guest);
                    return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_stock_transfer', dep, httpOptions));
                  }   

                  updateStockOutside(dep:any) {
                    //console.log(guest);
                      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_stock_transfer_outside', dep, httpOptions));
                    }   
  

              updateStock(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_stock', dep, httpOptions));
                }   
  

                updateStore(dep:any) {
                  //console.log(guest);
                    return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_store', dep, httpOptions));
                  }   
    

              updateGroup(dep:any) {
                //console.log(guest);
                  return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_group', dep, httpOptions));
                }   
  
  

              
            updateFamily(dep:any) {
              //console.log(guest);
                return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_family', dep, httpOptions));
              }   
              
    
  updateExpense(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_expense', dep, httpOptions));
    }   
    
      
    
  updateCategory(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_category', dep, httpOptions));
    }   
    

    updateItem(dep:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_item', dep, httpOptions));
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

    addGop(gop:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_gop', gop, httpOptions));
      }
  

    addPurchase(guest:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_purchase', guest, httpOptions));
      }

    addGroup(guest:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_itm', guest, httpOptions));
      }
submitMultiplePurchases(cartItems: any[]) {
  return lastValueFrom(
    this.http.post(this.guestUrl + '/guest/add_purchase_bulk', cartItems, httpOptions)
  );
}


    addFamily(guest:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_family', guest, httpOptions));
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
  


  deleteGop(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_gop/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  

  deleteReceivedItem(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_received_item/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  
  
  deleteVendor(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_vendor/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }


  deletePurchase(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_purchase/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  

  deleteStore(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_store/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  


  deleteFamily(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_family/${id}`;
		return  lastValueFrom(  this.http.delete(url, httpOptions))
	  }
	  return of({});
  }
  


  deleteCategory(id:number) {
	  if (confirm("Are you sure to delete?")) {
		// const id = typeof ad === 'number' ? ad : ad.id;
		const url = `${this.guestUrl}/guest/delete_category/${id}`;
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


  deleteIncome(id:number) {
    if (confirm("do you want to delete?")) {
    // const id = typeof ad === 'number' ? ad : ad.id;
    const url = `${this.guestUrl}/guest/delete_income/${id}`;
    return  lastValueFrom(  this.http.delete(url, httpOptions))
    }
    return of({});
  }




  deleteBudget(id:number) {
    if (confirm("do you want to delete?")) {
    // const id = typeof ad === 'number' ? ad : ad.id;
    const url = `${this.guestUrl}/guest/delete_budget/${id}`;
    return  lastValueFrom(  this.http.delete(url, httpOptions))
    }
    return of({});
  }

  updateIncome(sch:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_income', sch, httpOptions));
    }

    updateHallPayment(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_hall_payment', sch, httpOptions));
      }

  
    updateGop(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_gop', sch, httpOptions));
      }

    

    
       
    searchIncomeBudgetDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_income_budget_dates', d, httpOptions));
    }


    searchChefDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/get_chef_dates', d, httpOptions));


    }
        
    searchGopDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_gop_dates', d, httpOptions));
    }

    searchReturnDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_return_date', d, httpOptions));
    }

    
    searchEventDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_event_date', d, httpOptions));
    }


    
    
          
    searchExpenseDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates', d, httpOptions));
    }

    searchStockDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_stock_dates', d, httpOptions));
    }
    
    searchStockUsuageDate(d){

      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_stock_usuage', d, httpOptions));
    }
    

    searchReceivedDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_received_dates', d, httpOptions));
    }

    searchattendanceDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_attendance_date', d, httpOptions));
    }

    searchPurchaseDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_purchase_date', d, httpOptions));
    }


    searchMostOrderedDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_item', d, httpOptions));
    }

    searchMostOrderedDateFood(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_item_food', d, httpOptions));
    }


    

    searchMostOrderedDateDrink(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_item_drink', d, httpOptions));
    }



    searchMostOrderedDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_item_two', d, httpOptions));
    }

    

    
    searchMostAttendantDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_attendant', d, httpOptions));
    }

        
    searchMostAttendantDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_most_attendant_two', d, httpOptions));
    }

    searchStockUsuageDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_stock_usage_two', d, httpOptions));
    }


   

    searchReturnDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_return_date_two', d, httpOptions));
    }

    searchStockDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_stock_date_two', d, httpOptions));
    }

    
    searchReceivedDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_recieve_date_two', d, httpOptions));
    }



    
    

    
    

    getHeldReportOrders(date: any) {
      return this.http.post<any[]>(this.guestUrl +'/guest/search_held_order_dates', { date });
    }


    
    getHeldReportOrdersTwo(d: any) {
      return this.http.post<any[]>(this.guestUrl +'/guest/search_held_order_dates_two',  d,httpOptions);
    }


    // searchReturnDateTwo(d){
    //   return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_return_date_two', d, httpOptions));
    // }
    
        

    getHeldReportOrdersFood(date: string) {
      return this.http.post<any[]>(this.guestUrl +'/guest/search_held_order_dates_food', { date });
    }

    getHeldReportOrdersDrink(date: string) {
      return this.http.post<any[]>(this.guestUrl +'/guest/search_held_order_dates_drink', { date });
    }

    
 
    searchPurchaseDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_purchase_date_two', d, httpOptions));
    }

    searchOrderDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_order_date', d, httpOptions));
    }
    
    searchBudgetDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_budget_dates', d, httpOptions));
    }

    
        
    searchIncomeDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_income_dates_two', d, httpOptions));
    }


 searchCanceledDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_canceled_dates_two', d, httpOptions));
    }
    searchChefDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_chef_dates_two', d, httpOptions));
    }

    searchEventDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_event_dates_two', d, httpOptions));
    }

    
    searchOrderDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_order_dates_two', d, httpOptions));
    }

    searchattendanceDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_attendance_dates_two', d, httpOptions));
    }
   
   
    
    
    

    

    // searchExpenseDate(d){
    //   return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates', d, httpOptions));
    // }

    searchExpenseBudgetDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_budget_dates', d, httpOptions));
    }


    searchIncomeDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_income_dates', d, httpOptions));
    }

    

    searchWaiterDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_waiter_dates', d, httpOptions));
    }


    searchMethodDates(d){

      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_method_dates', d, httpOptions));

    }

    searchDepartmentDates(d){

      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_department_dates', d, httpOptions));

    }

    
    
    searchCashierDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_cashier_dates', d, httpOptions));
    }

    

    searchWaiterDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_waiter_dates_two', d, httpOptions));
    }
      searchattendantDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_attendant_dates_two', d, httpOptions));
    }

    removeFromCart(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/remove_held_order', d, httpOptions));
    }




    searchMethodDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_method_dates_two', d, httpOptions));
    }

    
    searchDepartmentDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_department_dates_two', d, httpOptions));
    }

        searchCategoryDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_category_dates_two', d, httpOptions));
    }




    
    searchCashierDatesTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_cashier_dates_two', d, httpOptions));
    }


    
    


    

    searchExpenseDateTwo(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates_two', d, httpOptions));
    }
    
    addBudgetList(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_budget', sch, httpOptions));
      }     


       
      addReturnRequest(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_return_request', sch, httpOptions));
      }     


      

      addRecievedItem(sch:any) {
        //console.log(guest);
          return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_received_item', sch, httpOptions));
        }     
        
      
      

      addUnit(sch:any) {
        //console.log(guest);
          return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_unit', sch, httpOptions));
        }  

      
   
      addCategory(sch:any) {
        //console.log(guest);
          return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_category', sch, httpOptions));
        }  

  updateBudget(sch:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_budget', sch, httpOptions));
    }
   
  getIncome(id: number){
    const url = `${this.guestUrl}/guest/get_income/${id}`;
    return   lastValueFrom( this.http.get<any>(url));
  }

  getHallPaymentOne(id: number){
    const url = `${this.guestUrl}/guest/get_hall_payment_one/${id}`;
    return   lastValueFrom( this.http.get<any>(url));
  }



  
  getGop(id: number){
    const url = `${this.guestUrl}/guest/get_gop/${id}`;
    return   lastValueFrom( this.http.get<any>(url));
  }
  
    
  getBudget(id: number){
    const url = `${this.guestUrl}/guest/get_budget/${id}`;
    return   lastValueFrom( this.http.get<any>(url));
  }

  addIncomeList(sch:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_income', sch, httpOptions));
    }


    addHallPayment(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_hall_payment', sch, httpOptions));
      }
  

       
    addStock(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_stock', sch, httpOptions));
      }
  


           
    addStore(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_store', sch, httpOptions));
      }

  getIncomeList() {
    //console.log(guest);get
      return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_income_list'));
    }

    getHallPayment() {
      //console.log(guest);get
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_hall_payment'));
      }



    getStoreList() {
      //console.log(guest);get
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_store_list'));
      }
      getPurchaseList() {
        //console.log(guest);get
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_purchase_list'));
        }

        getOrderList() {
          //console.log(guest);get
            return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_order_list'));
          }
  

      getDepartmentList() {
        //console.log(guest);get
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_department_list'));
        }


    getBudgetList() {
      //console.log(guest);get
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_budget_list'));
      }



      getItemsList() {
        //console.log(guest);get
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_item_list'));
        }
  

        getOrdersList(){
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_orders'));
      
        }


        getHeldOrders(){
          return lastValueFrom(this.http.get<any>(`${this.guestUrl}/guest/get_helding_orders`));
        }

        
        getHeldOrdersDrinks(){
          return lastValueFrom(this.http.get<any>(`${this.guestUrl}/guest/get_helding_orders_drinks`));
        }
        
        

        
        
      getItemList() {
        //console.log(guest);get
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_received'));
        }


        getReturnRequest() {
          //console.log(guest);get
            return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_return_request'));
          }
  

    getPurchaseRequestsByCartId(cartId: number) {
    return this.http.get<any[]>(`http://192.168.10.20:5000/guest/get_purchase_by_cart/${cartId}`);
}
}



