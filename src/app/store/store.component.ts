import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import { GuestService } from 'app/services/guest.service';
@Component({
  selector: 'store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;
  itemsList: any[] = [];
  stockList: any[] = [];
  categoryList: any[] = [];
  storeList: any[] = [];
unitList: any[] = [];
  displayStyle = "none";
  header = '';
  page = 1;
  pageSize: number = 10; // Change to whatever page size you need
  totalAmount: number = 0;
  itemForm!: FormGroup;
 
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private guestService:GuestService // AssumingGuestService handles your items
  ) {
    // Initialize the form
    this.itemForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
    
    });
  }

  ngOnInit(): void {
    this.getCategoryList();
    this.getStoreList();
  }

  

  async getCategoryList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getCategoryList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.categoryList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }



  async getStoreList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getStoreList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.storeList = res;
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
  async saveStore(itemData: any) {
    try {
      this.loading.start();
      let res;
      if (this.header === 'Add New') {
        res = await this.guestService.addStore(itemData); // Assuming addItem() adds a new item
        this.toastr.success('Item successfully added');
      } else if (this.header === 'Edit') {
        res = await this.guestService.updateStore(itemData); // Assuming updateItem() updates an existing item
        this.toastr.success('Item successfully updated');
      }
      if (res) {
        this.getStoreList(); // Refresh the item list
        this.closePopup(); // Close the modal
      }
    } catch (error) {
      this.toastr.error('Error saving item');
    } finally {
      this.loading.stop();
    }
  }

  // Delete item
  async deleteStore(itemId: number) {
    try {
      this.loading.start();
      const res = await this.guestService.deleteStock(itemId); // Assuming deleteItem() deletes an item
      if (res) {
        this.toastr.success('Item successfully deleted');
        this.getStoreList(); // Refresh the item list
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


}

