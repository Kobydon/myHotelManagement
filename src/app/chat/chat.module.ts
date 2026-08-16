// chat.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat.component';
import { FilterPipe } from 'filter.pipe';


@NgModule({
  declarations: [
    ChatComponent,
    FilterPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ChatComponent
  ]
})
export class ChatModule { }