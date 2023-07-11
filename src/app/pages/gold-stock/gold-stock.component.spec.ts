import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoldStockComponent } from './gold-stock.component';

describe('GoldStockComponent', () => {
  let component: GoldStockComponent;
  let fixture: ComponentFixture<GoldStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoldStockComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoldStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
