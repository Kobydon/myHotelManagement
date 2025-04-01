import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';

import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'app-item',
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
  users: any[] = [];
  
  displayStyle = "none";
  header = '';
  page = 1;
  pageSize: number = 60;
  totalAmount: number = 0;
  
  itemForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private userService: userService,
    private guestService: GuestService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchData();
  }

  private initializeForm() {
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

  private async fetchData() {
    await Promise.all([
      this.getItemsList(),
      this.getCategoryList(),
      // this.getGroupList(),
      this.getFamilyList(),
      this.getUnitList(),
      this.getUsers()
    ]);
  }

  async getUsers() {
    try {
      const res = await this.userService.getUser();
      if (res) this.users = res;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async getItemsList() {
    try {
      const res = await this.guestService.getItemsList();
      if (res) this.itemsList = res;
    } catch (error) {
      this.toastr.error('Error fetching items list');
    }
  }

  async getCategoryList() {
    try {
      const res = await this.guestService.getCategoryList();
      if (res) this.categoryList = res;
    } catch (error) {
      this.toastr.error('Error fetching category list');
    }
  }

  async getFamilyList() {
    try {
      const res = await this.guestService.getFamilyList();
      if (res) this.familyList = res;
    } catch (error) {
      this.toastr.error('Error fetching family list');
    }
  }

  async getGroupList() {
    try {
      const res = await this.guestService.getGroupList();
      if (res) this.groupList = res;
    } catch (error) {
      this.toastr.error('Error fetching group list');
    }
  }

  async getUnitList() {
    try {
      const res = await this.guestService.getUnitList();
      if (res) this.unitList = res;
    } catch (error) {
      this.toastr.error('Error fetching unit list');
    }
  }

  openPopup(action: string, item: any = null) {
    this.header = action;
    this.itemForm.reset();

    if (action === 'Edit' && item) {
      this.itemForm.patchValue(item);
    }
    this.displayStyle = "block";
  }

  closePopup() {
    this.displayStyle = "none";
  }

  async saveItem(r) {
    try {
      this.loading.start();
      const itemData = this.itemForm.value;

      if (this.header === 'Add New') {
        await this.guestService.addItem(itemData);
        this.toastr.success('Item successfully added');
      } else {
        await this.guestService.updateItem(itemData);
        this.toastr.success('Item successfully updated');
      }

      await this.getItemsList();
      // this.closePopup();
    } catch (error) {
      this.toastr.error('Error saving item');
    } finally {
      this.loading.stop();
    }
  }

  async deleteItem(itemId: number) {
    try {
      this.loading.start();
      await this.guestService.deleteItem(itemId);
      this.toastr.success('Item successfully deleted');
      await this.getItemsList();
    } catch (error) {
      this.toastr.error('Error deleting item');
    } finally {
      this.loading.stop();
    }
  }

  exportExcel() {
    const element = document.getElementById('excel-table');
    if (!element) {
      this.toastr.error("Table element not found");
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'items_list.xlsx');
  }

  searchItems() {
    const input = document.getElementById('myInput') as HTMLInputElement;
    if (!input) return;

    const filter = input.value.toUpperCase();
    const table = document.getElementById('excel-table') as HTMLTableElement;
    if (!table) return;

    const tr = table.getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName('td')[0];
      if (td) {
        const txtValue = td.textContent || td.innerText;
        tr[i].style.display = txtValue.toUpperCase().includes(filter) ? "" : "none";
      }
    }
  }
}
