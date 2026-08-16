import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { userService } from 'app/user.service';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'financial-overview',
  templateUrl: './financial-overview.component.html',
  styleUrls: ['./financial-overview.component.css']
})
export class FinancialOverviewComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;

  createForm!: FormGroup;

  submitted = false;

  user: any = [];

  /*
   * SALES / INCOME DATA
   */
  incomeReport: any[] = [];

  /*
   * EXPENSE DATA
   */
  expenditureReport: any[] = [];

  /*
   * GOP DATA
   */
  gopList: any[] = [];

  /*
   * SUMMARY VALUES
   */
  totalIncome = 0;
  totalExpenditure = 0;
  totalSales = 0;
  totalCollected = 0;
  totalBalance = 0;
  totalItems = 0;
  totalOrders = 0;

  /*
   * FINANCIAL CALCULATIONS
   */
  gopDeduction = 0;
  nop = 0;
  cashAtHand = 0;

  /*
   * LOADING / SEARCH STATE
   */
  isLoading = false;
  hasSearched = false;

  /*
   * API RESPONSE
   */
  apiResponse: any = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private guestService: GuestService,
    private userService: userService
  ) {

    this.createForm = this.fb.group({
      id: [''],
      role: [''],
      method: [''],

      date: [''],
      dates: ['', Validators.required],
      datetwo: ['', Validators.required]
    });

  }

  ngOnInit(): void {

    this.getUser();

    this.getgopList();

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

      console.error('Error getting user:', error);

    }

  }


  // ============================================================
  // DATE SEARCH
  // ============================================================

  async searchDates(): Promise<void> {

    const dateFrom = this.createForm.get('dates')?.value;
    const dateTo = this.createForm.get('datetwo')?.value;

    if (!dateFrom || !dateTo) {

      this.toastr.warning(
        'Please select both From Date and To Date.',
        'Date Required'
      );

      return;
    }


    /*
     * Prevent invalid date range
     */

    if (dateFrom > dateTo) {

      this.toastr.warning(
        'The From Date cannot be greater than the To Date.',
        'Invalid Date Range'
      );

      return;
    }


    this.hasSearched = true;

    this.isLoading = true;

    try {

      /*
       * Load income/sales
       */
      await this.searchIncomeDates(dateFrom, dateTo);


      /*
       * Load expenses
       */
      await this.searchExpenseDates(dateFrom, dateTo);


      /*
       * Calculate GOP
       */
      this.calculateFinancialOverview();

    } catch (error: any) {

      console.error('Error searching financial overview:', error);

      this.toastr.error(
        error?.message || 'Unable to load financial data.',
        'Error'
      );

    } finally {

      this.isLoading = false;

    }

  }


  // ============================================================
  // SEARCH INCOME / SALES
  // ============================================================

  async searchIncomeDates(
    dateFrom: string,
    dateTo: string
  ): Promise<void> {

    const requestData = {
      date: dateFrom,
      datetwo: dateTo
    };


    try {

      const res: any =
        await this.guestService.searchIncomeDatesTwo(requestData);


      console.log('INCOME API RESPONSE:', res);


      /*
       * Reset existing data
       */

      this.incomeReport = [];

      this.totalIncome = 0;
      this.totalSales = 0;
      this.totalCollected = 0;
      this.totalBalance = 0;
      this.totalItems = 0;
      this.totalOrders = 0;


      if (!res) {

        console.warn('Income API returned empty response.');

        return;

      }


      /*
       * ========================================================
       * IMPORTANT
       *
       * Your API response is:
       *
       * {
       *    data: [],
       *    summary: {}
       * }
       *
       * Therefore we MUST use res.data.
       * ========================================================
       */


      if (Array.isArray(res.data)) {

        this.incomeReport = res.data;

      } else if (Array.isArray(res)) {

        /*
         * Fallback in case another API returns a plain array.
         */

        this.incomeReport = res;

      } else {

        this.incomeReport = [];

      }


      /*
       * ========================================================
       * GET SUMMARY
       * ========================================================
       */

      if (res.summary) {

        this.totalSales =
          Number(res.summary.total_sales) || 0;

        this.totalCollected =
          Number(res.summary.total_collected) || 0;

        this.totalBalance =
          Number(res.summary.total_balance) || 0;

        this.totalItems =
          Number(res.summary.total_items) || 0;

        this.totalOrders =
          Number(res.summary.total_orders) || 0;


        /*
         * For the financial overview,
         * total income is total sales.
         */

        this.totalIncome = this.totalSales;

      } else {

        /*
         * Fallback calculation if summary is unavailable.
         */

        this.totalIncome = this.incomeReport.reduce(
          (sum: number, item: any) => {

            return sum + (Number(item.total) || 0);

          },
          0
        );


        this.totalSales = this.totalIncome;


        this.totalCollected = this.incomeReport.reduce(
          (sum: number, item: any) => {

            return sum + (Number(item.collected) || 0);

          },
          0
        );


        this.totalBalance = this.incomeReport.reduce(
          (sum: number, item: any) => {

            return sum + (Number(item.balance) || 0);

          },
          0
        );


        this.totalItems = this.incomeReport.length;


        /*
         * Get unique order IDs
         */

        const orderIds = this.incomeReport
          .map((item: any) => item.id)
          .filter((id: any) => id !== null && id !== undefined);


        this.totalOrders = new Set(orderIds).size;

      }


      console.log(
        'Income/Sales records:',
        this.incomeReport
      );

      console.log(
        'Total Sales:',
        this.totalSales
      );

      console.log(
        'Total Orders:',
        this.totalOrders
      );

    } catch (error: any) {

      console.error(
        'Error loading income:',
        error
      );

      this.incomeReport = [];

      this.totalIncome = 0;
      this.totalSales = 0;
      this.totalCollected = 0;
      this.totalBalance = 0;
      this.totalItems = 0;
      this.totalOrders = 0;

      this.toastr.error(
        error?.message || 'Unable to load sales data.',
        'Sales Error'
      );

    }

  }


  // ============================================================
  // SEARCH EXPENSES
  // ============================================================

  async searchExpenseDates(
    dateFrom: string,
    dateTo: string
  ): Promise<void> {

    const requestData = {
      date: dateFrom,
      datetwo: dateTo
    };


    try {

      const res: any =
        await this.guestService.searchExpenseDateTwo(requestData);


      console.log('EXPENSE API RESPONSE:', res);


      this.expenditureReport = [];


      if (!res) {

        this.totalExpenditure = 0;

        return;

      }


      /*
       * Support both:
       *
       * [
       *    {...}
       * ]
       *
       * and
       *
       * {
       *    data: [...]
       * }
       */

      if (Array.isArray(res.data)) {

        this.expenditureReport = res.data;

      } else if (Array.isArray(res)) {

        this.expenditureReport = res;

      } else {

        this.expenditureReport = [];

      }


      /*
       * Calculate expenses
       */

      this.totalExpenditure =
        this.expenditureReport.reduce(
          (sum: number, item: any) => {

            return sum + (Number(item.amount) || 0);

          },
          0
        );


      console.log(
        'Total Expenditure:',
        this.totalExpenditure
      );

    } catch (error: any) {

      console.error(
        'Error loading expenses:',
        error
      );

      this.expenditureReport = [];

      this.totalExpenditure = 0;

      /*
       * Don't completely stop the financial overview
       * if expenses fail.
       */

      this.toastr.warning(
        error?.message || 'Unable to load expense data.',
        'Expense Warning'
      );

    }

  }


  // ============================================================
  // GET GOP LIST
  // ============================================================

  async getgopList(): Promise<void> {

    try {

      const res: any =
        await this.guestService.getgopList();


      console.log('GOP RESPONSE:', res);


      if (Array.isArray(res)) {

        this.gopList = res;

      } else if (res && Array.isArray(res.data)) {

        this.gopList = res.data;

      } else {

        this.gopList = [];

      }


      this.calculateFinancialOverview();

    } catch (error: any) {

      console.error(
        'Error getting GOP list:',
        error
      );

      this.gopList = [];

      this.calculateFinancialOverview();

      this.toastr.warning(
        error?.message || 'Unable to load GOP deductions.',
        'GOP Warning'
      );

    }

  }


  // ============================================================
  // CALCULATE FINANCIAL OVERVIEW
  // ============================================================

  calculateFinancialOverview(): void {

    /*
     * Calculate GOP deductions
     */

    this.gopDeduction =
      this.gopList.reduce(
        (sum: number, item: any) => {

          return sum + (Number(item.amount) || 0);

        },
        0
      );


    /*
     * Gross Profit
     */

    const grossProfit =
      this.totalIncome - this.totalExpenditure;


    /*
     * Net Operating Profit
     */

    this.nop =
      grossProfit - this.gopDeduction;


    /*
     * Cash at Hand
     *
     * This follows the original logic.
     */

    this.cashAtHand =
      this.totalIncome -
      this.totalExpenditure -
      this.gopDeduction;


    console.log(
      'FINANCIAL OVERVIEW:',
      {
        totalIncome: this.totalIncome,
        totalExpenditure: this.totalExpenditure,
        grossProfit: grossProfit,
        gopDeduction: this.gopDeduction,
        nop: this.nop,
        cashAtHand: this.cashAtHand
      }
    );

  }


  // ============================================================
  // FORMAT CUSTOMER NAME
  // ============================================================

  getCustomerName(item: any): string {

    if (!item) {
      return '-';
    }

    return item.customer || '-';

  }


  // ============================================================
  // FORMAT ATTENDANT
  // ============================================================

  getAttendant(item: any): string {

    if (!item) {
      return '-';
    }

    return (
      item.attendant ||
      item.waiter ||
      '-'
    );

  }


  // ============================================================
  // PRINT
  // ============================================================

  printToPdf(): void {

    const printArea =
      document.getElementById('pdf');


    const printWindow =
      window.open(
        '',
        'PRINT',
        'height=800,width=1000'
      );


    if (!printArea || !printWindow) {

      console.error(
        'Print area or print window not found.'
      );

      return;

    }


    const styles = `

      <style>

        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          color: #333;
        }

        h1, h2, h3, h4, p {
          margin-top: 0;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        table,
        th,
        td {
          border: 1px solid #ddd;
        }

        th,
        td {
          padding: 7px;
          text-align: left;
        }

        th {
          background: #f4f4f4;
          font-weight: bold;
        }

        .table-dark th {
          background: #343a40;
          color: white;
        }

        .font-weight-bold {
          font-weight: bold;
        }

        .footer {
          margin-top: 30px;
        }

        @page {
          size: A4 landscape;
          margin: 10mm;
        }

      </style>

    `;


    printWindow.document.write(`

      <html>

        <head>

          <title>Financial Overview</title>

          ${styles}

        </head>

        <body>

          ${printArea.innerHTML}

        </body>

      </html>

    `);


    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {

      printWindow.print();

      printWindow.close();

    }, 500);

  }


  // ============================================================
  // DOWNLOAD PDF
  // ============================================================

  downloadPdf(): void {

    const printArea =
      document.getElementById('pdf');


    if (!printArea) {

      console.error(
        'Print area not found.'
      );

      this.toastr.error(
        'Report area could not be found.',
        'PDF Error'
      );

      return;

    }


    html2canvas(
      printArea,
      {
        scale: 2,
        useCORS: true
      }
    ).then(
      (canvas: HTMLCanvasElement) => {

        const imgData =
          canvas.toDataURL('image/png');


        const pdf =
          new jsPDF(
            'l',
            'mm',
            'a4'
          );


        const pageWidth = 297;

        const pageHeight = 210;

        const margin = 10;

        const usableWidth =
          pageWidth - (margin * 2);


        const imgHeight =
          canvas.height *
          usableWidth /
          canvas.width;


        let heightLeft =
          imgHeight;


        let position =
          margin;


        pdf.addImage(
          imgData,
          'PNG',
          margin,
          position,
          usableWidth,
          imgHeight
        );


        heightLeft -=
          pageHeight - margin;


        while (heightLeft > 0) {

          position -=
            pageHeight - margin;

          pdf.addPage();

          pdf.addImage(
            imgData,
            'PNG',
            margin,
            position,
            usableWidth,
            imgHeight
          );

          heightLeft -=
            pageHeight - margin;

        }


        pdf.save(
          'financial_overview.pdf'
        );

      }
    ).catch(
      (error: any) => {

        console.error(
          'PDF generation error:',
          error
        );

        this.toastr.error(
          'Unable to generate PDF.',
          'PDF Error'
        );

      }
    );

  }

}