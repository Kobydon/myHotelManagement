export interface TaxRate {
  id: number;
  name: string;
  short_code: string;
  rate: number;
  description?: string;
  is_active: boolean;
  is_default?: boolean;
  applies_to: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaxConfig {
  id?: number;
  tax_inclusive: boolean;
  rounding_mode: 'half_up' | 'floor' | 'ceil';
  rounding_places: number;
  tax_number: string;
  show_tax_on_receipt: boolean;
  updated_at?: string;
}

export interface TaxRateBreakdown {
  id: number;
  name: string;
  short_code: string;
  rate: number;
  tax_collected: number;
}

export interface TaxReportSummary {
  order_count: number;
  gross_sales: number;
  net_sales: number;
  total_tax: number;
  total_tax_pct: number;
  effective_rate: number;
  message?: string;
}

export interface TaxReportOrder {
  id: number;
  customer: string;
  waiter: string;
  created_at: string | null;
  total: number;
  net: number;
  tax: number;
  status: string;
}

export interface TaxMonthlySeries {
  month: string;
  gross: number;
  tax: number;
}

export interface TaxReportResponse {
  success: boolean;
  config: TaxConfig;
  rates: TaxRate[];
  summary: TaxReportSummary;
  rate_breakdown: TaxRateBreakdown[];
  monthly_series: TaxMonthlySeries[];
  orders: TaxReportOrder[];
}

export interface TaxReportFilters {
  date_from?: string;
  date_to?: string;
  waiter?: string;
  status?: string;
}