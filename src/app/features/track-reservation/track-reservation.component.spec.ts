import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackReservationComponent } from './track-reservation.component';

describe('TrackReservationComponent', () => {
  let component: TrackReservationComponent;
  let fixture: ComponentFixture<TrackReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackReservationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
