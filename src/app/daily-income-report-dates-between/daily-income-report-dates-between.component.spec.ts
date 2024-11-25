import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyIncomeReportDatesBetweenComponent } from './daily-income-report-dates-between.component';

describe('DailyIncomeReportDatesBetweenComponent', () => {
  let component: DailyIncomeReportDatesBetweenComponent;
  let fixture: ComponentFixture<DailyIncomeReportDatesBetweenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DailyIncomeReportDatesBetweenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyIncomeReportDatesBetweenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
