import { Component, OnInit } from '@angular/core';
import { CartService } from 'app/cart.service';
import { GuestService } from 'app/services/guest.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'cocktail-setup',
  templateUrl: './cocktail-setup.component.html',
  styleUrls: ['./cocktail-setup.component.css']
})
export class CocktailSetupComponent implements OnInit {

  itemsList: any[] = [];

  // cocktail setup
  cocktailItemId!: number;
  ingredients: any[] = [];
  isEdit = false;
  loading = false;

  constructor(
    private guestService: GuestService,
    private cartService: CartService,
    private toastr: ToastrService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.fetchData();
  }

  private async fetchData() {
    await Promise.all([
      this.getItemsList()
    ]);
  }

  async getItemsList() {
    try {
      const res = await this.guestService.getItemsList();
      if (res) this.itemsList = res;
    } catch {
      this.toastr.error('Error fetching items list');
    }
  }

  /* ================================
     LOAD COCKTAIL (EDIT MODE)
  ================================= */

  async loadSetup(cocktailId: number) {
    if (!cocktailId) return;

    this.loading = true;
    this.cocktailItemId = cocktailId;

    try {
      const res = await this.guestService.getCocktailSetup(cocktailId);

      this.ingredients = res || [];
      this.isEdit = this.ingredients.length > 0;

      if (!this.isEdit) {
        this.ingredients = [];
      }
    } catch {
      this.toastr.error('Failed to load cocktail setup');
    } finally {
      this.loading = false;
    }
  }

  /* ================================
     INGREDIENT CONTROLS
  ================================= */

  addIngredient() {
    this.ingredients.push({
      ingredient_item_id: null,
      quantity: 1,
      unit: 'shots'
    });
  }

  removeIngredient(index: number) {
    this.ingredients.splice(index, 1);
  }

  /* ================================
     SAVE / UPDATE SETUP
  ================================= */

  async saveSetup() {
    if (!this.cocktailItemId) {
      this.toastr.warning('Please select a cocktail');
      return;
    }

    if (this.ingredients.length === 0) {
      this.toastr.warning('Add at least one ingredient');
      return;
    }

    const payload = {
      cocktail_setup: this.ingredients
    };

    try {
      await this.guestService.updateCocktailSetup(
        this.cocktailItemId,
        payload
      );

      this.isEdit = true;
      this.toastr.success(
        this.isEdit ? 'Cocktail setup updated' : 'Cocktail setup saved'
      );
    } catch {
      this.toastr.error('Failed to save cocktail setup');
    }
  }

  /* ================================
     HELPERS
  ================================= */

 get cocktails() {
  return this.itemsList.filter(i =>
    i.category && i.category.toLowerCase().includes('cocktail')
  );
}

}
