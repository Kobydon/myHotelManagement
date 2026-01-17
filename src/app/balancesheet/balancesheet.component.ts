import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'balancesheet',
  templateUrl: './balancesheet.component.html',
  styleUrls: ['./balancesheet.component.css']
})
export class BalancesheetComponent implements OnInit {

  filterForm!: FormGroup;
  result: any = null;
  loading = false;

  expenseKeys: string[] = [];

  constructor(private fb: FormBuilder, private guestService: GuestService) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      from_date: [''],
      to_date: ['']
    });
  }

  subKeys(cat: string) {
    if (!this.result?.expense_groups || !this.result.expense_groups[cat]) {
      return [];
    }
    return Object.keys(this.result.expense_groups[cat]);
  }

  fetchBalance() {
    this.loading = true;

    this.guestService.getBalanceSheet(this.filterForm.value).subscribe({
      next: (res) => {
        this.result = res;
        this.expenseKeys = res.expense_groups ? Object.keys(res.expense_groups) : [];
        this.loading = false;
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
      }
    });
  }
}
