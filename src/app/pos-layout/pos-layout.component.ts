// pos-layout.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'pos-layout',
  templateUrl: './pos-layout.component.html',
  styleUrls: ['./pos-layout.component.css']
})
export class PosLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  // Optional: Method to toggle chat if needed
  toggleChat() {
    // You can add logic here if you want to control chat from parent
  }
}