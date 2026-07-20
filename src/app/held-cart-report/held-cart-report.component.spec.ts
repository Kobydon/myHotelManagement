import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeldCartReportComponent } from './held-cart-report.component';

describe('HeldCartReportComponent', () => {
  let component: HeldCartReportComponent;
  let fixture: ComponentFixture<HeldCartReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeldCartReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeldCartReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
