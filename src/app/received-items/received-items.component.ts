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
  pageSize: number = 10; // Change to whatever page size you need
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

    });
  }

  ngOnInit(): void {
    this.getItemsList();
    this.getItemList();
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
