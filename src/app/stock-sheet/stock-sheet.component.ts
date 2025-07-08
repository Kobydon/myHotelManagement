import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'stock-sheet',
  templateUrl: './stock-sheet.component.html',
  styleUrls: ['./stock-sheet.component.css']
})
export class StockSheetComponent implements OnInit {
  columns = [
    'op_stk_1', 'recvd_1', 'trsf_in_1', 'trsf_out_1', 'sold_1', 'spoilage_1', 'cl_stk_1', 'var_1',
    'op_stk_2', 'recvd_2', 'trsf_in_2', 'trsf_out_2', 'sold_2', 'spoilage_2', 'cl_stk_2', 'var_2'
  ];

  stockData: any[] = [];

  constructor(private stockService: GuestService) {}

  async ngOnInit() {
    try {
      this.stockData = await this.stockService.getStockItems();
    } catch (err) {
      console.error('Error fetching stock items:', err);
    }
  }
}
