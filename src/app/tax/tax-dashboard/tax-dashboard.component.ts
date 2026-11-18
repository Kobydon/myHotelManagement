import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import Chart from 'chart.js';

import { TaxService } from 'app/tax/tax.service';
import { TaxReportResponse, TaxReportOrder } from 'app/tax/tax.models';

@Component({
  selector: 'app-tax-dashboard',
  templateUrl: './tax-dashboard.component.html',
  styleUrls: ['./tax-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  filterForm!: FormGroup;

  loading = false;
  report: TaxReportResponse | null = null;
  chartViewReady = false;
  taxChart: any = null;
  expandedOrderId: number | null = null;

  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private taxService: TaxService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReport();
  }

  ngAfterViewInit(): void {
    this.chartViewReady = true;
    if (this.report) this.renderChart();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.taxChart) this.taxChart.destroy();
  }

  private initForm(): void {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm = this.fb.group({
      date_from: [this.toISO(firstOfMonth)],
      date_to:   [this.toISO(today)],
      waiter:    [''],
      status:    [''],
    });
  }

  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  loadReport(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const sub = this.taxService.getReport(this.filterForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.report = res;
          if (res.summary?.message) {
            this.toastr.info(res.summary.message, 'Tax Settings');
          }
          this.cdr.detectChanges();
          setTimeout(() => this.renderChart(), 50);
        } else {
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err?.error?.error || 'Failed to load tax report',
          'Error'
        );
        this.cdr.detectChanges();
      },
    });
    this.subs.push(sub);
  }

  resetFilters(): void {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.filterForm.reset({
      date_from: this.toISO(firstOfMonth),
      date_to:   [this.toISO(today)],
      waiter:    '',
      status:    '',
    });
    this.loadReport();
  }

  renderChart(): void {
    const canvas = document.getElementById('taxChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.taxChart) {
      this.taxChart.destroy();
      this.taxChart = null;
    }

    const series = this.report?.monthly_series || [];
    if (!series.length) return;

    this.taxChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: series.map(s => s.month),
        datasets: [
          {
            label: 'Tax Collected (₵)',
            data: series.map(s => s.tax),
            backgroundColor: 'rgba(235, 87, 87, 0.7)',
            borderColor: '#eb5757',
            borderWidth: 1,
          },
          {
            label: 'Gross Sales (₵)',
            data: series.map(s => s.gross),
            backgroundColor: 'rgba(47, 128, 237, 0.5)',
            borderColor: '#2f80ed',
            borderWidth: 1,
            type: 'line' as any,
            fill: false,
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false }, // We use HTML legend instead
        tooltips: {
          callbacks: {
            label: (t: any) =>
              `${t.datasetLabel}: ₵${Number(t.yLabel).toLocaleString('en-GH', {
                minimumFractionDigits: 2,
              })}`,
          },
        },
        scales: {
          yAxes: [
            {
              id: 'y',
              position: 'left',
              ticks: {
                beginAtZero: true,
                callback: (v: any) => '₵' + Number(v).toLocaleString('en-GH'),
              },
              gridLines: { color: '#edf2f7' },
            },
            {
              id: 'y2',
              position: 'right',
              ticks: {
                beginAtZero: true,
                callback: (v: any) => '₵' + Number(v).toLocaleString('en-GH'),
              },
              gridLines: { drawOnChartArea: false },
            },
          ],
          xAxes: [{ gridLines: { display: false } }],
        },
      } as any,
    });
  }

  trackById(_: number, row: TaxReportOrder): number {
    return row.id;
  }

  exportCsv(): void {
    if (!this.report) return;

    const lines: string[] = [];
    lines.push('TAX REPORT');
    lines.push(
      `Period: ${this.filterForm.value.date_from} → ${this.filterForm.value.date_to}`
    );
    lines.push('');
    lines.push('Summary,Metric,Value');
    lines.push(`Orders,${this.report.summary.order_count}`);
    lines.push(`Gross Sales,${this.report.summary.gross_sales}`);
    lines.push(`Net Sales,${this.report.summary.net_sales}`);
    lines.push(`Total Tax,${this.report.summary.total_tax}`);
    lines.push(`Combined Rate %,${this.report.summary.total_tax_pct}`);
    lines.push(
      `Effective Rate %,${this.report.summary.effective_rate.toFixed(2)}`
    );
    lines.push('');
    lines.push('Rate,Breakdown,Code,Rate %,Tax Collected');
    this.report.rate_breakdown.forEach(r => {
      lines.push(`${r.name},${r.short_code},${r.rate},${r.tax_collected}`);
    });
    lines.push('');
    lines.push('Order #,Customer,Waiter,Date,Total,Net,Tax,Status');
    this.report.orders.forEach(o => {
      lines.push(
        `${o.id},${o.customer},${o.waiter},${o.created_at || ''},${o.total},${o.net},${o.tax},${o.status}`
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.toastr.success('Tax report exported', 'Success');
  }
}