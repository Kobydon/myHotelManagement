import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodaysFoodChefComponent } from './todays-food-chef.component';

describe('TodaysFoodChefComponent', () => {
  let component: TodaysFoodChefComponent;
  let fixture: ComponentFixture<TodaysFoodChefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TodaysFoodChefComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodaysFoodChefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
