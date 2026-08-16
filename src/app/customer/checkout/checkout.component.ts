// checkout.component.ts (Updated with Print Bill functionality)
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'app/cart.service';
import { ToastrService } from 'ngx-toastr';
import * as JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  
  // Customer details
  customerName: string = '';
  customerEmail: string = '';
  customerPhone: string = '';
  orderNote: string = '';
  
  // Payment
  selectedPayment: string = 'momo';
  momoNetwork: string = '';
  momoNumber: string = '';
  cardNumber: string = '';
  cardExpiry: string = '';
  cardCvv: string = '';
  cardName: string = '';
  
  deliveryFee: number = 0;
  isProcessing: boolean = false;

  // User info for receipt
  user: any = null;

  private productIcons: { [key: string]: string } = {
    'label': '🏷️',
    'large format': '🖼️',
    'digital printing': '🖨️',
    'dtf': '👕',
    'default': '📦'
  };

  constructor(
    private cartService: CartService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      console.log('🛒 Cart items in checkout:', items);
    });
    
    // Get user info for receipt
    this.getUser();
  }

  // ===================== GET USER =====================
  async getUser() {
    try {
      const userService = (this as any).userService;
      if (userService) {
        const res = await userService.getUser();
        if (res && res.length > 0) {
          this.user = res[0];
        }
      }
    } catch (err) {
      console.error("Error loading user:", err);
    }
  }

  // ===================== PRODUCT ICONS =====================
  getProductIcon(productName: string): string {
    if (!productName) return this.productIcons['default'];
    const name = productName.toLowerCase().trim();
    for (const [key, icon] of Object.entries(this.productIcons)) {
      if (name.includes(key)) {
        return icon;
      }
    }
    return this.productIcons['default'];
  }

  // ===================== CALCULATIONS =====================
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.price * (item.qty || 1));
    }, 0);
  }

  getTotal(): number {
    return this.getSubtotal() + this.deliveryFee;
  }

  formatCurrency(value: number): string {
    if (isNaN(value) || value === null || value === undefined) {
      return '0.00';
    }
    return (Math.round(value * 100) / 100).toFixed(2);
  }

  // ===================== PAYMENT SELECTION =====================
  selectPayment(method: string) {
    this.selectedPayment = method;
  }

  // ===================== VALIDATION =====================
  isValid(): boolean {
    // Check customer details
    if (!this.customerName.trim() || !this.customerPhone.trim()) {
      return false;
    }

    // Check payment method
    if (this.selectedPayment === 'momo') {
      if (!this.momoNetwork || !this.momoNumber.trim()) {
        return false;
      }
    } else if (this.selectedPayment === 'visa') {
      if (!this.cardNumber.trim() || !this.cardExpiry.trim() || 
          !this.cardCvv.trim() || !this.cardName.trim()) {
        return false;
      }
    }

    return true;
  }

  // ===================== BARCODE GENERATION =====================
  generateBarcode(orderId: string | number): string {
    try {
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      JsBarcode(svg, String(orderId), {
        format: 'CODE128',
        width: 1.2,
        height: 40,
        displayValue: true,
        fontSize: 14,
        font: 'monospace',
        textMargin: 4,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000'
      });

      const svgHTML = svg.outerHTML;
      container.remove();
      return svgHTML;
    } catch (error) {
      console.error('Error generating barcode:', error);
      return `<div style="text-align:center;font-size:11px;font-weight:bold;">Order #${orderId}</div>`;
    }
  }

  // ===================== BUILD RECEIPT HTML =====================
  buildReceiptHTML(
    items: any[], 
    balance: number, 
    amountPaid: number, 
    totalAmount: number, 
    currentDate: string, 
    note: string, 
    orderId: string | number,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    paymentMethod: string
  ): string {
    const orderIdString = orderId || 'N/A';
    const barcodeSVG = this.generateBarcode(orderIdString);
    const userFullName = this.user ? `${this.user.firstname || ''} ${this.user.lastname || ''}` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; }
          }
          body {
            font-family: monospace, 'Courier New', sans-serif;
            font-size: 13px;
            padding: 5px;
            width: 80mm;
            box-sizing: border-box;
          }
          .header { text-align: center; margin-bottom: 2px; }
          .shop-name { font-size: 16px; font-weight: bold; }
          .info, .footer { text-align: center; margin: 2px 0; }
          .customer-info {
            background: #f5f5f5;
            padding: 5px;
            margin: 5px 0;
            border-radius: 3px;
            font-size: 12px;
          }
          .customer-info .label { font-weight: bold; }
          .customer-info .customer-name { font-size: 14px; font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          .barcode-container {
            text-align: center;
            margin: 5px 0;
            padding: 3px 0;
            background: #ffffff;
          }
          .barcode-container svg {
            max-width: 100%;
            height: auto;
          }
          table { width: 100%; font-size: 13px; border-collapse: collapse; }
          th, td { padding: 2px 0; word-break: break-word; }
          th { text-align: left; border-bottom: 1px solid #ccc; }
          th:last-child, td:last-child { text-align: right; }
          .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 4px; }
          .balance-info { 
            text-align: right; 
            font-size: 12px; 
            margin-top: 2px;
            padding: 5px;
            background: ${(balance > 0) ? '#fff3cd' : '#d4edda'};
            border-radius: 3px;
          }
          .divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          .thankyou { text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px; }
          .order-id { 
            text-align: center; 
            font-size: 32px; 
            font-weight: 900;
            color: #1a1a1a;
            padding: 8px 0;
            letter-spacing: 3px;
            background: #f8f9fa;
            margin: 8px 0;
            border-radius: 5px;
          }
          .order-id-label {
            text-align: center;
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
            margin-top: 3px;
          }
          .note-section {
            text-align: center;
            font-size: 12px;
            margin: 5px 0;
            padding: 5px;
            background: #f9f9f9;
            border-radius: 3px;
          }
          .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-success { background: #d4edda; color: #155724; }
          .badge-warning { background: #fff3cd; color: #856404; }
          .barcode-label {
            font-size: 9px;
            color: #666;
            text-align: center;
            margin-top: 2px;
          }
          .order-number-box {
            border: 2px solid #2c3e50;
            padding: 5px 0;
            margin: 5px 0;
            border-radius: 8px;
            background: #ffffff;
          }
          .payment-method { text-align: right; font-size: 12px; margin-top: 2px; }
          .delivery-info { text-align: right; font-size: 12px; margin-top: 2px; color: #666; }
          .item-description {
            color: #666;
            font-size: 11px;
            margin-top: 2px;
          }
          @media print and (max-width: 80mm) {
            body { font-size: 12px; }
            .barcode-container svg { max-width: 70mm; }
            .customer-info { font-size: 11px; }
            .order-id { font-size: 28px; }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="shop-name">✨ Asempahfie Graphics ✨</div>
          <div class="info">📍 Kokomlemle, Accra</div>
          <div class="info">📞 0243210009</div>
          <div class="info">📧 info@asempahfiegraphics.com</div>
          ${userFullName ? `<div class="info">👤 Attendant: ${userFullName}</div>` : ''}
        </div>
        
        <!-- ORDER NUMBER -->
        <div class="order-number-box">
          <div class="order-id-label">ORDER NUMBER</div>
          <div class="order-id">#${orderIdString}</div>
        </div>
        
        <div class="customer-info">
          <div class="customer-name">👤 ${customerName || 'Walk-in Customer'}</div>
          ${customerPhone ? `<div><span class="label">📱 Phone:</span> ${customerPhone}</div>` : ''}
          ${customerEmail ? `<div><span class="label">✉️ Email:</span> ${customerEmail}</div>` : ''}
        </div>
        
        <div class="info"><strong>🧾 PAYMENT RECEIPT</strong></div>
        <div class="info">📅 Date: ${currentDate}</div>
        
        <!-- BARCODE -->
        <div class="barcode-container">
          ${barcodeSVG}
          <div class="barcode-label">Scan to verify order #${orderIdString}</div>
        </div>
        
        ${note ? `
          <div class="note-section">
            <strong>📝 Note:</strong> ${note}
          </div>
        ` : ''}
        
        <hr class="divider" />

        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>
                  ${item.name || item.item_name || 'N/A'}
                  ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                  ${item.width && item.height ? `<div style="color:#888;font-size:10px;">📐 ${item.width} x ${item.height} ${item.unit || 'inches'}</div>` : ''}
                  ${item.attachment ? `<div style="color:#3498db;font-size:10px;">📎 Attachment</div>` : ''}
                </td>
                <td>${item.qty || 1}</td>
                <td>₵${((+item.price || 0) * (+item.qty || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr class="divider" />
        <div class="total">💰 Total: ₵${this.formatCurrency(totalAmount)}</div>
        
        ${this.deliveryFee > 0 ? `
          <div class="delivery-info">🚚 Delivery Fee: ₵${this.formatCurrency(this.deliveryFee)}</div>
        ` : ''}
        
        <div class="payment-method">💳 Payment: ${paymentMethod === 'momo' ? 'Mobile Money' : 'Visa/Mastercard'}</div>
        
        ${(balance > 0) ? `
          <div class="balance-info">
            💳 Amount Paid: ₵${this.formatCurrency(amountPaid)}<br>
            ⏳ Balance Due: ₵${this.formatCurrency(balance)}
            <br>
            <span class="badge badge-warning">Partial Payment</span>
          </div>
        ` : `
          <div class="balance-info" style="background: #d4edda;">
            ✅ Fully Paid: ₵${this.formatCurrency(totalAmount)}
            <br>
            <span class="badge badge-success">Paid in Full</span>
          </div>
        `}
        
        <hr class="divider" />
        
        <div class="thankyou">🙏 Thank you for your patronage!</div>
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 5px;">
          This is your official payment receipt
        </div>
        ${balance > 0 ? `
          <div class="footer" style="font-size: 10px; color: #e74c3c; font-weight: bold;">
            ⚠️ Outstanding balance of ₵${this.formatCurrency(balance)}
          </div>
        ` : ''}
        <div class="footer" style="font-size: 10px; color: #666; margin-top: 3px;">
          Visit us again at Asempahfie Graphics
        </div>
        <div class="footer" style="font-size: 8px; color: #999;">
          This is a computer-generated receipt | ${new Date().toLocaleDateString()}
          <br>Order #${orderIdString}
        </div>
      </body>
      </html>
    `;
  }

  // ===================== PRINT BILL =====================
  printBillAfterPayment(order: any, orderId?: any): void {
    let items: any[] = [];
    
    try {
      if (order && order.items) {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
      } else {
        items = this.cartItems;
      }
    } catch (error) {
      console.error("Error parsing order items:", error);
      items = this.cartItems;
    }

    const balance = this.roundToTwoDecimals(order?.balance || 0);
    const amountPaid = this.roundToTwoDecimals(order?.amount_paid || (order?.total - balance) || this.getTotal());
    const totalAmount = this.roundToTwoDecimals(order?.total || this.getTotal());
    const currentDate = new Date().toLocaleString();
    const note = this.orderNote || '';
    const orderIdString = orderId || order?.id || 'N/A';

    const receiptContent = this.buildReceiptHTML(
      items, 
      balance, 
      amountPaid, 
      totalAmount, 
      currentDate, 
      note, 
      orderIdString,
      this.customerName,
      this.customerPhone,
      this.customerEmail,
      this.selectedPayment
    );

    setTimeout(() => {
      this.openPrintWindow(receiptContent);
    }, 300);
  }

  // ===================== PRINT WINDOW =====================
  openPrintWindow(content: string): void {
    let printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    
    if (!printWindow) {
      printWindow = window.open('', 'printWindow', 'width=400,height=600,scrollbars=yes');
      
      if (!printWindow) {
        this.printUsingIframe(content);
        return;
      }
    }
    
    try {
      printWindow.document.open();
      printWindow.document.write(content);
      printWindow.document.close();
    } catch (error) {
      console.error('Error writing to print window:', error);
      this.printUsingIframe(content);
    }
  }

  printUsingIframe(content: string): void {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(content);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            iframe.remove();
          }, 1000);
        }, 200);
      } else {
        this.showPrintableDialog(content);
      }
    } catch (error) {
      console.error('Error using iframe print:', error);
      this.toastr.error('Unable to open print window. Please check your browser popup settings.', 'Error');
    }
  }

  showPrintableDialog(content: string): void {
    const printContainer = document.createElement('div');
    printContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const printContent = document.createElement('div');
    printContent.style.cssText = `
      background: white;
      max-width: 400px;
      max-height: 80vh;
      overflow: auto;
      padding: 20px;
      border-radius: 8px;
      position: relative;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      border: none;
      background: #f44336;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
    `;
    closeBtn.onclick = () => printContainer.remove();
    
    const printBtn = document.createElement('button');
    printBtn.textContent = '🖨️ Print Receipt';
    printBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    `;
    printBtn.onclick = () => {
      const printWin = window.open('', '_blank', 'width=400,height=600');
      if (printWin) {
        printWin.document.write(content);
        printWin.document.close();
        printWin.print();
        printContainer.remove();
      } else {
        alert('Please enable popups for this site or copy the receipt manually.');
        console.log('Receipt content:', content);
      }
    };
    
    const contentPreview = document.createElement('div');
    contentPreview.style.cssText = `
      max-height: 400px;
      overflow: auto;
      font-size: 12px;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      background: #f9f9f9;
    `;
    contentPreview.innerHTML = content;
    
    printContent.appendChild(closeBtn);
    printContent.appendChild(printBtn);
    printContent.appendChild(contentPreview);
    printContainer.appendChild(printContent);
    
    document.body.appendChild(printContainer);
  }

  // ===================== HELPER =====================
  roundToTwoDecimals(value: number): number {
    if (isNaN(value) || value === null || value === undefined) {
      return 0;
    }
    return Math.round(value * 100) / 100;
  }

  // ===================== PLACE ORDER =====================
  async placeOrder() {
    if (!this.isValid()) {
      this.toastr.warning('Please fill in all required fields');
      return;
    }

    if (this.cartItems.length === 0) {
      this.toastr.warning('Your cart is empty');
      return;
    }

    this.isProcessing = true;

    try {
      const orderData = {
        cartItems: this.cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          description: item.description || '',
          attachment: item.attachment || null,
          family: item.family || '',
          category: item.category || '',
          is_vip: item.is_vip || 'no'
        })),
        total: this.getTotal(),
        customer: this.customerName,
        customer_email: this.customerEmail,
        customer_phone: this.customerPhone,
        note: this.orderNote,
        payment_method: this.selectedPayment,
        amount_paid: this.getTotal(),
        ...(this.selectedPayment === 'momo' && {
          momo_network: this.momoNetwork,
          momo_number: this.momoNumber
        }),
        ...(this.selectedPayment === 'visa' && {
          card_last4: this.cardNumber.slice(-4),
          card_name: this.cardName
        })
      };

      console.log('📤 Sending order:', orderData);

      const response = await this.cartService.holdCartWithPaymentCustomer(
        null,
        this.getTotal(),
        '',
        this.orderNote,
        this.customerName,
        this.getTotal()
      ).toPromise();

      if (response) {
        console.log('✅ Order placed successfully:', response);
        this.toastr.success('🎉 Order placed successfully!');
        
        // Print receipt after successful order
        this.printBillAfterPayment(response, response.id || response.order_id);
        
        this.cartService.clearCart();
        setTimeout(() => {
          this.router.navigate(['/customer-category']);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      this.toastr.error('Failed to place order. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  goBack() {
    this.router.navigate(['/customer-item-list']);
  }
}