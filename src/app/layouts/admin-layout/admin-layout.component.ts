import { Component, OnInit } from '@angular/core';
import { routeAnimations } from 'app/shared/animation';


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  animations: [routeAnimations]
})
export class AdminLayoutComponent implements OnInit {

  ngOnInit() { }
}
