import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GopDeductionComponent } from './gop-deduction.component';

describe('GopDeductionComponent', () => {
  let component: GopDeductionComponent;
  let fixture: ComponentFixture<GopDeductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GopDeductionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GopDeductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
