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
  sessionLIst: any[] = [];
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
    this.getsessionList
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
        this.sessionLIst = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching items list');
    } finally {
      // this.loading.stop();
    }
  }

}
