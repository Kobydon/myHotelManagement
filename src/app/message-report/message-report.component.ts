// message-report.component.ts
import { Component, OnInit } from '@angular/core';
import { GuestService } from 'app/services/guest.service';

export interface SmsMessage {
  id: number;
  message: string;
  receiver: number;
  created_at: string;
  status: 'sent' | 'failed';
}

export interface BundleInfo {
  size: number;
  remaining: number;
}

@Component({
  selector: 'message-report',
  templateUrl: './message-report.component.html',
  styleUrls: ['./message-report.component.css']
})
export class MessageReportComponent implements OnInit {
  // Data
  allMessages: SmsMessage[] = [];
  filteredMessages: SmsMessage[] = [];
  bundleInfo: BundleInfo = { size: 0, remaining: 0 };

  // Filters
  statusFilter: string = 'all';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 100;
  totalItems: number = 0;

  // Stats
  totalSent: number = 0;
  totalFailed: number = 0;
  totalMessages: number = 0;

  constructor(private guestService: GuestService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.guestService.getMessagesSent().subscribe({
      next: (messages) => {
        this.allMessages = messages;
        this.applyFilters();
        this.loadBundleInfo();
      },
      error: (err) => console.error('Error loading messages:', err)
    });
  }

  loadBundleInfo(): void {
    this.guestService.getRemainingBundle().subscribe({
      next: (bundle) => {
        this.bundleInfo = bundle;
        this.updateStats();
      },
      error: (err) => console.error('Error loading bundle:', err)
    });
  }

  applyFilters(): void {
    let filtered = this.allMessages;

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === this.statusFilter);
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(m =>
        m.message.toLowerCase().includes(term) ||
        m.receiver.toString().includes(term)
      );
    }

    this.filteredMessages = filtered;
    this.totalItems = filtered.length;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    if (this.currentPage < 1) this.currentPage = 1;

    this.updateStats();
  }

  updateStats(): void {
    this.totalMessages = this.allMessages.length;
    this.totalSent = this.allMessages.filter(m => m.status === 'sent').length;
    this.totalFailed = this.allMessages.filter(m => m.status === 'failed').length;
  }

  get paginatedMessages(): SmsMessage[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredMessages.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
    this.applyFilters();
  }
}