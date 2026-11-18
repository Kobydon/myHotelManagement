import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundlePackagesComponent } from './bundle-packages.component';

describe('BundlePackagesComponent', () => {
  let component: BundlePackagesComponent;
  let fixture: ComponentFixture<BundlePackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BundlePackagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundlePackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
