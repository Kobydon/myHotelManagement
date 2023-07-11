import { Component, OnInit } from '@angular/core';

import { userService } from 'app/user.service';
import { lastValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';

@Component({
  selector: 'room-view',
  templateUrl: './room-view.component.html',
  styleUrls: ['./room-view.component.css']
})
export class RoomViewComponent implements OnInit {
  rooms:any;
base64_string:any;

page = 1;
pageSize: number = 10;

@BlockUI('loading') loading!: NgBlockUI;

  constructor(private userService:userService,private toastr:ToastrService,private fb: FormBuilder,
    private roomService:RoomService) { }

  ngOnInit(): void {
    this.getRoomType();
  }

  async getRoomType(){
    try{
      this.loading.start();
     var res = await this.roomService.getroomType()
     if(res) this.rooms =res;

    }
    catch(error:any){
      this.toastr.error(null,error);
    }
     
  
  finally{
    this.loading.stop();
  }
}


}

