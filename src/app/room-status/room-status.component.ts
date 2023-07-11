import { Component, OnInit } from '@angular/core';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';




@Component({
  selector: 'room-status',
  templateUrl: './room-status.component.html',
  styleUrls: ['./room-status.component.css']
})
export class RoomStatusComponent implements OnInit {
  roomForm:FormGroup;
  room_info:any;
  rooms:any;
  displayStyle = "none";
  @BlockUI('loading') loading!: NgBlockUI
  constructor(private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService) { }

  ngOnInit(): void {
    this.getRoom();
  }


  async getRoom(){
    try{
      this.loading.start();
     var res = await this.roomService.getrooms()
     if(res) this.rooms =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }
}





openPopup() {

  // this.header ="Add Room";

  this.displayStyle = "block";

}



closePopup() {
  this.displayStyle = "none";
}


}


