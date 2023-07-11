import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './list/list.component';
import { errorMonitor } from 'events';
import { RoomViewComponent } from './room-view/room-view.component';
import { LayoutComponent } from './layout/layout.component';
import { CustomReservationComponent } from './custom-reservation/custom-reservation.component';
import { TrackReservationComponent } from './track-reservation/track-reservation.component';

const routes: Routes = [

    
  { path: 'home',      component: LayoutComponent ,
  children: [

       
  { path: 'features',      component: ListComponent },
  { path: 'room-view',      component: RoomViewComponent },
  { path: 'custom-reserve',      component: CustomReservationComponent },
  { path: 'track-reservation',      component: TrackReservationComponent }



  ]
}
 
   
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeaturesRoutingModule { }
