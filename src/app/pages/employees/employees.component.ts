import { ActivatedRoute, Router } from '@angular/router';

import { FormControlName ,FormBuilder,FormGroup,Validators} from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { ToastrService } from 'ngx-toastr';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';import { Component, OnInit } from '@angular/core';
import { EmployeeService } from 'app/services/employee.service';

@Component({
  selector: 'employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.css']
})
export class EmployeesComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
  base64_string:any;
  header:any;
  displayStyle ="none";
  // @Input() ad: Adds ={brand:'',category:'',condition:'',price:'',description:'',
  //                     phone:'',negotiable:'',city:'',image:'',post_by_id:''};
  //  login:Login[]=[];
  createForm:FormGroup;  
  submitted = false;

  id?:string|null;
  title ='Create Ad';
  isNew = true;
  post = true;
  update = false;
  i_id !:number;
  public roomList:any;
  employeeList:any;
  emmp_info:any;
page = 1;
pageSize: number = 10;
constructor(
  private roomService:RoomService,private router:Router,
    private fb:FormBuilder,private route:ActivatedRoute,private guestService:GuestService,
    private toastr:ToastrService, private employeeService:EmployeeService
   ) {

      this.createForm = this.fb.group({

        id:['',Validators.required],
      
        first_name:['',Validators.required],
        last_name:['',Validators.required],
        email:['',Validators.required],
        session:['',Validators.required],
        position:['',Validators.required],
        dob:['',Validators.required],
        employment_date:['',Validators.required],
        phone :['',Validators.required],
        gender :['',Validators.required],
        id_type :['',Validators.required],
        id_upload:['',Validators.required],
        photo:['',Validators.required],
        address:['',Validators.required],





        id_number:['',Validators.required],
       
        remark:['',Validators.required],
   
        city :['',Validators.required],
   

        
        
  
        
  
      })

   

}
  ngOnInit(): void {
    this.getEmployee();
  }




openPopup() {

  this.header ="Add Employee";

  this.displayStyle = "block";

}
closePopup() {
  this.displayStyle = "none";
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

 async addemployee(record){


  const emp : any ={

    first_name:record.first_name,
    last_name:record.last_name,
    email:record.email,
    session:record.session,
    position:record.position,
    dob:record.dob,
    employment_date:record.employment_date,
    phone :record.phone,
    gender :record.gender,
    id_type :record.id_type,
    id_upload:record.id_upload,
    photo:record.photo,
    id_number:record.id_number,
    address:record.address,



   
    remark:record.remark,

    city :record.city,



  }
  emp.photo= this.base64_string
  emp.id_upload= this.base64_string
  // console.log(guest.password)
  // console.log(guest.confirm_password)
  // guest.image_three= this.base64_string
  try{
    this.loading.start();
   var res  = await this.employeeService.addEmployee(emp);
   if(res)this.toastr.success(null,"Guest successfully added"); this.closePopup();this.getEmployee();

  
  } catch(error){
    this.toastr.error(null,error);

  }


      finally{
        this.loading.stop();
      }



}





async Editemployee(id:any) {
    
  this.header ="Edit Employee";

  this.displayStyle = "block";
  try{
    this.loading.start();
    this.emmp_info =  await this.employeeService.getEmployee(id);
  
    if ( this.emmp_info)  
    this.createForm.patchValue({
     id:this.emmp_info[0].id,
      first_name:this.emmp_info[0].first_name,
      last_name:this.emmp_info[0].last_name,
      dob:this.emmp_info[0].dob,
      email:this.emmp_info[0].email,
      session:this.emmp_info[0].session,
      position:this.emmp_info[0].position,
     
      employment_date:this.emmp_info[0].employment_date,
      phone :this.emmp_info[0].phone,
      gender :this.emmp_info[0].gender,
      // id_type :this.emmp_info[0].id_type,
      // id_upload:this.emmp_info[0].id_upload,
      // photo:this.emmp_info[0].photo,
      id_number:this.emmp_info[0].id_number,
      address:this.emmp_info[0].address,
  
  
  
     
      remark:this.emmp_info[0].remark,
  
      city :this.emmp_info[0].city,
  
  
    
      
        //  image_one:this.emmp_info[0].image_one,image_two:this.emmp_info[0].image_two,image_three:this.emmp_info[0].image_three
    })
  }
catch (error:any) {
  this.toastr.error(null,error)
} finally {
  this.loading.stop();

}
  
}





async updateemployee(record){



  const emp : any ={
    id:record.id,
    first_name:record.first_name,
    last_name:record.last_name,
    email:record.email,
    session:record.session,
    position:record.position,
    dob:record.dob,
    employment_date:record.employment_date,
    phone :record.phone,
    gender :record.gender,
  
    address:record.address,



   
    remark:record.remark,

    city :record.city,



  }

  // console.log(guest.confirm_password)
  // guest.image_three= this.base64_string
  try{
    this.loading.start();
   var res  = await this.employeeService.updateEmployee(emp);
   if(res) this.closePopup();this.getEmployee();

  
  } catch(error){
    this.toastr.error(null,error);

  }


      finally{
        this.loading.stop();
      }




}

handleUpload(event:any) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
     this.base64_string = reader.result
  };

}


myFunction() {
  this.loading.start();
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
      this.loading.stop();
    }       
  }
}


async deletEemployee(id){
try{

this.loading.start();
  var res = await this.employeeService.deleteEmployee(id);
  if(res) this.getEmployee();

}catch(error){
  this.toastr.error(null,error);
}
finally{
  this.loading.stop();
}

}

}
