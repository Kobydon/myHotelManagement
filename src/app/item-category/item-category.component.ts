import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';

import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'item-category',
  templateUrl: './item-category.component.html',
  styleUrls: ['./item-category.component.css']
})
export class ItemCategoryComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;

  // Make Math available in template
  Math = Math;

  // ============================================================
  // DATA
  // ============================================================

  itemsList: any[] = [];
  categoryList: any[] = [];
  groupList: any[] = [];
  familyList: any[] = [];
  unitList: any[] = [];

  user: any[] = [];

  // ============================================================
  // UI
  // ============================================================

  displayStyle: string = 'none';
  header: string = '';

  // ============================================================
  // PAGINATION
  // ============================================================

  page: number = 1;
  pageSize: number = 100;
  totalAmount: number = 0;

  // ============================================================
  // FORM
  // ============================================================

  itemForm!: FormGroup;

  // ============================================================
  // SEARCH
  // ============================================================

  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private userService: userService,
    private toastr: ToastrService,
    private guestService: GuestService
  ) {

    this.itemForm = this.fb.group({

      id: [''],

      name: [
        '',
        Validators.required
      ],

      description: [
        '',
        Validators.required
      ]

    });
  }

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.getCategoryList();
    this.getGroupList();
    this.getFamilyList();
    this.getUnitList();
    this.getUser();

  }

  // ============================================================
  // GET USER
  // ============================================================

  async getUser(): Promise<void> {

    try {

      const res = await this.userService.getUser();

      if (res) {
        this.user = res;
      }

    } catch (error) {

      console.error(
        'Error fetching user:',
        error
      );

    }

  }

  // ============================================================
  // GET CATEGORY LIST
  // ============================================================

  async getCategoryList(): Promise<void> {

    try {

      if (this.loading) {
        this.loading.start();
      }

      const res = await this.guestService.getCategoryList();

      if (res) {

        this.categoryList = Array.isArray(res)
          ? res
          : [];

      } else {

        this.categoryList = [];

      }

    } catch (error) {

      console.error(
        'Error fetching category list:',
        error
      );

      this.categoryList = [];

      this.toastr.error(
        'Error fetching category list'
      );

    } finally {

      if (this.loading) {
        this.loading.stop();
      }

    }

  }

  // ============================================================
  // GET GROUP LIST
  // ============================================================

  async getGroupList(): Promise<void> {

    try {

      const res = await this.guestService.getGroupList();

      if (res) {

        this.groupList = Array.isArray(res)
          ? res
          : [];

      } else {

        this.groupList = [];

      }

    } catch (error) {

      console.error(
        'Error fetching group list:',
        error
      );

      this.groupList = [];

    }

  }

  // ============================================================
  // GET FAMILY LIST
  // ============================================================

  async getFamilyList(): Promise<void> {

    try {

      const res = await this.guestService.getFamilyList();

      if (res) {

        this.familyList = Array.isArray(res)
          ? res
          : [];

      } else {

        this.familyList = [];

      }

    } catch (error) {

      console.error(
        'Error fetching family list:',
        error
      );

      this.familyList = [];

    }

  }

  // ============================================================
  // GET UNIT LIST
  // ============================================================

  async getUnitList(): Promise<void> {

    try {

      const res = await this.guestService.getUnitList();

      if (res) {

        this.unitList = Array.isArray(res)
          ? res
          : [];

      } else {

        this.unitList = [];

      }

    } catch (error) {

      console.error(
        'Error fetching unit list:',
        error
      );

      this.unitList = [];

    }

  }

  // ============================================================
  // OPEN POPUP
  // ============================================================

  openPopup(
    action: string,
    item: any = null
  ): void {

    this.header = action;

    // ----------------------------------------------------------
    // ADD
    // ----------------------------------------------------------

    if (action === 'Add New') {

      this.itemForm.reset();

      this.itemForm.patchValue({
        id: ''
      });

    }

    // ----------------------------------------------------------
    // EDIT
    // ----------------------------------------------------------

    else if (
      action === 'Edit' &&
      item
    ) {

      this.itemForm.patchValue({

        id: item.id || '',

        name: item.name || '',

        description:
          item.description || ''

      });

    }

    this.displayStyle = 'block';

  }

  // ============================================================
  // CLOSE POPUP
  // ============================================================

  closePopup(): void {

    this.displayStyle = 'none';

    this.itemForm.reset();

    this.header = '';

  }

  // ============================================================
  // SAVE CATEGORY
  // ============================================================

  async saveCategory(
    itemData?: any
  ): Promise<void> {

    const data =
      itemData ||
      this.itemForm.value;

    if (
      !data.name ||
      !String(data.name).trim()
    ) {

      this.toastr.warning(
        'Please enter category name'
      );

      return;

    }

    try {

      if (this.loading) {
        this.loading.start();
      }

      let res: any = null;

      // --------------------------------------------------------
      // ADD
      // --------------------------------------------------------

      if (this.header === 'Add New') {

        res =
          await this.guestService.addCategory({
            ...data,
            name: String(data.name).trim()
          });

        if (res) {

          this.toastr.success(
            'Category successfully added'
          );

        }

      }

      // --------------------------------------------------------
      // EDIT
      // --------------------------------------------------------

      else if (this.header === 'Edit') {

        if (!data.id) {

          this.toastr.warning(
            'Category ID is missing'
          );

          return;

        }

        res =
          await this.guestService.updateCategory(
            data
          );

        if (res) {

          this.toastr.success(
            'Category successfully updated'
          );

        }

      }

      // --------------------------------------------------------
      // REFRESH
      // --------------------------------------------------------

      if (res) {

        await this.getCategoryList();

        this.closePopup();

      }

    } catch (error) {

      console.error(
        'Error saving category:',
        error
      );

      this.toastr.error(
        'Error saving category'
      );

    } finally {

      if (this.loading) {
        this.loading.stop();
      }

    }

  }

  // ============================================================
  // DELETE CATEGORY
  // ============================================================

  async deleteCategory(
    itemId: number
  ): Promise<void> {

    if (!itemId) {

      this.toastr.warning(
        'Category ID is missing'
      );

      return;

    }

    // Confirm deletion
    const confirmDelete = confirm(
      'Are you sure you want to delete this category?'
    );

    if (!confirmDelete) {
      return;
    }

    try {

      if (this.loading) {
        this.loading.start();
      }

      const res =
        await this.guestService.deleteCategory(
          itemId
        );

      if (res) {

        this.toastr.success(
          'Category successfully deleted'
        );

        await this.getCategoryList();

      }

    } catch (error) {

      console.error(
        'Error deleting category:',
        error
      );

      this.toastr.error(
        'Error deleting category'
      );

    } finally {

      if (this.loading) {
        this.loading.stop();
      }

    }

  }

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  exportExcel(): void {

    const element =
      document.getElementById(
        'excel-table'
      );

    if (!element) {

      this.toastr.warning(
        'Category table was not found'
      );

      return;

    }

    try {

      const ws: XLSX.WorkSheet =
        XLSX.utils.table_to_sheet(
          element
        );

      const wb: XLSX.WorkBook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        'Categories'
      );

      XLSX.writeFile(
        wb,
        'category_list.xlsx'
      );

      this.toastr.success(
        'Category list exported successfully'
      );

    } catch (error) {

      console.error(
        'Excel export error:',
        error
      );

      this.toastr.error(
        'Unable to export category list'
      );

    }

  }

  // ============================================================
  // SEARCH
  // ============================================================

  onSearchChange(): void {

    const term = this.searchTerm.trim().toLowerCase();

    const table =
      document.getElementById(
        'excel-table'
      ) as HTMLTableElement;

    if (!table) {
      return;
    }

    const rows =
      table.getElementsByTagName('tr');

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const cells =
        rows[i].getElementsByTagName('td');

      if (!cells.length) {
        continue;
      }

      // Search category name
      const text =
        cells[0]
          ?.textContent
          ?.toLowerCase() || '';

      rows[i].style.display =
        text.indexOf(term) > -1
          ? ''
          : 'none';

    }

  }

  // ============================================================
  // PAGINATION
  // ============================================================

  pageClick(): void {

    // Optional: Add any logic when page changes
    console.log('Page changed to:', this.page);

  }

  // ============================================================
  // GET CATEGORY NAME BY ID
  // ============================================================

  getCategoryName(categoryId: number): string {

    if (!categoryId || !this.categoryList) return 'N/A';

    const category = this.categoryList.find(
      (c: any) => c.id === categoryId
    );

    return category ? category.name : 'N/A';

  }

  // ============================================================
  // GET GROUP NAME BY ID
  // ============================================================

  getGroupName(groupId: number): string {

    if (!groupId || !this.groupList) return 'N/A';

    const group = this.groupList.find(
      (g: any) => g.id === groupId
    );

    return group ? group.name : 'N/A';

  }

  // ============================================================
  // GET FAMILY NAME BY ID
  // ============================================================

  getFamilyName(familyId: number): string {

    if (!familyId || !this.familyList) return 'N/A';

    const family = this.familyList.find(
      (f: any) => f.id === familyId
    );

    return family ? family.name : 'N/A';

  }

  // ============================================================
  // GET UNIT NAME BY ID
  // ============================================================

  getUnitName(unitId: number): string {

    if (!unitId || !this.unitList) return 'N/A';

    const unit = this.unitList.find(
      (u: any) => u.id === unitId
    );

    return unit ? unit.name : 'N/A';

  }

}