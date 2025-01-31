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
export class EmployeeService {


  // private employeeUrl = 'https://renderdemo-hwz6.onrender.com';
  private employeeUrl = 'http://172.20.10.3:5000';
  

  constructor(private http: HttpClient,private router:Router) { }

  /** GET users from the server */
  getroomType(): Observable<any[]> {
    return this.http.get<any[]>(this.employeeUrl+ '/room/get_room_types');
  }


  getItems(): Observable<any[]> {
    return this.http.get<any[]>(this.employeeUrl+ '/employee/get_item');
  }

  getAttendance(){
    return lastValueFrom(this.http.get<any[]>(this.employeeUrl+ '/employee/get_attendance_list'));
  }

  getTodo(){
    return lastValueFrom(this.http.get<any[]>(this.employeeUrl+ '/employee/get_todo_list'));
  }
 

  
  getInfo(): Observable<any[]> {
    return this.http.get<any[]>(this.employeeUrl+ '/client/get_info');
  }

getUserInfo(): Observable<any[]> {
    return this.http.get<any[]>(this.employeeUrl+ '/client/get_user_info');
  }
getemployees(){
   return lastValueFrom( this.http.get<any[]>(this.employeeUrl+ '/employee/get_employees'));
}


getclients():Observable<any[]>{
  return this.http.get<any[]>(this.employeeUrl+ '/client/get_clients');
}


getroom_number():Observable<any[]>{
  return this.http.get<any[]>(this.employeeUrl+ '/room/get_room_numbers');
}

  
  /** GET user by id. Will 404 if id not found */
  getEmployee(id: number){
    const url = `${this.employeeUrl}/get_employee_details/${id}`;
    return  lastValueFrom (this.http.get<any>(url));
  }

  getTodoDetails(id: number){
    const url = `${this.employeeUrl}/employee/get_todo_detail/${id}`;
    return  lastValueFrom (this.http.get<any>(url));
  }
  
  /** POST: add a new user to the server */
 
  addEmployee(ad:any) {
    //console.log(user);
      return lastValueFrom( this.http.post(this.employeeUrl+ '/employee/add_employee', ad, httpOptions));
    }


    
  addItem(ad:any) {
    //console.log(user);
      return lastValueFrom( this.http.post(this.employeeUrl+ '/employee/add_item', ad, httpOptions));
    }


    AddTodo(ad:any) {
      //console.log(user);
        return lastValueFrom( this.http.post(this.employeeUrl+ '/employee/add_todo', ad, httpOptions));
      }
  
    
 
    postclient(ad:any) {
      //console.log(user);
        return this.http.post(this.employeeUrl+ '/client/add', ad, httpOptions);
      }
 
      addAttendance(ad:any) {
        //console.log(user);
          return lastValueFrom(this.http.post(this.employeeUrl+ '/employee/add_attendance', ad, httpOptions));
        }
  
  

      
  /** PUT: update the user on the server */
  updateEmployee(user: any) {
    return  lastValueFrom( this.http.put(this.employeeUrl+ '/employee/update_employee', user, httpOptions));
  }

  updateAttendance(employee: any) {
    return  lastValueFrom( this.http.put(this.employeeUrl+ '/employee/update_attendance', employee, httpOptions));
  }

  

  updateTodo(todo: any) {
    return  lastValueFrom( this.http.put(this.employeeUrl+ '/employee/update_todo', todo, httpOptions));
  }
  
  /** DELETE: delete the user from the server */
  deleteEmployee(user: any | number) {
	  if (confirm("Are you sure to delete?")) {
		const id = typeof user === 'number' ? user : user.id;
		const url = `${this.employeeUrl}/employee/delete_employee/${id}`;
		return lastValueFrom ( this.http.delete(url, httpOptions));
	  }
	  return of({});
  }


  deleteTodo(user: any | number) {
	  if (confirm("Are you sure to delete?")) {
		const id = typeof user === 'number' ? user : user.id;
		const url = `${this.employeeUrl}/employee/delete_todo/${id}`;
		return lastValueFrom ( this.http.delete(url, httpOptions));
	  }
	  return of({});
  }
  
  
}