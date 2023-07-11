import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { RoomService } from 'app/services/rooms.service';
import { EmployeeService } from 'app/services/employee.service'; 
import { FormGroup,FormBuilder, Validators,FormControl} from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'house-keeping',
  templateUrl: './house-keeping.component.html',
  styleUrls: ['./house-keeping.component.css']
})
export class HouseKeepingComponent implements OnInit {
  roomList:any;
  employeeList:any;
createForm:FormGroup;

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
    private route:ActivatedRoute) { }

  ngOnInit() {
    this.getRooms();
    this.getEmployee();
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

updateHouse(record){
  
}
}
