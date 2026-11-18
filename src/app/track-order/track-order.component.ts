
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CartService } from 'app/cart.service';
import { Subscription } from 'rxjs';

interface OrderItem {
  id?: number;
  name?: string;
  product_name?: string;
  product?: string;
  title?: string;
  description?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
  confirmed?: boolean | string | null;
  [key: string]: any;
}

@Component({
  selector: 'track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent implements OnInit, OnDestroy {

  order: any = null;
  items: OrderItem[] = [];

  orderId: string = '';

  loading = false;
  searched = false;
  errorMessage = '';

  private subscription?: Subscription;

  trackingSteps = [
    {
      label: 'Processing',
      description: 'Your order has been received and is being processed.'
    },
    {
      label: 'Printed',
      description: 'Your order has been confirmed and sent for production.'
    },
    {
      label: 'Cutting',
      description: 'Your graphics are being cut and prepared.'
    },
    {
      label: 'In Delivery',
      description: 'Your order is on its way.'
    },
    {
      label: 'Ready for Pickup',
      description: 'Your order is ready for collection.'
    },
    {
      label: 'Delivered',
      description: 'Your order has been successfully completed.'
    }
  ];

  constructor(
    private cartService: CartService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  trackOrder(): void {

    const id = Number(this.orderId.trim());

    if (!this.orderId.trim()) {
      this.errorMessage = 'Please enter your Order ID.';
      this.searched = true;
      return;
    }

    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Please enter a valid numeric Order ID.';
      this.searched = true;
      return;
    }

    this.subscription?.unsubscribe();

    this.loading = true;
    this.searched = false;
    this.errorMessage = '';
    this.order = null;
    this.items = [];

    this.subscription = this.cartService.trackOrder(id).subscribe({

      next: (response: any) => {

        this.order = response;

        this.items = Array.isArray(response.items)
          ? response.items
          : [];

        this.loading = false;
        this.searched = true;

      },

      error: (error: any) => {

        this.loading = false;
        this.searched = true;

        this.errorMessage =
          error?.error?.error ||
          'Unable to find this order. Please check your Order ID and try again.';

      }

    });

  }

  resetSearch(): void {

    this.subscription?.unsubscribe();

    this.orderId = '';
    this.order = null;
    this.items = [];
    this.errorMessage = '';
    this.searched = false;
    this.loading = false;

  }

  getStatusText(item: OrderItem): string {

    if (item.confirmed === true) return 'Printed';
    if (item.confirmed === false) return 'Processing';
    if (item.confirmed === 'cutting') return 'Cutting';
    if (item.confirmed === 'delivered') return 'Delivered';
    if (item.confirmed === 'in_delivery') return 'In Delivery';
    if (item.confirmed === 'ready for pickup') return 'Ready for Pickup';

    return 'Processing';

  }

  getStatusIndex(item: OrderItem): number {

    return this.trackingSteps.findIndex(
      step => step.label === this.getStatusText(item)
    );

  }

  isStepCompleted(item: OrderItem, index: number): boolean {
    return this.getStatusIndex(item) >= index;
  }

  isStepCurrent(item: OrderItem, index: number): boolean {
    return this.getStatusIndex(item) === index;
  }

  getOverallStatus(): string {

    if (!this.items.length) return 'Processing';

    const statuses = this.items.map(item => this.getStatusText(item));

    if (statuses.every(s => s === 'Delivered')) return 'Delivered';
    if (statuses.every(s => s === 'Ready for Pickup')) return 'Ready for Pickup';
    if (statuses.every(s => s === 'In Delivery')) return 'In Delivery';
    if (statuses.every(s => s === 'Cutting')) return 'Cutting';
    if (statuses.every(s => s === 'Printed')) return 'Printed';
    if (statuses.every(s => s === 'Processing')) return 'Processing';

    return 'In Progress';

  }

  getOverallProgress(): number {

    if (!this.items.length) return 0;

    const total = this.items.reduce(
      (sum, item) => sum + this.getStatusIndex(item) + 1,
      0
    );

    return Math.round(
      (total / (this.items.length * this.trackingSteps.length)) * 100
    );

  }

  getItemName(item: OrderItem): string {

    return item.name ||
      item.product_name ||
      item.product ||
      item.title ||
      'Custom Graphics Product';

  }

  getItemDescription(item: OrderItem): string {
    return item.description || 'No additional description provided.';
  }

  getQuantity(item: OrderItem): number {
    return Number(item.quantity) || 1;
  }

  getItemPrice(item: OrderItem): number {
    return Number(item.subtotal ?? item.price ?? 0);
  }

  getTotal(): number {
    return Number(this.order?.total) || 0;
  }

  getBalance(): number {
    return Number(this.order?.balance) || 0;
  }

  getAmountPaid(): number {
    return Math.max(0, this.getTotal() - this.getBalance());
  }

  getPaymentStatus(): string {

    if (
      this.order?.paid_status === true ||
      this.order?.paid_status === 'paid'
    ) {
      return 'Paid';
    }

    if (this.getBalance() <= 0 && this.getTotal() > 0) {
      return 'Paid';
    }

    if (this.getAmountPaid() > 0) {
      return 'Partially Paid';
    }

    return 'Payment Pending';

  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  getOrderDate(): string {

    if (!this.order?.created_at) return 'Date unavailable';

    return new Date(this.order.created_at).toLocaleDateString(
      'en-GH',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    );

  }

}
