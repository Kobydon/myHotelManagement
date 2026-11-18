
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  TaxRate,
  TaxConfig,
  TaxReportFilters,
  TaxReportResponse
} from './tax.models';

@Injectable({
  providedIn: 'root'
})
export class TaxService {

  private apiUrl = 'https://renderdemo-pnzm.onrender.com';

  constructor(private http: HttpClient) {}

  // Get the same token saved by userService.setSession()
  private getHeaders(): HttpHeaders {

    const token = localStorage.getItem('id_token');

    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==============================
  // TAX RATES
  // ==============================

  getRates(includeInactive = false): Observable<any> {

    const params = new HttpParams()
      .set('include_inactive', String(includeInactive));

    return this.http.get(
      `${this.apiUrl}/guest/tax_rates`,
      {
        headers: this.getHeaders(),
        params
      }
    );
  }

  createRate(payload: Partial<TaxRate>): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/guest/tax_rates`,
      payload,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateRate(id: number, payload: Partial<TaxRate>): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/guest/tax_rates/${id}`,
      payload,
      {
        headers: this.getHeaders()
      }
    );
  }

  deleteRate(id: number): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/guest/tax_rates/${id}`,
      {
        headers: this.getHeaders()
      }
    );
  }

  // ==============================
  // TAX CONFIGURATION
  // ==============================

  getConfig(): Observable<any> {

    return this.http.get(
      `${this.apiUrl}/guest/tax_config`,
      {
        headers: this.getHeaders()
      }
    );
  }

  updateConfig(payload: Partial<TaxConfig>): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/guest/tax_config`,
      payload,
      {
        headers: this.getHeaders()
      }
    );
  }

  // ==============================
  // TAX REPORT
  // ==============================

  getReport(filters: TaxReportFilters): Observable<TaxReportResponse> {

    let params = new HttpParams();

    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }

    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }

    if (filters.waiter) {
      params = params.set('waiter', filters.waiter);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<TaxReportResponse>(
      `${this.apiUrl}/guest/tax_report`,
      {
        headers: this.getHeaders(),
        params
      }
    );
  }
}
