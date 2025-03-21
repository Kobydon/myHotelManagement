import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from 'app/services/rooms.service';
import { EmployeeService } from 'app/services/employee.service'; 
import { FormGroup,FormBuilder, Validators,FormControl} from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import { CartService } from 'app/cart.service';
@Component({
  selector: 'house-keeping',
  templateUrl: './house-keeping.component.html',
  styleUrls: ['./house-keeping.component.css']
})
export class HouseKeepingComponent implements OnInit {
  roomList:any;
  employeeList:any;
createForm:FormGroup;
searchForm:FormGroup

submitted=false;
taskList:any;
find= false
checked:any;

public to_list: any=[];
public product:any=[];
checking: boolean = false;
public value :any
public some:any
@BlockUI('loading') loading!: NgBlockUI

public totalItem : number = 0;
  constructor(private roomService:RoomService,private router:Router,
    private employeeService:EmployeeService,private fb:FormBuilder,private toastr:ToastrService,
    private route:ActivatedRoute,private cartService:CartService) { }

  ngOnInit() {
    this.getRooms();
    this.getEmployee();
    this.cartService.cartItems$.subscribe((items) => {
      // this.pr = items;
      // this.totalItem = this.cartService.getTotal();
    });
    // this.getTask();
    
    this.createForm= this.fb.group({
      task_name:['',Validators.required]
    });
    this.createForm = this.fb.group({
      status_r:['',Validators.required],
      room_number:['',Validators.required],
      room_type: ['',Validators.required],


      occupancy_state:['',Validators.required],

      maintanace_state:['',Validators.required],
      assignee:['',Validators.required],
      task_get:['',Validators.required],
      
      

    });

 
    this.searchForm = this.fb.group({
      status:['',Validators.required],
      room_number:['',Validators.required],
      room_type: ['',Validators.required],


      occupancy_state:['',Validators.required]

      

    });

  }


  async getRooms(){
    try{
      this.loading.start();
     var res = await this.roomService.getrooms()
     if(res) this.roomList =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }
}


async getEmployee(){
  try{
    this.loading.start();
    var res = await this.employeeService.getemployees();
    if(res) this.employeeList=res; 

  } catch(error){
    this.toastr.error(null,error)
  }
finally{
  this.loading.stop();
}
  
}

addTask(record){

}

async searchHouse(record){
  const lst ={
           room_number:record.room_number,
           room_type:record.room_type,
           status:record.status,
           occupancy_state: record.occupancy_state
  }
  try{
    this.loading.start();
    var res = await this.roomService.searchHouse(lst);
    if(res)  this.roomList =res;

  }catch(error)
  {
    this.toastr.error(null,error.message)
  }
  finally{
    this.loading.stop();
  }

}

async updateHouse(record:any){
   
   
  this.submitted = true;
   // const id = this.route.snapshot k.paramMap.get('id')
  let sum = "";
   for(let i:number =0;i<this.product.length; i++){
     
     this.to_list= this.product[i];
     this.product[i].status_r = record.status_r
     this.product[i].assignee = record.assignee
     this.product[i].task =record.task_get
     this.product[i].occupancy_state= record.occupancy_state
     this.product[i].maintanace_state= record.maintanace_state
    // sum+= this.product[i].status
     // console.log(this.product[i].status);
     try{ 
      this.loading.start();
  
      var res= await this.roomService.updateHouse(this.product);
      
      // if(res)  this.cartService.();
    
  }catch(error){this.toastr.error(null,error.mesage)}
  
  finally{this.loading.stop();} 

   }


  

 
}
switchClicked(event,item){
  let confirm :any = event.srcElement.checked

 this.checked = confirm
   
 //  this.value=   this.cartService.addtoCart(item);
 //  let checkData = localStorage.getItem("checkData");
   if(this.checked!=null && this.checked ==true){
    //  this.cartService.addtoCart(item);
     console.log(item);
   }

else{
//  this.cartService.removeCartItem(item)
// this.cartService.gCetProducts();

   


}

    
   // }

   //   else {
   //     console.log(event);
   //   }
   
 }


//  addtocart(item){
 
 
//    this.cartService.addtoCart(item);

//  }
}
