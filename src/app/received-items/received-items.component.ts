import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators ,FormControlName} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'received-items',
  templateUrl: './received-items.component.html',
  styleUrls: ['./received-items.component.css']
})
export class ReceivedItemsComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;
  showGlow = false;
  itemList: any[] = [];
  itemsList: any[] = [];
  stockList: any[] = [];
  groupList: any[] = [];
  familyList: any[] = [];
  storeList: any[] = [];
unitList: any[] = [];
  displayStyle = "none";
  header = '';
  page = 1;
  pageSize: number = 100; // Change to whatever page size you need
  totalAmount: number = 0;
  itemForm!: FormGroup;
  user:any[]=[];
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,private userService:userService,
    private guestService:GuestService // AssumingGuestService handles your items
  ) {
    // Initialize the form
    this.itemForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      quantity: ['', Validators.required],
      expired_date: ['', Validators.required],

    });
  }

  ngOnInit(): void {
    this.getItemsList();
    this.getItemList();
     this.checkExpiryGlow();
  }

checkExpiryGlow() {
  const today = new Date();

  // Loop through all items and check if any expire within 1 month
  for (let item of this.itemList) {
    const expiry = new Date(item.expired_date);
    const timeDiff = expiry.getTime() - today.getTime();
    const daysToExpiry = timeDiff / (1000 * 3600 * 24);

    if (daysToExpiry <= 30 && daysToExpiry >= 0) {
      this.showGlow = true;
      return; // Stop once we find one
    }
  }

  // If none are within 1 month
  this.showGlow = false;
}
async sortByExpiry() {
  try{


  var res = await this.guestService.getExpiry();
  if(res) this.itemList= res;
    }catch(err){
      alert(err);
    }
}
isExpired(date: string | Date): boolean {
  const today = new Date();
  const expiry = new Date(date);
  return expiry.getTime() < today.getTime(); // True if expired
}
getStatus(date: string | Date): string {
  const today = new Date();
  const expiry = new Date(date);
  const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);

  if (diffDays < 0) return 'Expired';
  else if (diffDays <= 30) return 'Expiring Soon';
  else return 'Active';
}


  async getItemList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getItemsList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.itemsList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }



   async getItemsList() {
      try {
        // this.loading.start();
        const res = await this.guestService.getItemList(); // Assuming getItemsList() fetches the items from the API
        if (res) {
          this.itemList = res;
        }
      } catch (error) {
        this.toastr.error('Error fetching items list');
      } finally {
        // this.loading.stop();
      }
    }
  
    async getStockList() {
      try {
        // this.loading.start();
        const res = await this.guestService.getStockList(); // Assuming getItemsList() fetches the items from the API
        if (res) {
          this.stockList = res;
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
    async saveItem(itemData: any) {
      try {
        this.loading.start();
        let res;
        if (this.header === 'Add New') {
          res = await this.guestService.addRecievedItem(itemData); // Assuming addItem() adds a new item
          this.toastr.success('Item successfully added');
        } else if (this.header === 'Edit') {
          res = await this.guestService.updateRecievedItem(itemData); // Assuming updateItem() updates an existing item
          this.toastr.success('Item successfully updated');
        }
        if (res) {
          this.getItemsList(); // Refresh the item list
          this.closePopup(); // Close the modal
        }
      } catch (error) {
        this.toastr.error('Error saving item');
      } finally {
        this.loading.stop();
      }
    }
  
    // Delete item
    async deleteItem(itemId: number) {
      try {
        this.loading.start();
        const res = await this.guestService.deleteReceivedItem(itemId); // Assuming deleteItem() deletes an item
        if (res) {
          this.toastr.success('Item successfully deleted');
          this.getItemsList(); // Refresh the item list
        }
      } catch (error) {
        this.toastr.error('Error deleting item');
      } finally {
        this.loading.stop();
      }
    }
  
    // Export to Excel
    exportExcel() {
      const element = document.getElementById('excel-table');
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'stock_list.xlsx');
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
  
  
}
