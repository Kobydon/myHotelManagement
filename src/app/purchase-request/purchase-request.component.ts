import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.css']
})
export class PurchaseRequestComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;
  @ViewChild('invoiceContent') invoiceContent!: ElementRef;

  itemsList: any[] = [];
  departmentList: any[] = [];
  storeList: any[] = [];
  purchaseList: any[] = [];
  cartItems: any[] = [];

  displayStyle = "none";
  header = '';
  page = 1;
  pageSize: number = 10;
  totalAmount: number = 0;
  itemForm!: FormGroup;
  user: any[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: userService,
    private toastr: ToastrService,
    private guestService: GuestService
  ) {
    this.itemForm = this.fb.group({
      item: ['', Validators.required],
      quantity: ['', Validators.required],
      unit_price: ['', Validators.required],
      total_cost: ['', Validators.required],
      department: ['', Validators.required],
      store: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getDepartmentList();
    this.getItemsList();
    this.getPurchaseList();
    this.getUser();
    this.getVendorList();
  }

  async getUser() {
    try {
      const res = await this.userService.getUser();
      if (res) this.user = res;
    } catch (err) {
      console.log(err);
    }
  }

  async getVendorList() {
    try {
      const res = await this.guestService.getVendorList();
      if (res) this.storeList = res;
    } catch (error) {
      this.toastr.error('Error fetching vendors');
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

  async getDepartmentList() {
    try {
      const res = await this.guestService.getDepartmentList();
      if (res) this.departmentList = res;
    } catch (error) {
      this.toastr.error('Error fetching departments');
    }
  }

  async getPurchaseList() {
    try {
      const res = await this.guestService.getPurchaseList();
      if (res) this.purchaseList = res;
    } catch (error) {
      this.toastr.error('Error fetching purchase list');
    }
  }

  openPopup(action: string, item: any = null) {
    this.header = action;
    this.itemForm.reset();
    this.displayStyle = "block";
  }

  closePopup() {
    this.displayStyle = "none";
    this.cartItems = []; // Clear cart when modal is closed
  }

  addToCart() {
    if (this.itemForm.valid) {
      this.cartItems.push({ ...this.itemForm.value });
      this.itemForm.reset();
      this.toastr.success("Item added to cart");
    } else {
      this.toastr.warning("Please fill all fields");
    }
  }

  async submitCart() {
    if (this.cartItems.length === 0) {
      return this.toastr.warning("No items in cart");
    }

    try {
      this.loading.start();
      const res = await this.guestService.submitMultiplePurchases(this.cartItems);
      if (res) {
        this.toastr.success("Cart submitted successfully");
        this.getPurchaseList();
        this.cartItems = [];
        this.closePopup();
      }
    } catch (error) {
      this.toastr.error("Failed to submit cart");
    } finally {
      this.loading.stop();
    }
  }

    async savePurchase(itemData: any) {
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
        this.getPurchaseList(); // Refresh the item list
        this.closePopup(); // Close the modal
      }
    } catch (error) {
      this.toastr.error('Error saving item');
    } finally {
      this.loading.stop();
    }
  }



  async approvePurchase(id: number) {
    try {
      this.loading.start();
      const res = await this.guestService.approvePurchase({ id });
      if (res) {
        this.getPurchaseList();
      }
    } catch (error) {
      this.toastr.error('Error approving purchase');
    } finally {
      this.loading.stop();
    }
  }

  async deletePurchase(itemId: number) {
    try {
      this.loading.start();
      const res = await this.guestService.deletePurchase(itemId);
      if (res) {
        this.toastr.success('Item deleted');
        this.getPurchaseList();
      }
    } catch (error) {
      this.toastr.error('Error deleting item');
    } finally {
      this.loading.stop();
    }
  }

  exportExcel() {
    const element = document.getElementById('excel-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'items_list.xlsx');
  }

  searchItems() {
    const input = document.getElementById('myInput') as HTMLInputElement;
    const filter = input.value.toUpperCase();
    const table = document.getElementById('excel-table') as HTMLTableElement;
    const tr = table.getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
      const td = tr[i].getElementsByTagName('td')[0];
      if (td) {
        const txtValue = td.textContent || td.innerText;
        tr[i].style.display = txtValue.toUpperCase().includes(filter) ? "" : "none";
      }
    }
  }

  pageClick() {}

  printInvoice() {
    const printContents = this.invoiceContent.nativeElement.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Invoice</title>');
      printWindow.document.write(`<style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; padding: 8px; }
      </style>`);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  }
}
