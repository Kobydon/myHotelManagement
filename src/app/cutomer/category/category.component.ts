// category.component.ts (Updated)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

@Component({
  selector: 'category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export class CategoryComponent implements OnInit {

  @BlockUI('loading') loading!: NgBlockUI;
  itemsList: any[] = [];
  categoryList: any[] = [];
  groupList: any[] = [];
  familyList: any[] = [];
  unitList: any[] = [];
  displayStyle = "none";
  header = '';
  page = 1;
  pageSize: number = 100;
  totalAmount: number = 0;
  itemForm!: FormGroup;
  user: any[] = [];

  // Category icons mapping
  private categoryIcons: { [key: string]: string } = {
    'label': '🏷️',
    'labels': '🏷️',
    'large format': '🖼️',
    'large_format': '🖼️',
    'large-format': '🖼️',
    'digital printing': '🖨️',
    'digital_printing': '🖨️',
    'digital-printing': '🖨️',
    'dtf': '👕',
    'dtf printing': '👕',
    'dtf transfer': '👕',
    'default': '📦'
  };

  constructor(
    private fb: FormBuilder,
    private userService: userService,
    private toastr: ToastrService,
    private guestService: GuestService,
    private router: Router
  ) {
    this.itemForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getCategoryList();
  }

  async getCategoryList() {
    try {
      const res = await this.guestService.getCategoryList();
      if (res) {
        this.categoryList = res;
      }
    } catch (error) {
      this.toastr.error('Error fetching category list');
    }
  }

  getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(this.categoryIcons)) {
      if (name.includes(key)) {
        return icon;
      }
    }
    return this.categoryIcons['default'];
  }

  navigateToCategory(category: any) {
    // Navigate to item list with category id
    this.router.navigate(['/customer-item-list', category.id]);
  }

  // Touch feedback handlers
  handleTouchStart(event: TouchEvent) {
    const card = event.currentTarget as HTMLElement;
    const ripple = card.querySelector('.touch-ripple') as HTMLElement;
    if (ripple) {
      const rect = card.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '1';
    }
  }

  handleTouchEnd(event: TouchEvent) {
    const card = event.currentTarget as HTMLElement;
    const ripple = card.querySelector('.touch-ripple') as HTMLElement;
    if (ripple) {
      ripple.style.opacity = '0';
    }
  }
}