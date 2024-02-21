import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResLayoutComponent } from './res-layout.component';

describe('ResLayoutComponent', () => {
  let component: ResLayoutComponent;
  let fixture: ComponentFixture<ResLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
