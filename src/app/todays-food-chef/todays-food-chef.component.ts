import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { FormControlName,FormGroup,FormBuilder, Validators} from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { ToastrService } from 'ngx-toastr';
import { RoomService } from 'app/services/rooms.service';
// import { guestService } from 'app/school.service';
import { userService } from 'app/user.service';
import { GuestService } from 'app/services/guest.service';
@Component({
  selector: 'todays-food-chef',
  templateUrl: './todays-food-chef.component.html',
  styleUrls: ['./todays-food-chef.component.css']
})
export class TodaysFoodChefComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI
  base64_string:any;
  header:any;
  displayStyle ="none";
  fileName= 'income.xlsx';
  // @Input() ad: Adds ={brand:'',category:'',condition:'',price:'',description:'',
  //                     phone:'',negotiable:'',city:'',image:'',post_by_id:''};
  //  login:Login[]=[];
  createForm!:FormGroup;  
  submitted = false;

  id?:string|null;
  title ='Create Ad';
  isNew = true;
  post = true;
  update = false;
  i_id !:number;

  departmentList:any;
  expense_info:any;
  page = 1;
  pageSize: number = 200;
  feestypeList:any;
expenseList:any;
chefList:any
totalAmount:any;
user:any;
  constructor(private fb:FormBuilder,private toastr:ToastrService,private guestService:GuestService,
    private userService:userService) {


      this.createForm = this.fb.group({

        id:['',Validators.required],
      
        name:['',Validators.required],
        food:['',Validators.required],
    
        note:['',Validators.required],

       
    })  
     }

  ngOnInit(): void {
    this.getUser();
    this.getchefList();
  }











  
    async  addChef(record){
  
      const d ={
     
       name:record.name,
      food:record.food
      
      
       
     
     
       }
      
      
       // console.log(guest.password)
       // console.log(guest.confirm_password)
       // guest.image_three= this.base64_string
       try{
         this.loading.start();
        var res  = await this.guestService.addChef(d);
        if(res)this.toastr.success(null,"record successfully added ");this.getchefList();
     
       
       } catch(error){
         this.toastr.error(null,error);
     
       }
     
     
           finally{
             this.loading.stop();
           }
     
     
      
     
     }
      
    
     
    
     async getchefList(){
      try{
        this.loading.start();
        var res = await this.guestService.getChefList();
        if(res) this.chefList=res; 
        
      } catch(error){
        this.toastr.error(null,error)
      }
    finally{
      this.loading.stop();
    }
      
    }
    
    
    
    
    
    
    exportexcel()
    {
      /* pass here the table id */
      let element = document.getElementById('excel-table');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    
      /* generate workbook and add the worksheet */
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
      /* save to file */  
      XLSX.writeFile(wb, this.fileName);
    
    }
      
    
     
    
    openPopup() {
       
      this.header ="Add New";
    
      this.displayStyle = "block";
    
    }
    closePopup() {
      this.displayStyle = "none";
    
    }
    
      
    
    
     
    
    
    async deleteChef(id:number){
    
      try{
        this.loading.start();
         var res= await this.guestService.deleteChef(id)
              // this.toastr.success(null,"successfully updated profile
              if(res)  this.getchefList();
    
      }
      catch(error:any){
        this.toastr.error(null,error)
      }
     finally{
      this.loading.stop();
    
     }
    
        
           
    }
    
    myFunction() {
    
      var input, filter, table, tr, td, i, txtValue;
      input = document.getElementById("myInput");
      filter = input.value.toUpperCase();
      table = document.getElementById("excel-table");
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
    
    
    
    async getUser(){
      try{
          var res = await this.userService.getUser()
          if (res) this.user=res;
    
      }catch(err){console.log(err)}
      finally{console.log("success");}
    
    
    
    }
    
    
    
    
        
    
    async searchDates(){
    
      const d = {
        date: this.createForm.value.dates
      }
        try{
          this.loading.start();
           this.chefList = await this.guestService.searchChefDates(d);
          
          
        
    
        }
        catch(err){this.toastr.error(null,err.message)}
    
        finally{this.loading.stop();}
    }
      
  
}
