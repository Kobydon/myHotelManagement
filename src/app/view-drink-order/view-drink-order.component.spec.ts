import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDrinkOrderComponent } from './view-drink-order.component';

describe('ViewDrinkOrderComponent', () => {
  let component: ViewDrinkOrderComponent;
  let fixture: ComponentFixture<ViewDrinkOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewDrinkOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDrinkOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
