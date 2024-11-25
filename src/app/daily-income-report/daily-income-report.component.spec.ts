import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyIncomeReportComponent } from './daily-income-report.component';

describe('DailyIncomeReportComponent', () => {
  let component: DailyIncomeReportComponent;
  let fixture: ComponentFixture<DailyIncomeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyIncomeReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyIncomeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
