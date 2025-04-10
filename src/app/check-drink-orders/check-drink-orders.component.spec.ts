import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckDrinkOrdersComponent } from './check-drink-orders.component';

describe('CheckDrinkOrdersComponent', () => {
  let component: CheckDrinkOrdersComponent;
  let fixture: ComponentFixture<CheckDrinkOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckDrinkOrdersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckDrinkOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
