import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeaturesRoutingModule } from './features-routing.module';
import { LayoutComponent } from './layout/layout.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RoomViewComponent } from './room-view/room-view.component';
import { RouterModule } from '@angular/router';
import { ListComponent } from './list/list.component';
import { CustomReservationComponent } from './custom-reservation/custom-reservation.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BlockUI, BlockUIModule } from 'ng-block-ui';
import { LoadingTemplate } from 'app/loading-template';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SignupComponent } from './signup/signup.component';
import { TrackReservationComponent } from './track-reservation/track-reservation.component';
import { TodoListComponent } from 'app/todo-list/todo-list.component';


@NgModule({
  declarations: [
    LayoutComponent,
    RoomViewComponent,
    ListComponent,
    CustomReservationComponent,
    TrackReservationComponent,


  ],
  imports: [
    CommonModule,

    FeaturesRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CommonModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    BlockUIModule.forRoot({
    
      template: LoadingTemplate ,
      delayStart: 50,
      delayStop: 300
    })
 

  ]
})
export class FeaturesModule { }
