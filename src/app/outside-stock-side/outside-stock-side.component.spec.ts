import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutsideStockSideComponent } from './outside-stock-side.component';

describe('OutsideStockSideComponent', () => {
  let component: OutsideStockSideComponent;
  let fixture: ComponentFixture<OutsideStockSideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OutsideStockSideComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutsideStockSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
