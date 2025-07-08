import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintVorcherComponent } from './print-vorcher.component';

describe('PrintVorcherComponent', () => {
  let component: PrintVorcherComponent;
  let fixture: ComponentFixture<PrintVorcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintVorcherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintVorcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
