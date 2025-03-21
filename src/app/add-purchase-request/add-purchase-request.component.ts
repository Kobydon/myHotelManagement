import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from 'app/cart.service';
import { EmployeeService } from 'app/services/employee.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'add-purchase-request',
  templateUrl: './add-purchase-request.component.html',
  styleUrls: ['./add-purchase-request.component.css']
})
export class AddPurchaseRequestComponent implements OnInit {
  
itemForm:FormGroup;
itemList:any;

public itemBulk:any=[];
checked: any;
page = 1;
pageSize: number = 10;
header:any;
openStyle="none";

public totalItem : number = 0;
displayStyle="none";
createForm:FormGroup
@BlockUI('loading') loading!: NgBlockUI

  constructor(private fb:FormBuilder,private employeeService:EmployeeService,private toastr:ToastrService,
    private cartService:CartService) {
   this.itemForm= this.fb.group({
      item_name:['',Validators.required],
      item_type :['',Validators.required],
      auth_level: ['',Validators.required],
      evaluation_price:['',Validators.required],
      item_number:['',Validators.required],
      description:['',Validators.required],
      base_unit:['',Validators.required],
      store_unit:['',Validators.required],
      expire_date:['',Validators.required],
      sales_price:['',Validators.required],
      recipe:['',Validators.required],
      open_price:['',Validators.required],
      voided:['',Validators.required],
      receiving_store:['',Validators.required],
      open_item:['',Validators.required],
      last_date:['',Validators.required],
      last_price:['',Validators.required],
      last_quantity:['',Validators.required],



    })
   }

  ngOnInit(): void {
    // this.cartService.getProducts().subscribe((res)=>{

    //   this.totalItem = res.length;
    //   this.itemBulk = res;
      
    // })
    this.getItems();
  }


  async getItems(){
        try{
          this.loading.start()
          var res = this.employeeService.getItems();
          if(res) this.itemList=res;

        }catch(err){this.toastr.error(null,err)}

            finally{this.loading.stop();}
  }
  addItem(record){
    const  itm ={
        // for(let i:number =0;i<this.itemBulk.length; i++){
     
  // this.to_list= this.itemBulk[i];
  item_name : record.item_name,
  item_type : record.item_type,
  auth_level :record.auth_level,
  evaluation_price: record.evaluation_price,
  item_number: record.item_number,

  description : record.description,
  store_unit : record.store_unit,
  expire_date :record.expire_date,
  sales_price:record.sales_price,
  recipe:record.recipe,

  base_unit:record.base_unit,
  open_price : record.open_price,
  voided :record.voided,
  receiving_store:record.receiving_store,
  open_item: record.open_item,
  last_date :record.last_date,
  last_price: record.last_price,
 last_quantity:record.last_quantity
    }
    try{
      this.loading.start()
      var res = this.employeeService.addItem(itm);
      if(res)this.toastr.success(null,"record(s) added"); this.getItems();
    }catch(err){this.toastr.error(null,err)}

        finally{this.loading.stop();}


  }



switchClicked(event:any,item:any){
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
// this.cartService.gCetitemBulks();
}}
}
// for(let i:number =0;i<this.itemBulk.length; i++){
     
//   // this.to_list= this.itemBulk[i];
//   this.itemBulk[i].item_name = record.item_name
//   this.itemBulk[i].item_type = record.item_type
//   this.itemBulk[i].auth_level =record.auth_level
//   this.itemBulk[i].evaluation_price= record.evaluation_price
//   this.itemBulk[i].item_number= record.item_number

//   this.itemBulk[i].description = record.description
//   this.itemBulk[i].store_unit = record.store_unit
//   this.itemBulk[i].expire_date =record.expire_date
//   this.itemBulk[i].sales_price= record.sales_price
//   this.itemBulk[i].recipe= record.recipe


//   this.itemBulk[i].open_price = record.open_price
//   this.itemBulk[i].voided =record.voided
//   this.itemBulk[i].receiving_store= record.receiving_store
//   this.itemBulk[i].open_item= record.open_item


  
//   this.itemBulk[i].open_item = record.open_item
//   this.itemBulk[i].last_date =record.last_date
//   this.itemBulk[i].last_price= record.last_price
//   this.itemBulk[i]. last_quantity=record.last_quantity
// }

