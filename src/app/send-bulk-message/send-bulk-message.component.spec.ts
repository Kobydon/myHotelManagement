import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendBulkMessageComponent } from './send-bulk-message.component';

describe('SendBulkMessageComponent', () => {
  let component: SendBulkMessageComponent;
  let fixture: ComponentFixture<SendBulkMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendBulkMessageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendBulkMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
