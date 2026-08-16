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
    // Set default dates to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    this.filterForm = this.fb.group({
      from_date: [this.formatDate(firstDay)],
      to_date: [this.formatDate(today)]
    });

    // Auto-fetch on load
    this.fetchBalance();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  subKeys(cat: string): string[] {
    if (!this.result?.expense_groups || !this.result.expense_groups[cat]) {
      return [];
    }
    return Object.keys(this.result.expense_groups[cat]);
  }

  fetchBalance(): void {
    if (!this.filterForm.value.from_date || !this.filterForm.value.to_date) {
      alert('Please select both from and to dates');
      return;
    }

    this.loading = true;
    this.guestService.getBalanceSheet(this.filterForm.value).subscribe({
      next: (res) => {
        this.result = res;
        this.expenseKeys = res.expense_groups ? Object.keys(res.expense_groups) : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Balance sheet error:', err);
        this.loading = false;
        alert('Error loading balance sheet. Please try again.');
      }
    });
  }
}