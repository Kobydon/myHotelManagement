import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckTodaysOrdersComponent } from './check-todays-orders.component';

describe('CheckTodaysOrdersComponent', () => {
  let component: CheckTodaysOrdersComponent;
  let fixture: ComponentFixture<CheckTodaysOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckTodaysOrdersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckTodaysOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
