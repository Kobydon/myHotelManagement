import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialOverviewComponent } from './financial-overview.component';

describe('FinancialOverviewComponent', () => {
  let component: FinancialOverviewComponent;
  let fixture: ComponentFixture<FinancialOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinancialOverviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
