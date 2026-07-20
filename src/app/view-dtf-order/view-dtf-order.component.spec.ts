import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDtfOrderComponent } from './view-dtf-order.component';

describe('ViewDtfOrderComponent', () => {
  let component: ViewDtfOrderComponent;
  let fixture: ComponentFixture<ViewDtfOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewDtfOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDtfOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
