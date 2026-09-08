import { Component, OnInit,AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import Chart from 'chart.js';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder } from '@angular/forms';
import { RoomService } from 'app/services/rooms.service';
import { GuestService } from 'app/services/guest.service';
import { PaymentService } from 'app/services/payment.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { userService } from 'app/user.service';

@Component({
  selector: 'dashboard-cmp',
  moduleId: module.id,
  templateUrl: 'dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  constructor(
    private toastr: ToastrService,
    private fb: FormBuilder,
    private http: HttpClient,
    private roomService: RoomService,
    private guestService: GuestService,
    private paymentService: PaymentService,
    private userService:userService
  ) {}
chartViewReady = false;
  page = 1;
  pageSize: number = 16;
  rooms: any;
  @BlockUI('loading') loading!: NgBlockUI;
  public canvas: any;
  public ctx;
  public paymentChart: any;
  paymentList: any;
  monthlyPayments: { [month: string]: number } = {};
  months: string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
  bookings:any;
  // paymentList:any;
  guestList:any;
  interval:any;
  usdRate: number;
  gbpRate: number;
  eurRate: number;
  ghsRate: number;
  exchangeInterval:any;
  user:any;

  ngOnInit() {
    this.getPaymentList();
    // this.exchangeInterval= setInterval(()=>{
    //   this.getExchangeRates();

    // },7000);
    this.getGust();

  
    // this.interval= setInterval(()=>{
    //   this.getBookingList();

    // },1000);
    this.getRoom();
    this.getUser();
  
  }
 async getUser() {
  try {

    const res = await this.userService.getUser();

    if (res) {
      this.user = res;
    }

  } catch (err) {

    console.log(err);

  }
}
  // ngOnChanges(changes: SimpleChanges) {
  //   // Make sure the chart initializes when the roles change and conditions are satisfied.
  //   if (changes.user && (this.user[0]?.roles === 'admin' || this.user[0]?.roles === 'auditor')) {
  //     this.initializePaymentChart();
  //   }
  // }

ngAfterViewInit() {

  this.chartViewReady = true;

  // Only create chart if payment data has already loaded
  if (this.paymentList && this.paymentList.length > 0) {
    this.initializePaymentChart();
  }

}
async getPaymentList() {

  try {

    const res: any = await this.guestService.getIncomeList();

    console.log('================================');
    console.log('INCOME API RESPONSE');
    console.log(res);
    console.log('================================');


    // -----------------------------------------
    // GET DATA FROM API
    // -----------------------------------------

    if (res && Array.isArray(res.data)) {

      this.paymentList = res.data;

    } 
    else if (Array.isArray(res)) {

      this.paymentList = res;

    } 
    else {

      this.paymentList = [];

    }


    console.log(
      'PAYMENT LIST:',
      this.paymentList
    );


    // -----------------------------------------
    // PROCESS MONTHLY SALES
    // -----------------------------------------

    this.processMonthlyPayments();


    // -----------------------------------------
    // CREATE CHART ONLY AFTER DATA IS READY
    // -----------------------------------------

    if (this.chartViewReady) {

      this.initializePaymentChart();

    }

  }
  catch (error: any) {

    console.error(
      'Error fetching income:',
      error
    );

    this.paymentList = [];

  }

}
processMonthlyPayments(): void {

  // -----------------------------------------
  // RESET ALL MONTHS
  // -----------------------------------------

  this.monthlyPayments = {

    Jan: 0,
    Feb: 0,
    Mar: 0,
    Apr: 0,
    May: 0,
    Jun: 0,
    Jul: 0,
    Aug: 0,
    Sep: 0,
    Oct: 0,
    Nov: 0,
    Dec: 0

  };


  // -----------------------------------------
  // CHECK DATA
  // -----------------------------------------

  if (
    !this.paymentList ||
    !Array.isArray(this.paymentList)
  ) {

    console.warn(
      'No payment data available'
    );

    return;

  }


  // -----------------------------------------
  // LOOP THROUGH PAYMENTS
  // -----------------------------------------

  this.paymentList.forEach((payment: any) => {

    if (!payment.created_at) {

      console.warn(
        'Payment has no created_at:',
        payment
      );

      return;

    }


    // Convert date
    const paymentDate =
      new Date(
        payment.created_at.replace(' ', 'T')
      );


    if (
      isNaN(
        paymentDate.getTime()
      )
    ) {

      console.warn(
        'Invalid payment date:',
        payment.created_at
      );

      return;

    }


    // -----------------------------------------
    // GET MONTH
    // -----------------------------------------

    const monthIndex =
      paymentDate.getMonth();

    const monthName =
      this.months[monthIndex];


    // -----------------------------------------
    // GET TOTAL
    // -----------------------------------------

    const amount =
      Number(payment.total) || 0;


    // -----------------------------------------
    // ADD TO MONTH
    // -----------------------------------------

    this.monthlyPayments[monthName] += amount;

  });


  console.log(
    '================================'
  );

  console.log(
    'MONTHLY PAYMENT TOTALS:',
    this.monthlyPayments
  );

  console.log(
    'AUGUST TOTAL:',
    this.monthlyPayments['Aug']
  );

  console.log(
    '================================'
  );

}
initializePaymentChart(): void {

  console.log(
    'INITIALIZING PAYMENT CHART'
  );


  // -----------------------------------------
  // FIND CANVAS
  // -----------------------------------------

  const canvas =
    document.getElementById(
      'paymentChart'
    ) as HTMLCanvasElement;


  if (!canvas) {

    console.error(
      'paymentChart canvas was NOT found.'
    );

    return;

  }


  // -----------------------------------------
  // GET CONTEXT
  // -----------------------------------------

  const ctx =
    canvas.getContext('2d');


  if (!ctx) {

    console.error(
      'Could not get canvas context.'
    );

    return;

  }


  // -----------------------------------------
  // DESTROY OLD CHART
  // -----------------------------------------

  if (this.paymentChart) {

    this.paymentChart.destroy();

    this.paymentChart = null;

  }


  // -----------------------------------------
  // PREPARE DATA
  // -----------------------------------------

  const chartData =
    this.months.map(
      month =>
        Number(
          this.monthlyPayments[month]
        ) || 0
    );


  console.log(
    'CHART LABELS:',
    this.months
  );

  console.log(
    'CHART DATA:',
    chartData
  );


  // -----------------------------------------
  // CREATE CHART
  // -----------------------------------------

  this.paymentChart =
    new Chart(ctx, {

      type: 'line',

      data: {

        labels: this.months,

        datasets: [

          {

            label:
              'Monthly Sales (GHS)',

            data:
              chartData,

            borderColor:
              '#28a745',

            backgroundColor:
              'rgba(40, 167, 69, 0.15)',

            borderWidth: 3,

            pointRadius: 5,

            pointHoverRadius: 7,

            pointBackgroundColor:
              '#28a745',

            fill: true,

            lineTension: 0.3

          }

        ]

      },


      options: {

        responsive: true,

        maintainAspectRatio: false,


        legend: {

          display: true,

          position: 'top'

        },


        tooltips: {

          enabled: true,

          mode: 'index',

          intersect: false,

          callbacks: {

            label: function(
              tooltipItem,
              data
            ) {

              const value =
                tooltipItem.yLabel || 0;

              return (
                'Sales: ₵' +
                Number(value).toLocaleString(
                  'en-GH',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }
                )
              );

            }

          }

        },


        hover: {

          mode: 'nearest',

          intersect: true

        },


        scales: {

          xAxes: [

            {

              scaleLabel: {

                display: true,

                labelString:
                  'Month'

              }

            }

          ],


          yAxes: [

            {

              ticks: {

                beginAtZero: true,

                callback: function(
                  value
                ) {

                  return (
                    '₵' +
                    Number(value)
                      .toLocaleString(
                        'en-GH'
                      )
                  );

                }

              },

              scaleLabel: {

                display: true,

                labelString:
                  'Sales Amount (GHS)'

              }

            }

          ]

        }

      }

    });


  console.log(
    'CHART CREATED SUCCESSFULLY'
  );

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


  async checkOut(id){


    try{
      this.loading.start();
       
  
  
       var res= await this.guestService.checkout(id)
            // this.toastr.success(null,"successfully updated profile
            if(res)  this.getBookingList(); this.getRoom();
  
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


canGlow(departureDate: string): boolean {
  const currentDate = new Date();
  const departure = new Date(departureDate);

  // Ensure the date comparison focuses on the date part only
  const isToday =
    departure.getFullYear() === currentDate.getFullYear() &&
    departure.getMonth() === currentDate.getMonth() &&
    departure.getDate() === currentDate.getDate();

  // Check if the departure time is >= 12 PM
  const isAfterNoon = departure.getHours() >= 12;

  return isToday && isAfterNoon;
}


}
