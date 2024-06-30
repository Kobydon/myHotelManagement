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
        query(':enter, :leave', style({ position: 'fixed', width: '100%' })),
        group([
          query(':enter', [
            style({ transform: 'scale(0)' }),
            animate('0.6s', style({ transform: 'scale(1)' }))
          ], { optional: true }),
          query(':leave', [
            animate('0.1s', style({ opacity: 0 }))
          ])
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
