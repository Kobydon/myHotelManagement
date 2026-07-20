import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLabelOrderComponent } from './view-label-order.component';

describe('ViewLabelOrderComponent', () => {
  let component: ViewLabelOrderComponent;
  let fixture: ComponentFixture<ViewLabelOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewLabelOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLabelOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
