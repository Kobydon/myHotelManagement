import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemListCategoryComponent } from './item-list-category.component';

describe('ItemListCategoryComponent', () => {
  let component: ItemListCategoryComponent;
  let fixture: ComponentFixture<ItemListCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemListCategoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemListCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
