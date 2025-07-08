import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'print-vorcher',
  templateUrl: './print-vorcher.component.html',
  styleUrls: ['./print-vorcher.component.css']
})
export class PrintVorcherComponent implements OnInit {
  purchases: any[] = [];
  cartId: number | null = null;
  errorMessage: string = '';
  searched = false;
  today = new Date();

  constructor(private guestService: GuestService) {}

  ngOnInit(): void {}

  loadVoucher(): void {
    if (!this.cartId) {
      this.errorMessage = 'Please enter a valid Cart ID.';
      return;
    }

    this.errorMessage = '';
    this.searched = false;

    this.guestService.getPurchaseRequestsByCartId(this.cartId).subscribe(
      (data) => {
        this.purchases = data;
        this.searched = true;
      },
      (error) => {
        this.errorMessage = 'Error fetching data or no results found.';
        this.purchases = [];
        this.searched = true;
      }
    );
  }

  getTotalCost(): number {
    return this.purchases.reduce((acc, item) => acc + Number(item.total_cost || 0), 0);
  }

printVoucher(): void {
  const printContents = document.getElementById('printSection')?.innerHTML;
  if (!printContents) return;

  const popupWin = window.open('', '_blank', 'width=800,height=600');
  if (popupWin) {
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Print Voucher</title>
          <style>
            body {
              font-family: 'Segoe UI', sans-serif;
              padding: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }

            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
            }

            .table-success th {
              background-color: #c8e6c9;
            }

            .text-right {
              text-align: right;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    popupWin.document.close();
  }
}

}
