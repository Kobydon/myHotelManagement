import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewUvDtfComponent } from './view-uv-dtf.component';

describe('ViewUvDtfComponent', () => {
  let component: ViewUvDtfComponent;
  let fixture: ComponentFixture<ViewUvDtfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewUvDtfComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewUvDtfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
