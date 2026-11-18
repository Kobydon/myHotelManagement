import { 
  Component, 
  OnInit, 
  ChangeDetectorRef, 
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { TaxService } from 'app/tax/tax.service';
import { TaxRate, TaxConfig } from 'app/tax/tax.models';

@Component({
  selector: 'app-tax-settings',
  templateUrl: './tax-settings.component.html',
  styleUrls: ['./tax-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Performance boost
})
export class TaxSettingsComponent implements OnInit {
  
  // ✅ Grab a reference to the sliding form to scroll to it
  @ViewChild('formContainer') formContainer!: ElementRef;

  /* rates */
  rates: TaxRate[] = [];
  loadingRates = false;
  includeInactive = true;

  /* inline rate form */
  showRateModal = false;
  editingRate: TaxRate | null = null;
  savingRate = false;
  rateForm = {
    name: '',
    short_code: '',
    rate: 0,
    description: '',
    applies_to: 'all',
    is_active: true,
    display_order: 99,
  };

  /* config */
  config: TaxConfig = {
    tax_inclusive: false,
    rounding_mode: 'half_up',
    rounding_places: 2,
    tax_number: '',
    show_tax_on_receipt: true,
  };
  loadingConfig = false;
  savingConfig = false;

  constructor(
    private taxService: TaxService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // ✅ Force form to be closed on page load
    this.showRateModal = false;
    this.editingRate = null;
    
    this.loadRates();
    this.loadConfig();
  }

  /* ---------------- RATES ---------------- */
  loadRates(): void {
    this.loadingRates = true;
    this.cdr.detectChanges();

    this.taxService.getRates(this.includeInactive).subscribe({
      next: (res) => {
        this.loadingRates = false;
        if (res?.success) {
          this.rates = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingRates = false;
        this.toastr.error(
          err?.error?.error || 'Failed to load tax rates',
          'Error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  toggleIncludeInactive(): void {
    this.includeInactive = !this.includeInactive;
    this.loadRates();
  }

  openNewRate(): void {
    this.editingRate = null;
    this.rateForm = {
      name: '',
      short_code: '',
      rate: 0,
      description: '',
      applies_to: 'all',
      is_active: true,
      display_order: this.rates.length + 1,
    };
    this.showRateModal = true;
    this.cdr.detectChanges();

    // ✅ Scroll up to the form smoothly
    setTimeout(() => {
      this.formContainer?.nativeElement?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  editRate(r: TaxRate): void {
    this.editingRate = r;
    this.rateForm = {
      name: r.name,
      short_code: r.short_code,
      rate: r.rate,
      description: r.description || '',
      applies_to: r.applies_to || 'all',
      is_active: r.is_active !== false,
      display_order: r.display_order ?? 99,
    };
    this.showRateModal = true;
    this.cdr.detectChanges();

    // ✅ Scroll up to the form smoothly
    setTimeout(() => {
      this.formContainer?.nativeElement?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  closeRateModal(): void {
    this.showRateModal = false;
    this.editingRate = null;
    this.savingRate = false;
    this.cdr.detectChanges();
  }

  saveRate(): void {
    if (!this.rateForm.name?.trim()) {
      this.toastr.warning('Tax name is required', 'Warning');
      return;
    }
    if (!(this.rateForm.rate >= 0 && this.rateForm.rate <= 100)) {
      this.toastr.warning('Rate must be between 0 and 100', 'Warning');
      return;
    }
    this.savingRate = true;
    this.cdr.detectChanges();

    const payload = { ...this.rateForm };
    const obs = this.editingRate
      ? this.taxService.updateRate(this.editingRate.id, payload)
      : this.taxService.createRate(payload);

    obs.subscribe({
      next: (res) => {
        this.savingRate = false;
        if (res?.success) {
          this.toastr.success(res.message || 'Saved', 'Success');
          this.closeRateModal();
          this.loadRates();
        } else {
          this.toastr.error(res?.error || 'Save failed', 'Error');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.savingRate = false;
        this.toastr.error(err?.error?.error || 'Save failed', 'Error');
        this.cdr.detectChanges();
      },
    });
  }

  deleteRate(r: TaxRate): void {
    if (!confirm(`Delete tax rate "${r.name}"? This cannot be undone.`)) return;

    this.taxService.deleteRate(r.id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toastr.success('Tax rate deleted', 'Success');
          this.loadRates();
        } else {
          this.toastr.error(res?.error || 'Delete failed', 'Error');
        }
      },
      error: (err) => {
        this.toastr.error(err?.error?.error || 'Delete failed', 'Error');
      },
    });
  }

  toggleActive(r: TaxRate): void {
    this.taxService.updateRate(r.id, { is_active: !r.is_active }).subscribe({
      next: () => this.loadRates(),
      error: (err) =>
        this.toastr.error(err?.error?.error || 'Toggle failed', 'Error'),
    });
  }

  /* ---------------- CONFIG ---------------- */
  loadConfig(): void {
    this.loadingConfig = true;
    this.taxService.getConfig().subscribe({
      next: (res) => {
        this.loadingConfig = false;
        if (res?.success && res.data) {
          this.config = res.data;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingConfig = false;
        this.toastr.error(
          err?.error?.error || 'Failed to load tax configuration',
          'Error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  saveConfig(): void {
    this.savingConfig = true;
    this.cdr.detectChanges();

    this.taxService.updateConfig(this.config).subscribe({
      next: (res) => {
        this.savingConfig = false;
        if (res?.success) {
          this.toastr.success('Tax configuration saved', 'Success');
          if (res.data) this.config = res.data;
        } else {
          this.toastr.error(res?.error || 'Save failed', 'Error');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingConfig = false;
        this.toastr.error(err?.error?.error || 'Save failed', 'Error');
        this.cdr.detectChanges();
      },
    });
  }
}