import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiversTabComponent } from './givers-tab.component';

describe('GiversTabComponent', () => {
  let component: GiversTabComponent;
  let fixture: ComponentFixture<GiversTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GiversTabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiversTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
