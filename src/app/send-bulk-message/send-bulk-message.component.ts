import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { ToastrService } from 'ngx-toastr';
import { GuestService } from 'app/services/guest.service';
import { userService } from 'app/user.service';

// Define interfaces for type safety
interface Recipient {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface BulkMessageResponse {
  success: boolean;
  message: string;
  data: {
    bulk_id: number;
    recipient_count: number;
    status: string;
    message_type: string;
    recipient_type: string;
  };
}

interface MessageHistoryItem {
  id: number;
  subject: string;
  message: string;
  message_type: string;
  recipient_type: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
  sent_at: string | null;
  created_by: string;
}

interface Template {
  name: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'send-bulk-message',
  templateUrl: './send-bulk-message.component.html',
  styleUrls: ['./send-bulk-message.component.css']
})
export class SendBulkMessageComponent implements OnInit {
  
  @BlockUI('loading') loading!: NgBlockUI;
  
  messageForm!: FormGroup;
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedRecipients: any[] = [];
  
  recipientTypes = [
    { value: 'customers', label: 'Customers Only' },
    { value: 'employees', label: 'Employees Only' },
    { value: 'all', label: 'All Users' }
  ];
  
  messageTypes = [
    { value: 'sms', label: 'SMS Only' },
    { value: 'email', label: 'Email Only' },
    { value: 'both', label: 'Both SMS & Email' }
  ];
  
  scheduledTimes = [
    { value: 0, label: 'Send Now' },
    { value: 15, label: 'In 15 minutes' },
    { value: 30, label: 'In 30 minutes' },
    { value: 60, label: 'In 1 hour' },
    { value: 120, label: 'In 2 hours' },
    { value: 1440, label: 'Tomorrow' }
  ];
  
  messageHistory: MessageHistoryItem[] = [];
  selectedHistory: any = null;
  showHistory = false;

  // Quick reply templates
  quickTemplates: Template[] = [
    {
      name: 'Promotion',
      subject: '🎉 Special Offer for You!',
      message: `Dear Valued Customer,

We are excited to announce our special promotion this month! Enjoy up to 30% off on all our services.

Hurry, offer ends soon!

Best Regards,
Assempah fie Graphics Team`
    },
    {
      name: 'Appointment Reminder',
      subject: '📅 Appointment Reminder',
      message: `Dear Customer,

This is a reminder of your upcoming appointment at Assempah fie Graphics.

Date: {{date}}
Time: {{time}}

Please contact us if you need to reschedule.

Best Regards,
Assempah fie Graphics Team`
    },
    {
      name: 'Feedback Request',
      subject: '📝 We Value Your Feedback',
      message: `Dear Customer,

Thank you for choosing Assempah fie Graphics. We'd love to hear about your experience.

Please take a moment to share your feedback: {{link}}

Best Regards,
ATeam`
    },
    {
      name: 'Payment Reminder',
      subject: '💳 Payment Reminder',
      message: `Dear Customer,

This is a friendly reminder that your payment of {{amount}} is due on {{date}}.

Please ensure timely payment to avoid any service interruption.

Best Regards,
ATeam`
    }
  ];

  constructor(
    private fb: FormBuilder,
    private guestService: GuestService,
    private userService: userService,
    private toastr: ToastrService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadMessageHistory();
  }

  initForm(): void {
    this.messageForm = this.fb.group({
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      recipient_type: ['customers', Validators.required],
      message_type: ['sms', Validators.required],
      schedule: [0],
      preview_recipients: [false]
    });
  }

  async loadUsers(): Promise<void> {
    try {
      this.loading.start();
      const res = await this.userService.getUsers();
      if (res) {
        this.users = res;
        this.filterUsers();
      }
    } catch (err) {
      console.error('Error loading users:', err);
      this.toastr.error('Failed to load users');
    } finally {
      this.loading.stop();
    }
  }

  filterUsers(): void {
    const type = this.messageForm.get('recipient_type')?.value;
    
    if (type === 'customers') {
      this.filteredUsers = this.users.filter(u => 
        u.roles?.includes('customer') && u.phone && u.phone !== ''
      );
    } else if (type === 'employees') {
      this.filteredUsers = this.users.filter(u => 
        !u.roles?.includes('customer') && u.phone && u.phone !== ''
      );
    } else {
      this.filteredUsers = this.users.filter(u => 
        u.phone && u.phone !== ''
      );
    }
  }

  async loadMessageHistory(): Promise<void> {
    try {
      const res = await this.guestService.getBulkMessageHistory();
      if (res) {
        // Cast the response to the expected type
        this.messageHistory = res as MessageHistoryItem[];
      }
    } catch (err) {
      console.error('Error loading message history:', err);
    }
  }

  getRecipientCount(): number {
    return this.filteredUsers.length;
  }

  getRecipientSummary(): string {
    const type = this.messageForm.get('recipient_type')?.value;
    const count = this.getRecipientCount();
    const labels: Record<string, string> = {
      'customers': 'Customers',
      'employees': 'Employees',
      'all': 'All Users'
    };
    return `${count} ${labels[type] || 'Recipients'}`;
  }

  async sendMessage(): Promise<void> {
    if (this.messageForm.invalid) {
      this.toastr.warning('Please fill all required fields');
      return;
    }

    if (this.getRecipientCount() === 0) {
      this.toastr.warning('No recipients found for the selected type');
      return;
    }

    const confirmMessage = `Send ${this.messageForm.get('message_type')?.value} to ${this.getRecipientCount()} recipients?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      this.loading.start();
      const formData = this.messageForm.value;
      
      const response = await this.guestService.sendBulkMessage(formData) as BulkMessageResponse;
      
      if (response && response.success) {
        this.toastr.success(response.message || 'Bulk message sent successfully');
        this.messageForm.patchValue({ message: '' });
        this.loadMessageHistory();
      } else {
        this.toastr.error('Failed to send bulk message');
      }
    } catch (err: any) {
      console.error('Error sending bulk message:', err);
      this.toastr.error(err.error?.error || 'Failed to send bulk message');
    } finally {
      this.loading.stop();
    }
  }

  viewHistory(item: MessageHistoryItem): void {
    this.selectedHistory = item;
    this.showHistory = true;
  }

  closeHistory(): void {
    this.showHistory = false;
    this.selectedHistory = null;
  }

  getStatusBadge(status: string): string {
    const badges: Record<string, string> = {
      'pending': 'badge-warning',
      'sending': 'badge-info',
      'completed': 'badge-success',
      'failed': 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Track total message characters
  getMessageStats(): { chars: number; smsCount: number } {
    const message = this.messageForm.get('message')?.value || '';
    const chars = message.length;
    const smsCount = Math.ceil(chars / 160);
    return { chars, smsCount };
  }

  applyTemplate(template: Template): void {
    this.messageForm.patchValue({
      subject: template.subject,
      message: template.message
    });
    this.toastr.info(`Template "${template.name}" applied`);
  }

  // Copy recipients list
  copyRecipientsList(): void {
    const list = this.filteredUsers.map(u => 
      `${u.firstname || ''} ${u.lastname || ''} - ${u.phone || u.email || ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(list).then(() => {
      this.toastr.success('Recipients list copied to clipboard');
    }).catch(() => {
      this.toastr.error('Failed to copy list');
    });
  }

  // Add this method to your component
getRecipientTypeLabel(): string {
  const type = this.messageForm.get('recipient_type')?.value;
  const labels: Record<string, string> = {
    'customers': 'Customers',
    'employees': 'Employees',
    'all': 'All Users'
  };
  return labels[type] || 'Recipients';
}
}