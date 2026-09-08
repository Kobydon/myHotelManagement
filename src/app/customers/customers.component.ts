import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';

@Component({
  selector: 'customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  customers = [];

  // Coupon
  isCouponModalOpen = false;
  discountValue: number = 0;
  currentCustomerId: number = 0;

  // Edit customer
  isEditModalOpen = false;
  editingCustomer: any = {
    id: null,
    customer_id: '',
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    dob: ''
  };

  isUpdating = false;

  constructor(private guestService: GuestService) {}

  ngOnInit(): void {
    this.getCustomers();
  }

  // Get customers
  async getCustomers() {
    var res = await this.guestService.getCustomers();
    this.customers = res || [];
  }

  // ============================
  // EDIT CUSTOMER
  // ============================

  editCustomer(customerId: number) {
    const customer = this.customers.find(
      (customer: any) => customer.id === customerId
    );

    if (!customer) {
      alert('Customer not found.');
      return;
    }

    // Make a copy so we don't modify the table
    // until the Update button is clicked.
    this.editingCustomer = {
      id: customer.id,
      customer_id: customer.customer_id,
      firstname: customer.firstname || '',
      lastname: customer.lastname || '',
      phone: customer.phone || '',
      email: customer.email || '',
      dob: customer.dob || ''
    };

    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;

    this.editingCustomer = {
      id: null,
      customer_id: '',
      firstname: '',
      lastname: '',
      phone: '',
      email: '',
      dob: ''
    };
  }

async updateCustomer() {
  if (!this.editingCustomer.id) {
    alert('Customer ID is missing.');
    return;
  }

  if (!this.editingCustomer.firstname.trim()) {
    alert('First name is required.');
    return;
  }

  

  if (!this.editingCustomer.phone.trim()) {
    alert('Phone is required.');
    return;
  }

  this.isUpdating = true;

  const data = {
    customer_id: this.editingCustomer.id,
    firstname: this.editingCustomer.firstname.trim(),
    lastname: this.editingCustomer.lastname.trim(),
    phone: this.editingCustomer.phone.trim(),
    email: this.editingCustomer.email.trim(),
    dob: this.editingCustomer.dob
  };

  try {
    const res: any = await this.guestService.updateCustomer(data);

    if (res && res.success) {
      alert('Customer updated successfully.');

      this.closeEditModal();

      // Refresh customer list
      await this.getCustomers();
    } else {
      alert(res?.error || 'Failed to update customer.');
    }

  } catch (error: any) {
    console.error('Update customer error:', error);

    alert(
      error?.error?.error ||
      'An error occurred while updating the customer.'
    );

  } finally {
    this.isUpdating = false;
  }
}


  // ============================
  // COUPON
  // ============================

  openCouponModal(customerId: number) {
    this.currentCustomerId = customerId;
    this.isCouponModalOpen = true;
  }

  closeCouponModal() {
    this.isCouponModalOpen = false;
    this.discountValue = 0;
  }

  applyCoupon() {
    if (this.discountValue < 0 || this.discountValue > 100) {
      alert('Please enter a valid discount value between 0 and 100.');
      return;
    }

    this.guestService
      .applyCoupon(this.currentCustomerId, this.discountValue)
      .subscribe(() => {
        alert(`Coupon applied successfully! Discount: ${this.discountValue}%`);

        this.closeCouponModal();
        this.getCustomers();
      });
  }

  // ============================
  // DELETE
  // ============================

  deleteCustomer(customerId: number) {
    this.guestService.deleteCustomer(customerId).subscribe(() => {
      this.getCustomers();
    });
  }
}
