import { Component, OnInit, AfterViewInit } from '@angular/core';
import { userService } from 'app/user.service';

export interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

// Keep your ROUTES array here...
export const ROUTES: RouteInfo[] = [
  // Your routes...
];

@Component({
  moduleId: module.id,
  selector: 'sidebar-cmp',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, AfterViewInit {

  user: any;
  menuItems: RouteInfo[] = [];

  constructor(private userService: userService) { }

  async ngOnInit(): Promise<void> {
    this.menuItems = ROUTES;
    await this.getUser();
  }

  ngAfterViewInit(): void {
    this.initializeDropdowns();
  }

  async getUser() {
    try {
      this.user = await this.userService.getUser();
    } catch (err) {
      console.error(err);
    }
  }

  private initializeDropdowns(): void {

    // Parent dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-toggle');

    dropdowns.forEach((dropdown: any) => {

      dropdown.addEventListener('click', (e: Event) => {

        e.preventDefault();

        const target = dropdown.getAttribute('data-target');

        if (!target) {
          return;
        }

        const container = document.getElementById(target);

        if (container) {
          container.classList.toggle('active');
        }

        const arrow = dropdown.querySelector('.dropdown-arrow');

        if (arrow) {
          arrow.classList.toggle('rotate-caret');
        }

      });

    });

    // Child dropdowns
    const childDropdowns = document.querySelectorAll('.dropdown-toggle-child');

    childDropdowns.forEach((dropdown: any) => {

      dropdown.addEventListener('click', (e: Event) => {

        e.preventDefault();
        e.stopPropagation();

        const target = dropdown.getAttribute('data-target');

        if (!target) {
          return;
        }

        const container = document.getElementById(target);

        if (container) {
          container.classList.toggle('active');
        }

        const arrow = dropdown.querySelector('.dropdown-arrow');

        if (arrow) {
          arrow.classList.toggle('rotate-caret');
        }

      });

    });

  }

  myFunctionside(): void {

    const input = document.getElementById('myInputside') as HTMLInputElement;

    if (!input) {
      return;
    }

    const filter = input.value.toUpperCase();

    const ul = document.getElementById('navlink');

    if (!ul) {
      return;
    }

    const li = ul.getElementsByTagName('li');

    for (let i = 0; i < li.length; i++) {

      const a = li[i].getElementsByTagName('a')[0];

      if (!a) {
        continue;
      }

      const txtValue = a.textContent || a.innerText;

      li[i].style.display =
        txtValue.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
    }

  }

}