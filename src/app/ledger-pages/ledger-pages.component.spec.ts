import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerPagesComponent } from './ledger-pages.component';

describe('LedgerPagesComponent', () => {
  let component: LedgerPagesComponent;
  let fixture: ComponentFixture<LedgerPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LedgerPagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
