import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';
import { Router } from '@angular/router';

@Component({
  selector: 'category-list',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {
  categoryList:any;
  constructor(private guestService:GuestService,private router:Router) { }

  ngOnInit(): void {
    this.getCategoryList();
  }

  
  
  navigateToEvent(id: string) {
    // Prevents the row click from triggering other actions
       this.router.navigate(['/item-category-list', id]);
     }
   
  async getCategoryList() {
    try {
      // this.loading.start();
      const res = await this.guestService.getCategoryList(); // Assuming getItemsList() fetches the items from the API
      if (res) {
        this.categoryList = res;
      }
    } catch (error) {
      // this.toastr.error('Error fetching category list');
    } finally {
      // this.loading.stop();
    }
  }


}
