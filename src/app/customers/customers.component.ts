import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers = [];
  isCouponModalOpen = false;  // To control modal visibility
  discountValue: number = 0;   // To store the discount entered by the user
  currentCustomerId: number = null;  // To store the customer ID to apply the coupon to

  constructor(private guestService: GuestService) {}

  ngOnInit(): void {
    this.getCustomers();
  }

  // Get the list of customers from the backend
  async getCustomers() {
    var res = await this.guestService.getCustomers();
    this.customers = res || [];
  }

  // Open coupon modal and set current customer
  openCouponModal(customerId: number) {
    this.currentCustomerId = customerId;
    this.isCouponModalOpen = true;
  }

  // Close the coupon modal
  closeCouponModal() {
    this.isCouponModalOpen = false;
    this.discountValue = 0;  // Reset the discount value when modal is closed
  }

  // Apply coupon with discount value
  applyCoupon() {
    if (this.discountValue < 0 || this.discountValue > 100) {
      alert('Please enter a valid discount value between 0 and 100.');
      return;
    }

    this.guestService.applyCoupon(this.currentCustomerId, this.discountValue).subscribe(() => {
      alert(`Coupon applied successfully! Discount: ${this.discountValue}%`);
      this.closeCouponModal();  // Close the modal after applying coupon
      this.getCustomers(); // Refresh customer list
    });
  }

  // Edit a customer
  editCustomer(customerId: number) {
    console.log('Edit customer', customerId);
    // Implement edit functionality here (show edit form, etc.)
  }

  // Delete a customer
  deleteCustomer(customerId: number) {
    this.guestService.deleteCustomer(customerId).subscribe(() => {
      this.getCustomers(); // Refresh the list after deletion
    });
  }
}
