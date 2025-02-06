import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators ,FormControlName} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
@Component({
  selector: 'all-sessions',
  templateUrl: './all-sessions.component.html',
  styleUrls: ['./all-sessions.component.css']
})
export class AllSessionsComponent implements OnInit {
  @BlockUI('loading') loading!: NgBlockUI;
  itemsList: any[] = [];
  stockList: any[] = [];
  groupList: any[] = [];
  familyList: any[] = [];
  sessionList: any[] = [];
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
      store: ['', Validators.required],
      description: ['', Validators.required],
      group: ['', Validators.required],
      family: ['', Validators.required],
      unit: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getsessionList();
    this.getUser();
  }
  async getUser(){
    try{
        var res = await this.userService.getUser()
        if (res) this.user=res;

    }catch(err){console.log(err)}
    finally{console.log("success");}
  


 }



  async getsessionList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getSessionList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.sessionList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }

    exportExcel() {
      const element = document.getElementById('excel-table');
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'session_list.xlsx');
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

}
