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

  page = 1;
  pageSize: number = 16;
  rooms: any;
  @BlockUI('loading') loading!: NgBlockUI;
  public canvas: any;
  public ctx;
  public paymentChart: any;
  paymentList: any;
  monthlyPayments: { [month: string]: number } = {};
  months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    this.exchangeInterval= setInterval(()=>{
      this.getExchangeRates();

    },7000);
    this.getGust();

  
    this.interval= setInterval(()=>{
      this.getBookingList();

    },1000);
    this.getRoom();
    this.getUser();
  
  }
  async getUser() {
    try {
      var res = await this.userService.getUser();
      if (res) {
        this.user = res;
        // If roles are loaded, initialize chart
        if (this.user[0]?.roles === 'admin') {
          this.initializePaymentChart();
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      console.log("success");
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Make sure the chart initializes when the roles change and conditions are satisfied.
    if (changes.user && this.user[0]?.roles === 'admin') {
      this.initializePaymentChart();
    }
  }

  ngAfterViewInit() {
    // If the user data is already available, trigger chart initialization after the view has loaded
    if (this.user[0]?.roles === 'admin') {
      this.initializePaymentChart();
    }
  }
  async getPaymentList() {
    try {
      const res = await this.paymentService.getPayment();
      if (res) {
        this.paymentList = res;
        this.processMonthlyPayments();
        this.initializePaymentChart();
      }
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    }
  }

  processMonthlyPayments() {
    this.monthlyPayments = this.months.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    this.paymentList.forEach((payment: any) => {
      const paymentDate = new Date(payment.payment_date);
      const monthName = this.months[paymentDate.getMonth()];
      const amount = parseInt(payment.amount, 10);
      this.monthlyPayments[monthName] += amount;
    });
  }

  initializePaymentChart() {
    const canvas = document.getElementById('paymentChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    this.paymentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Monthly Payments (GHS)',
            data: Object.values(this.monthlyPayments),
            borderColor: '#6bd098',
            backgroundColor: 'rgba(107, 208, 152, 0.2)',
            borderWidth: 2,
            pointRadius: 1,
            pointHoverRadius: 1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount (GHS)',
            },
            beginAtZero: true,
          },
        },
      },
    });
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
