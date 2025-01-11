import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { FormControlName ,FormBuilder,FormGroup,Validators} from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from 'app/services/employee.service';

import * as html2pdf from 'html2pdf.js'
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {
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
pageSize: number = 200;
attendanceList:any;
constructor(
private router:Router,
    private fb:FormBuilder, private toastr:ToastrService, private employeeService:EmployeeService,private guestService:GuestService
   ) {

    this.createForm = this.fb.group({

      id:['',Validators.required],
    
      name:['',Validators.required],
      attendance:['',Validators.required],
      position:['',Validators.required],
      dates:['',Validators.required],

        
        
  
        
  
      })

   

}

ngOnInit(): void {
  this.getEmployee();
  this.getAttendance();
}




openPopup() {

this.header ="Add attendance";

this.displayStyle = "block";

}
closePopup() {
this.displayStyle = "none";
}




async getAttendance(){
  try{
    this.loading.start();
    var res = await this.employeeService.getAttendance();
    if(res) this.attendanceList=res; 
  
  } catch(error){
    this.toastr.error(null,error)
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

async addattendance(record){


const emp : any ={

  name:record.name,
  attendance:record.attendance,

  position:record.position,




}

// console.log(guest.confirm_password)
// guest.image_three= this.base64_string
try{
  this.loading.start();
 var res  = await this.employeeService.addAttendance(emp);
 if(res)this.toastr.success(null,"Attendance successfully added"); this.closePopup();this.getAttendance();


} catch(error){
  this.toastr.error(null,error);

}


    finally{
      this.loading.stop();
    }



}


async fetchEmployee(id:number){
  try{
    this.loading.start();
    var res = await this.employeeService.getEmployee(id);
    if (res) this.emmp_info =res;
    this.createForm.patchValue({
      position: this.emmp_info[0].position
    })
  } catch (error){
    this.toastr.error(null,error)
  }
  finally{
    this.loading.stop();
  }
}


async searchDates(){

  const d = {
    date: this.createForm.value.dates
  }
    try{
      this.loading.start();
      var res = await this.guestService.searchattendanceDate(d);
      if(res) {this.attendanceList =res;}
      
      
    

    }
    catch(err){this.toastr.error(null,err.message)}

    finally{this.loading.stop();}
}
  




// async Editemployee(id:any) {
  
// this.header ="Edit Employee";

// this.displayStyle = "block";
// try{
//   this.loading.start();
//   this.emmp_info =  await this.employeeService.getEmployee(id);

//   if ( this.emmp_info)  
//   this.createForm.patchValue({
//    id:this.emmp_info[0].id,
//     first_name:this.emmp_info[0].first_name,
//     last_name:this.emmp_info[0].last_name,
//     dob:this.emmp_info[0].dob,
//     email:this.emmp_info[0].email,
//     session:this.emmp_info[0].session,
//     position:this.emmp_info[0].position,
   
//     employment_date:this.emmp_info[0].employment_date,
//     phone :this.emmp_info[0].phone,
//     gender :this.emmp_info[0].gender,
//     // id_type :this.emmp_info[0].id_type,
//     // id_upload:this.emmp_info[0].id_upload,
//     // photo:this.emmp_info[0].photo,
//     id_number:this.emmp_info[0].id_number,
//     address:this.emmp_info[0].address,



   
//     remark:this.emmp_info[0].remark,

//     city :this.emmp_info[0].city,


  
    
//       //  image_one:this.emmp_info[0].image_one,image_two:this.emmp_info[0].image_two,image_three:this.emmp_info[0].image_three
//   })
// }
// catch (error:any) {
// this.toastr.error(null,error)
// } finally {
// this.loading.stop();

// }

// }





async updateAttendance(id:any){



const emp : any ={
  id:id,
 



}

// console.log(guest.confirm_password)
// guest.image_three= this.base64_string
try{
  this.loading.start();
 var res  = await this.employeeService.updateAttendance(emp);
 if(res) this.closePopup();this.getAttendance();


} catch(error){
  this.toastr.error(null,error);

}


    finally{
      this.loading.stop();
    }




}



myFunction() {

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
 
  }       
}
}


// async deletEemployee(id){
// try{

// this.loading.start();
// var res = await this.employeeService.deleteEmployee(id);
// if(res) this.getEmployee();

// }catch(error){
// this.toastr.error(null,error);
// }
// finally{
// this.loading.stop();
// }

// }

download(){
  var element = document.getElementById('table');
var opt = {
margin:       1,
filename:     'attendance.pdf',
image:        { type: 'jpeg', quality: 0.98 },
html2canvas:  { scale: 2 },
jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
};

// New Promise-based usage:
html2pdf().from(element).set(opt).save();
}


}
