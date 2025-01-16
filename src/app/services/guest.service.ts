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
  private guestUrl = ' http://127.0.0.1:5000';
 

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
    return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_expense', dep, httpOptions));
  }  



 

  addDepartment(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_department', dep, httpOptions));
    } 


    addStockTransfer(dep:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_stock_transfer', dep, httpOptions));
      } 
  

      

    addVendor(dep:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_vendor', dep, httpOptions));
      } 
  
 

  addItem(dep:any) {
    //console.log(guest);
      return  lastValueFrom (  this.http.post(this.guestUrl + '/guest/add_item', dep, httpOptions));
    } 




    deleteItem(id:number) {
      if (confirm("do you want to delete?")) {
      // const id = typeof ad === 'number' ? ad : ad.id;
      const url = `${this.guestUrl}/guest/delete_item/${id}`;
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


    getVendorList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_vendor_list'));
      }
  

    getStockTransferList() {
      //console.log(guest);
        return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_stock_transfer'));
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
        
            updateVendor(dep:any) {
              //console.log(guest);
                return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_vendor', dep, httpOptions));
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


  
    updateGop(sch:any) {
      //console.log(guest);
        return  lastValueFrom (  this.http.put(this.guestUrl + '/guest/update_gop', sch, httpOptions));
      }

    

    
       
    searchIncomeBudgetDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_income_budget_dates', d, httpOptions));
    }

        
    searchGopDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_gop_dates', d, httpOptions));
    }

    searchReturnDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_return_date', d, httpOptions));
    }

    
          
    searchExpenseDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates', d, httpOptions));
    }

    searchStockDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_stock_dates', d, httpOptions));
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

    // searchExpenseDate(d){
    //   return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_dates', d, httpOptions));
    // }

    searchExpenseBudgetDate(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_expense_budget_dates', d, httpOptions));
    }


    searchIncomeDates(d){
      return  lastValueFrom(  this.http.post(this.guestUrl + '/guest/search_income_dates', d, httpOptions));
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
  
        
      getItemList() {
        //console.log(guest);get
          return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_received'));
        }


        getReturnRequest() {
          //console.log(guest);get
            return  lastValueFrom (  this.http.get<any[]>(this.guestUrl + '/guest/get_return_request'));
          }
  
}



