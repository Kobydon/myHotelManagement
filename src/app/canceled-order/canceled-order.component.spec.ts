import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanceledOrderComponent } from './canceled-order.component';

describe('CanceledOrderComponent', () => {
  let component: CanceledOrderComponent;
  let fixture: ComponentFixture<CanceledOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CanceledOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanceledOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
