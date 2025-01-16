import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountReceivablePagesComponent } from './account-receivable-pages.component';

describe('AccountReceivablePagesComponent', () => {
  let component: AccountReceivablePagesComponent;
  let fixture: ComponentFixture<AccountReceivablePagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountReceivablePagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountReceivablePagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
