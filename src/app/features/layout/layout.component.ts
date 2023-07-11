import { Component, OnInit } from '@angular/core';
import { routeAnimations } from 'app/shared/animation';
import { userService } from 'app/user.service';

@Component({
  selector: 'layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  animations: [routeAnimations]
})
export class LayoutComponent implements OnInit {

  constructor(private userService:userService) { }

  ngOnInit(): void {
  }

  logOut(){
    this.userService.logout();
  }
}
