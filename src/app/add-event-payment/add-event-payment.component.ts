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
  selector: 'add-event-payment',
  templateUrl: './add-event-payment.component.html',
  styleUrls: ['./add-event-payment.component.css']
})
export class AddEventPaymentComponent implements OnInit {


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
incomeList:any
totalAmount:any;
user:any;
  constructor(private fb:FormBuilder,private toastr:ToastrService,private guestService:GuestService,
    private userService:userService) { 

      this.createForm = this.fb.group({

        id:['',Validators.required],
      
        name:['',Validators.required],
        amount:['',Validators.required],
      
       
        
        date:['',Validators.required],
      
        note:['',Validators.required],
       dates:['',Validators.required],
       

       customer_name:['',Validators.required],
      
       
        
       customer_phone:['',Validators.required],
     
       start_time:['',Validators.required],
      end_time:['',Validators.required],


      balance:['',Validators.required],
      method:['',Validators.required]
       
       
    })  
    }

   ngOnInit(): void {
    this.getUser();
    this.getIncomeList();
  }





  async  addIncome(record){

    const d ={
   
     name:record.name,
     amount:record.amount,
     note:record.note,
     
     date:record.date,

        
     customer_name:record.customer_name,
     customer_phone:record.customer_phone,
     balance:record.balance,
     
     start_time:record.start_time,
     end_time:record.end_time,
     method:record.method
    //  balance:record.balance,
     
    //  start_time:record.start_time,
    
     
   
   
     }
    
    
     // console.log(guest.password)
     // console.log(guest.confirm_password)
     // guest.image_three= this.base64_string
     try{
       this.loading.start();
      var res  = await this.guestService.addHallPayment(d);
      if(res)this.toastr.success(null,"record successfully added ");this.getIncomeList();
   
     
     } catch(error){
       this.toastr.error(null,error);
   
     }
   
   
         finally{
           this.loading.stop();
         }
   
   
    
   
   }
    
  
   
  
   async getIncomeList(){
    try{
      this.loading.start();
      var res = await this.guestService.getHallPayment();
      if(res) this.incomeList=res; 
      let sum :number= 0;
      for (let index = 0; index < this.incomeList.length; index++) {
        sum += parseInt(this.incomeList[index].amount);
        this.totalAmount=sum;
        console.log(sum);}
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
  
    
  
  
   
  async editIncome(id:any) {
      
    this.header ="Edit";
  
    this.displayStyle = "block";
    try{
      this.loading.start();
      this.expense_info =  await this.guestService.getHallPaymentOne(id);
    
      if ( this.expense_info)  
      this.createForm.patchValue({
       id:this.expense_info[0].id,
        name:this.expense_info[0].name,
       
        amount:this.expense_info[0].amount,
        note:this.expense_info[0].note,
    
        date:this.expense_info[0].date,

        customer_name:this.expense_info[0].customer_name,
       
        balance:this.expense_info[0].balance,
        customer_phone:this.expense_info[0].customer_phone,
    
        start_time:this.expense_info[0].start_time,
        end_time:this.expense_info[0].end_time,
        method:this.expense_info[0].method
       
      
        
          //  image_one:this.expense_info[0].image_one,image_two:this.expense_info[0].image_two,image_three:this.expense_info[0].image_three
      })
    }
  catch (error:any) {
    this.toastr.error(null,error)
  } finally {
    this.loading.stop();
  
  }
    
  }
  
  
  
  async updateIncome(record){
   
    const d ={

        id:record.id,
        name:record.name,
        amount:record.amount,
        note:record.note,
        method:record.method,
        
        date:record.date,

        customer_name:record.customer_name,
        customer_phone:record.customer_phone,
        balance:record.balance,
        
        start_time:record.start_time,
        end_time:record.end_time,
       
       
        
      
      
        }
    try{
      this.loading.start();
       var res= await this.guestService.updateHallPayment(d);
            // this.toastr.success(null,"successfully updated profile
    if(res)
    this.getIncomeList();
    }
    catch(error:any){
      this.toastr.error(null,error)
    }
   finally{
    this.loading.stop();
  
   }
  }
  
  async deleteIncome(id:number){
  
    try{
      this.loading.start();
       var res= await this.guestService.deleteIncome(id)
            // this.toastr.success(null,"successfully updated profile
            if(res)  this.getIncomeList();
  
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
         this.incomeList = await this.guestService.searchIncomeDates(d);
        
        
      
  
      }
      catch(err){this.toastr.error(null,err.message)}
  
      finally{this.loading.stop();}
  }
    

}
