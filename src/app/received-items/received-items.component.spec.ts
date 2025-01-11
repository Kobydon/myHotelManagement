import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedItemsComponent } from './received-items.component';

describe('ReceivedItemsComponent', () => {
  let component: ReceivedItemsComponent;
  let fixture: ComponentFixture<ReceivedItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceivedItemsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
