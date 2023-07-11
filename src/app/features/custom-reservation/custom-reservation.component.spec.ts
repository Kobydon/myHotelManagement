import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomReservationComponent } from './custom-reservation.component';

describe('CustomReservationComponent', () => {
  let component: CustomReservationComponent;
  let fixture: ComponentFixture<CustomReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomReservationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
