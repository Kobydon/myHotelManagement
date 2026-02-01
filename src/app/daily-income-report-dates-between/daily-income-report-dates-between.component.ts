import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

function dateRangeValidator(control: AbstractControl) {
  const start = control.get('dates')?.value;
  const end = control.get('datestwo')?.value;

  if (start && end && start === end) {
    return { sameDate: true };
  }
  return null;
}

@Component({
  selector: 'daily-income-report-dates-between',
  templateUrl: './daily-income-report-dates-between.component.html',
})
export class DailyIncomeReportDatesBetweenComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;

  createForm!: FormGroup;
  incomeReport: any[] = [];
  expenditureReport: any[] = [];
  totalIncome = 0;
  totalExpenditure = 0;

  cashiers: any[] = [];
  categoryList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private guestService: GuestService,
    private userService: userService
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group(
      {
        dates: ['', Validators.required],
        datestwo: ['', Validators.required],
        cashier: [''],
        paymethod: [''],
        barrest: [''],
        categos: [''],
      },
      { validators: dateRangeValidator }
    );

    this.getCashiers();
    this.getCategoryList();
  }

  async searchDates() {
    if (this.createForm.invalid) {
      this.toastr.warning('Start and End date must be different');
      return;
    }

    const { dates, datestwo } = this.createForm.value;

    this.loading.start();
    await this.searchIncome(dates, datestwo);
    await this.searchExpense(dates, datestwo);
    this.loading.stop();
  }

async searchIncome(start: string, end: string) {
  this.totalIncome = 0;

  const res = await this.guestService.searchIncomeDatesTwo({
    date: start,
    datetwo: end
  });

  this.incomeReport = res as any[];

  this.incomeReport.forEach(i => {
    this.totalIncome += Number(i.amount) || 0;
  });
}
async searchExpense(start: string, end: string) {
  this.totalExpenditure = 0;

  const res = await this.guestService.searchExpenseDateTwo({
    date: start,
    datetwo: end
  });

  this.expenditureReport = res as any[];

  this.expenditureReport.forEach(e => {
    this.totalExpenditure += Number(e.amount) || 0;
  });
}


  async findCashier() { this.searchDates(); }
  async findMethod() { this.searchDates(); }
  async findDepartment() { this.searchDates(); }
  async findCategory() { this.searchDates(); }

  async getCashiers() {
    this.cashiers = await this.userService.get_users_cashiers();
  }

  async getCategoryList() {
    this.categoryList = await this.guestService.getCategoryList();
  }

  printToPdf() {}
  downloadPdf() {}

  filterByMostPayment() {
    this.incomeReport.sort((a, b) => Number(b.amount) - Number(a.amount));
  }

  filterByMostPaymentCustomer() {}
}
