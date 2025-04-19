import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEventPaymentComponent } from './add-event-payment.component';

describe('AddEventPaymentComponent', () => {
  let component: AddEventPaymentComponent;
  let fixture: ComponentFixture<AddEventPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEventPaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEventPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
