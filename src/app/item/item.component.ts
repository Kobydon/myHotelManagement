import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';

import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;
  itemsList: any[] = [];
  categoryList: any[] = [];
  groupList: any[] = [];
  familyList: any[] = [];
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
      category: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      group: ['', Validators.required],
      family: ['', Validators.required],
      unit: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getItemsList();
    this.getCategoryList();
    this.getUnitList();
    this.getFamilyList();
  }

  // Fetch items list
  async getItemsList() {
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

  
  async getFamilyList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getFamilyList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.familyList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching family list');
    } finally {
      // this.loading.stop();
    }
  }



  async getGroupList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getGroupList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.familyList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching group list');
    } finally {
      // this.loading.stop();
    }
  }



  async getUnitList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getUnitList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.unitList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching unit list');
    } finally {
      // this.loading.stop();
    }
  }
  // Open the modal for adding or editing
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
        res = await this.guestService.addItem(itemData); // Assuming addItem() adds a new item
        this.toastr.success('Item successfully added');
      } else if (this.header === 'Edit') {
        res = await this.guestService.updateItem(itemData); // Assuming updateItem() updates an existing item
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
      const res = await this.guestService.deleteItem(itemId); // Assuming deleteItem() deletes an item
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
