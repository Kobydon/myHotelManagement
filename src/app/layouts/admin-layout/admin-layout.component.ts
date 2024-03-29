import { Component, OnInit } from '@angular/core';
import { routeAnimations } from 'app/shared/animation';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
  group
  // ...
} from '@angular/animations';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  animations: [
    trigger('routeAnim', [
      transition('* <=> *', [    
        query(':enter, :leave', style({ position: 'fixed', width:'100%' })),


        group([ 
          query(':enter', [
            style({ transform: 'translateX(100%)' }),
            animate('0.8s ease-in-out', style({ transform: 'translateX(0%)' }))
          ]),
          query(':leave', [
            style({ transform: 'translateX(0%)' }),
            animate('0.8s ease-in-out', style({ transform: 'translateX(-100%)' }))]),
        ])
      ])
    ])
   ],

})
export class AdminLayoutComponent implements OnInit {

  ngOnInit() { }

  prepareRoute(outlet:RouterOutlet){
    return outlet.activatedRoute.snapshot.url
  }
}
