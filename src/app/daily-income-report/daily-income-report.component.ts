import { Component, OnInit } from '@angular/core';
import { FormGroup,FormBuilder, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { FormControlName } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import { ToastrService } from 'ngx-toastr';
import { RoomService } from 'app/services/rooms.service';
// import { guestService } from 'app/school.service';
import { userService } from 'app/user.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'daily-income-report',
  templateUrl: './daily-income-report.component.html',
  styleUrls: ['./daily-income-report.component.css']
})
export class DailyIncomeReportComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI
 

  base64_string:any;
  header:any;
  displayStyle ="none";
  fileName= 'payment.xlsx';
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
  staff:any;
  departmentList:any;
  pay_info:any;
  page = 1;
  pageSize: number = 200;
  feestypeList:any;
paymentList:any;
classList:any;
totaldeduction=0;
user:any;
school:any;
bySalary:any;
byAllowance:any;
byDeduction:any;
totalallowance=0;
incomeReport:any;
expenditureReport:any;
totalIncome=0;
totalExpenditure=0;
cashAtHand:any;
constructor(private fb:FormBuilder,private toastr:ToastrService,private guestService:GuestService,
  private userService:userService) { 
    this.createForm = this.fb.group({

      id:['',Validators.required],
    
      role:['',Validators.required],
      method:['',Validators.required],
     
      
      date:['',Validators.required],
      dates:['',Validators.required],
    
  })  
  }



  ngOnInit(): void {
    // this.getSchoolDetail();
    // this.getStaff();
    this.getUser();
  }
  

  async getUser(){
    try{
        var res = await this.userService.getUser()
        if (res) this.user=res;
  
    }catch(err){console.log(err)}
    finally{console.log("success");}
  
  
  
  }
  

  // async getAllowancebyRole(){
  //   let sum :number= 0;
  //   try{
      
  //     var res = await this.guestService.getAllowanceByRole();
  //     if(res) this.byAllowance=res; 
  
  //     for (let index = 0; index < this.byAllowance.length; index++) {
  //       sum += parseInt(this.byAllowance[index].amount);
  //      //  this.totalAmount=sum;
  //       this.totalallowance=sum;
       
  //   } }catch(error){}
     
  // finally{
  //   console.log("good")
  
  // }
    
  
  // }
  
  // async getStaff(){
  //   try{
      
  //     var res = await this.guestService.getStaffInfo();
  //     if(res) this.staff=res; 
  
  //   } catch(error){}
     
  // finally{
  //   console.log("good")
  
  // }
    
  
  // }
  
  async searchDates(){
  
      const d = {
        date: this.createForm.value.dates
      }
        try{
          this.loading.start();
          this.searchIncomeDates(d.date);
          this.searchExpenseDates(d.date);
          this.cashAtHand= this.totalIncome - this.totalExpenditure

          
        
    
        }
        catch(err){this.toastr.error(null,err.message)}
    
        finally{this.loading.stop();}
    }




  
    async searchIncomeDates(data){
      let sum :number= 0;
      const d = {
        date: data
      }
        try{
          this.loading.start();
         var res = await this.guestService.searchIncomeDates(d);
         if (res)this.incomeReport =res;
          
         for (let index = 0; index < this.incomeReport.length; index++) {
          sum += parseInt(this.incomeReport[index].amount);
         //  this.totalAmount=sum;
          this.totalIncome=sum;
         
      }
            
            
        
    
        }
        catch(err){this.toastr.error(null,err.message)}
    
        finally{this.loading.stop();}
    }


    async searchExpenseDates(data){
      let sum :number= 0;
      const d = {
        date: data
      }
        try{
          this.loading.start();
          var res = await this.guestService.searchExpenseDate(d);
          if (res) this.expenditureReport=res;
          
      for (let index = 0; index < this.expenditureReport.length; index++) {
        sum += parseInt(this.expenditureReport[index].amount);
       //  this.totalAmount=sum;
        this.totalExpenditure=sum;
       
    }
          
          
        
    
        }
        catch(err){this.toastr.error(null,err.message)}
    
        finally{this.loading.stop();}
    }
      
  


//   async getSchoolDetail(){
//     try{
//       var res = await this.guestService.getSchoolDetail()
//       if (res) this.school=res;

//   }catch(err){console.log(err)}
//   finally{console.log("success");}



// }



printToPdf() {
  const printArea = document.getElementById("pdf");
  const printWindow = window.open('', 'PRINT', 'height=800,width=600');

  if (!printArea || !printWindow) {
    console.error("Print area or print window not found.");
    return;
  }

  const styles = `
    <style>
      body, h1, h2, h3, p, table, th, td {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        font-size: 12px; /* Adjusted font size for readability */
      }
      .container {
        max-width: 100%;
        margin: 0;
        padding: 10px;
        background: #fff;
        border-radius: 4px;
        box-shadow: none;
      }
      .header {
        text-align: center;
        margin-bottom: 10px;
      }
      .header h2 {
        color: #333;
        font-size: 16px;
      }
      .header p {
        color: #666;
        font-size: 12px;
      }
      .report-details h3 {
        color: #333;
        font-size: 14px;
        border-bottom: 1px solid #ddd;
        margin-bottom: 5px;
        padding-bottom: 5px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      table, th, td {
        border: 1px solid #ddd;
      }
      th, td {
        padding: 8px;
        text-align: left;
        font-size: 12px;
      }
      th {
        background-color: #f4f4f4;
      }
      td {
        background-color: #fff;
      }
      tr:nth-child(even) td {
        background-color: #f9f9f9;
      }
      .footer {
        text-align: center;
        margin-top: 10px;
        color: #666;
        font-size: 12px;
      }
      @media print {
        @page {
          size: A4;
          margin: 10mm;
        }
        body {
          margin: 0;
        }
        .container {
          max-width: 100%;
          page-break-inside: avoid;
        }
      }
    </style>
  `;

  printWindow.document.write(`
    <html>
      <head>
        ${styles}
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

downloadPdf() {
  const printArea = document.getElementById("pdf");

  if (!printArea) {
    console.error("Print area not found.");
    return;
  }

  html2canvas(printArea, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait mode, millimeters, A4 size

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('daily_report.pdf');
  });
}



}
