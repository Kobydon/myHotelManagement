// customer-layout.component.ts (updated with toggle logic)
import { Component, OnInit } from '@angular/core';
import { userService } from 'app/user.service';

@Component({
  selector: 'customer-layout',
  templateUrl: './customer-layout.component.html',
  styleUrls: ['./customer-layout.component.css']
})
export class CustomerLayoutComponent implements OnInit {
  constructor(private userService: userService) { }

  ngOnInit(): void {
    // ensure mobile menu is hidden on load (css handles)
  }

  // toggle mobile nav
  toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.classList.toggle('mobile-open');
    }
  }

  logout() {
    this.userService.logout();
  }
}