import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemListVipComponent } from './item-list-vip.component';

describe('ItemListVipComponent', () => {
  let component: ItemListVipComponent;
  let fixture: ComponentFixture<ItemListVipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemListVipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemListVipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
