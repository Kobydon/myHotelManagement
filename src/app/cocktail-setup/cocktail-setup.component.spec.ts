import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CocktailSetupComponent } from './cocktail-setup.component';

describe('CocktailSetupComponent', () => {
  let component: CocktailSetupComponent;
  let fixture: ComponentFixture<CocktailSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CocktailSetupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CocktailSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
