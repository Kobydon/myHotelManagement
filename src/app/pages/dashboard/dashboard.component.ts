import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';

import { FormBuilder,FormControlName,FormGroup, Validators } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { error } from 'console';
import { PaymentService } from 'app/services/payment.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';


@Component({
    selector: 'dashboard-cmp',
    moduleId: module.id,
    templateUrl: 'dashboard.component.html'
})

export class DashboardComponent implements OnInit{
  constructor(private toastr:ToastrService,private fb: FormBuilder,private http:HttpClient,
    private roomService:RoomService,private guestService:GuestService,private paymentService:PaymentService) { }
  page = 1;
  pageSize: number = 16;
  rooms:any;
  @BlockUI('loading') loading!: NgBlockUI
  public canvas : any;
  public ctx;
  public chartColor;
  public chartEmail;
  public chartHours;
  bookings:any;
  paymentList:any;
  guestList:any;
  interval:any;
  usdRate: number;
  gbpRate: number;
  eurRate: number;
  ghsRate: number;
  exchangeInterval:any;
    ngOnInit(){
   
      
      this.exchangeInterval= setInterval(()=>{
        this.getExchangeRates();

      },1000);
      this.getGust();

    
      this.interval= setInterval(()=>{
        this.getBookingList();

      },1000);
    
    this.getRoom();
    this.getPaymentList();
    // this.getBookingList();
      this.chartColor = "#FFFFFF";

      this.canvas = document.getElementById("chartHours");
      this.ctx = this.canvas.getContext("2d");

      this.chartHours = new Chart(this.ctx, {
        type: 'line',

        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
          datasets: [{
              borderColor: "#6bd098",
              backgroundColor: "#6bd098",
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 3,
              data: [300, 310, 316, 322, 330, 326, 333, 345, 338, 354]
            },
            {
              borderColor: "#f17e5d",
              backgroundColor: "#f17e5d",
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 3,
              data: [320, 340, 365, 360, 370, 385, 390, 384, 408, 420]
            },
            {
              borderColor: "#fcc468",
              backgroundColor: "#fcc468",
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 3,
              data: [370, 394, 415, 409, 425, 445, 460, 450, 478, 484]
            }
          ]
        },
        options: {
          legend: {
            display: false
          },

          tooltips: {
            enabled: false
          },

          scales: {
            yAxes: [{

              ticks: {
                fontColor: "#9f9f9f",
                beginAtZero: false,
                maxTicksLimit: 5,
                //padding: 20
              },
              gridLines: {
                drawBorder: false,
                zeroLineColor: "#ccc",
                color: 'rgba(255,255,255,0.05)'
              }

            }],

            xAxes: [{
              barPercentage: 1.6,
              gridLines: {
                drawBorder: false,
                color: 'rgba(255,255,255,0.1)',
                zeroLineColor: "transparent",
                display: false,
              },
              ticks: {
                padding: 20,
                fontColor: "#9f9f9f"
              }
            }]
          },
        }
      });


      this.canvas = document.getElementById("chartEmail");
      this.ctx = this.canvas.getContext("2d");
      this.chartEmail = new Chart(this.ctx, {
        type: 'pie',
        data: {
          labels: [1, 2, 3],
          datasets: [{
            label: "Emails",
            pointRadius: 0,
            pointHoverRadius: 0,
            backgroundColor: [
              '#e3e3e3',
              '#4acccd',
              '#fcc468',
              '#ef8157'
            ],
            borderWidth: 0,
            data: [342, 480, 530, 120]
          }]
        },

        options: {

          legend: {
            display: false
          },

          pieceLabel: {
            render: 'percentage',
            fontColor: ['white'],
            precision: 2
          },

          tooltips: {
            enabled: false
          },

          scales: {
            yAxes: [{

              ticks: {
                display: false
              },
              gridLines: {
                drawBorder: false,
                zeroLineColor: "transparent",
                color: 'rgba(255,255,255,0.05)'
              }

            }],

            xAxes: [{
              barPercentage: 1.6,
              gridLines: {
                drawBorder: false,
                color: 'rgba(255,255,255,0.1)',
                zeroLineColor: "transparent"
              },
              ticks: {
                display: false,
              }
            }]
          },
        }
      });

      var speedCanvas = document.getElementById("speedChart");

      var dataFirst = {
        data: [0, 19, 15, 20, 30, 40, 40, 50, 25, 30, 50, 70],
        fill: false,
        borderColor: '#fbc658',
        backgroundColor: 'transparent',
        pointBorderColor: '#fbc658',
        pointRadius: 4,
        pointHoverRadius: 4,
        pointBorderWidth: 8,
      };

      var dataSecond = {
        data: [0, 5, 10, 12, 20, 27, 30, 34, 42, 45, 55, 63],
        fill: false,
        borderColor: '#51CACF',
        backgroundColor: 'transparent',
        pointBorderColor: '#51CACF',
        pointRadius: 4,
        pointHoverRadius: 4,
        pointBorderWidth: 8
      };

      var speedData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [dataFirst, dataSecond]
      };

      var chartOptions = {
        legend: {
          display: false,
          position: 'top'
        }
      };

      var lineChart = new Chart(speedCanvas, {
        type: 'line',
        hover: false,
        data: speedData,
        options: chartOptions
      });
    }


    async getPaymentList(){
      try{
        // this.loading.start();
       var res = await this.paymentService.getPayment()
       if(res) this.paymentList =res;
  
      }
      catch(error:any){
        // this.toastr.error(null,error);
      }
       
    
    finally{
      // this.loading.stop();
    }
  }


  canGlow(departureDate: string): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHours = now.getHours();

    return departureDate === today && currentHours >= 12;
  }

  checkout(itemId: number): void {
    console.log(`Checked out booking with ID: ${itemId}`);
    // Add your checkout logic here
  }

  getExchangeRates() {
    const apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD'; // Alternative API
  
    this.http.get<any>(apiUrl).subscribe(
      data => {
        if (data && data.rates) {
          this.usdRate = data.rates.USD || 1;
          this.gbpRate = data.rates.GBP;
          this.eurRate = data.rates.EUR;
          this.ghsRate = data.rates.GHS;
          console.log("Exchange Rates:", data.rates);
        } else {
          console.warn("Unexpected API response:", data);
        }
      },
      (error: HttpErrorResponse) => {
        console.error("Failed to fetch exchange rates:", error);
        if (error.status === 0) {
          console.error("Network or CORS issue. Ensure the API endpoint is accessible.");
        }
      }
    );
  }
  
    async getBookingList(){
      try{
        // this.loading.start();
       var res = await this.roomService.getBookingListNew()
       if(res) this.bookings =res;
  
      }
      catch(error:any){
        // this.toastr.error(null,error);
      }
       
    
    finally{
      // this.loading.stop();
    }
  }


  async checkOut(id:any){


    try{
      this.loading.start();
       
  
  
       var res= await this.guestService.checkout(id)
            // this.toastr.success(null,"successfully updated profile
            if(res)  this.getBookingList();
  
    }
    catch(error:any){
      this.toastr.info(null,"kindly pay all pending bills  before checkout")
    }
   finally{
    this.loading.stop();
  
   }
  
  }
         


  async getRoom(){
    try{
      // this.loading.start();
     var res = await this.roomService.getrooms()
     if(res) this.rooms =res;

    }
    catch(error:any){
      // this.toastr.error(null,error);
    }
     
  
  finally{
    // this.loading.stop();
  }
}


async getGust(){
  try{
    // this.loading.start();
   var res = await this.guestService.getGuests()
   if(res) this.guestList =res;

  }
  catch(error:any){
    // this.toastr.error(null,error);
  }
   

finally{
  // this.loading.stop();
}
}



}
