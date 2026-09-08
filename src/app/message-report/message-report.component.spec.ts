import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageReportComponent } from './message-report.component';

describe('MessageReportComponent', () => {
  let component: MessageReportComponent;
  let fixture: ComponentFixture<MessageReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
