import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailedSummaryTwoComponent } from './detailed-summary-two.component';

describe('DetailedSummaryTwoComponent', () => {
  let component: DetailedSummaryTwoComponent;
  let fixture: ComponentFixture<DetailedSummaryTwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailedSummaryTwoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailedSummaryTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
