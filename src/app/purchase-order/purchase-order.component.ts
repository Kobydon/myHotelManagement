import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators,FormControlName } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
@Component({
  selector: 'purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.css']
})
export class PurchaseOrderComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;
  // @ViewChild('invoiceContent') invoiceContent!: ElementRef;
  itemsList: any[] = [];
  stockList: any[] = [];
  storeList: any[] = [];
  purchaseList: any[] = [];
 orderList: any[] = [];
  displayStyle = "none";
  header = '';
  page = 1;
  
  pageSize: number = 10; // Change to whatever page size you need
  totalAmount: number = 0;
  itemForm!: FormGroup;
  user:any[]=[];
  constructor(
    private fb: FormBuilder,private userService:userService,
    private toastr: ToastrService,
    private guestService:GuestService // AssumingGuestService handles your itemps
  ) {
    // Initialize the form
    this.itemForm = this.fb.group({
      id: ['', Validators.required],
      item: ['', Validators.required],
      quantity: ['', Validators.required],
      unit_price: ['', Validators.required],
      total_cost: ['', Validators.required],
      department: ['', Validators.required],

      store: ['', Validators.required],
    
    
    });
  }
  ngOnInit(): void {
    this.getOrderList();
    this.getUser();
 
  }

  async getUser(){
    try{
        var res = await this.userService.getUser()
        if (res) this.user=res;

    }catch(err){console.log(err)}
    finally{console.log("success");}
  


 }

  async getOrderList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getOrderList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.orderList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }



  openPopup(action: string, item: any = null) {
    this.header = action;
    if (action === 'Add New') {
      this.itemForm.reset();
    } else if (action === 'Edit' && item) {
      this.itemForm.patchValue(item);
    }
    this.displayStyle = "block";
  }

  // Close the modal
  closePopup() {
    this.displayStyle = "none";
  }

  // Save new or updated item
  async savePurchae(itemData: any) {
    try {
      this.loading.start();
      let res;
      if (this.header === 'Add New') {
        res = await this.guestService.addPurchase(itemData); // Assuming addItem() adds a new item
        this.toastr.success('Item successfully added');
      } else if (this.header === 'Edit') {
        res = await this.guestService.updatePurchase(itemData); // Assuming updateItem() updates an existing item
        this.toastr.success('Item successfully updated');
      }
      if (res) {
        this.getOrderList(); // Refresh the item list
        this.closePopup(); // Close the modal
      }
    } catch (error) {
      this.toastr.error('Error saving item');
    } finally {
      this.loading.stop();
    }
  }



  async approvePurchase(itemData: any) {
    try {
      this.loading.start();
      let res;
      res = await this.guestService.approvePurchase(itemData);
      if (res) {
        this.getOrderList(); // Refresh the item list
        this.closePopup(); // Close the modal
      }
    } catch (error) {
      this.toastr.error('Error saving item');
    } finally {
      this.loading.stop();
    }
  }

  // Delete item
  // async deletePurchase(itemId: number) {
  //   try {
  //     this.loading.start();
  //     const res = await this.guestService.deletePurchase(itemId); // Assuming deleteItem() deletes an item
  //     if (res) {
  //       this.toastr.success('Item successfully deleted');
  //       this.getOrderList(); // Refresh the item list
  //     }
  //   } catch (error) {
  //     this.toastr.error('Error deleting item');
  //   } finally {
  //     this.loading.stop();
  //   }
  // }

  // Export to Excel
  exportExcel() {
    const element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'items_list.xlsx');
  }

  // Search items (filter based on input)
  searchItems() {
    const input = document.getElementById('myInput') as HTMLInputElement;
    const filter = input.value.toUpperCase();
    const table = document.getElementById('excel-table') as HTMLTableElement;
    const tr = table.getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName('td')[0]; // Search by item name
      if (td) {
        const txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }

  // Handle page change for pagination
  pageClick() {
    // Logic for handling page change, if necessary
  }

  // printInvoice() {
  //   const printContents = this.invoiceContent.nativeElement.innerHTML;
  //   const printWindow = window.open('', '', 'height=800,width=600');

  //   if (printWindow) {
  //     printWindow.document.write('<html><head><title>Invoice</title>');
  //     printWindow.document.write(
  //       `<style>
  //         body { font-family: Arial, sans-serif; padding: 20px; }
  //         h1, h3 { text-align: center; }
  //         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  //         table, th, td { border: 1px solid #ddd; padding: 8px; }
  //         th { background-color: #f4f4f4; }
  //         .text-right { text-align: right; }
  //         .text-center { text-align: center; }
  //         .invoice-footer { margin-top: 20px; text-align: center; }
  //       </style>`
  //     );
  //     printWindow.document.write('</head><body>');
  //     printWindow.document.write(printContents);
  //     printWindow.document.write('</body></html>');
  //     printWindow.document.close();
  //     printWindow.print();
  //   }
  // }
}
