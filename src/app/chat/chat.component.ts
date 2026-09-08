// chat.component.ts - Fixed message ordering (newest at bottom)
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { ChatService } from '../../app/chat.service';
import { userService } from 'app/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;
  
  // Chat state
  isOpen: boolean = false;
  onlineUsers: any[] = [];
  selectedUser: any = null;
  messages: any[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  userTypingId: number | null = null;
  searchTerm: string = '';
  unreadCount: number = 0;
  
  // File attachment
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;
  selectedFileData: string | null = null;
  isUploading: boolean = false;
  
  // Current user
  currentUser: any = null;
  
  // User messages cache with last message preview
  userMessagesCache: Map<number, {
    messages: any[],
    lastMessage: any | null,
    unreadCount: number,
    lastMessageTime: string | null
  }> = new Map();
  
  unreadMessages: Map<number, number> = new Map();
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private messageNotifications: any[] = [];

  // Allowed file types
  private allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private chatService: ChatService,
    private userService: userService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupChatListeners();
    this.setupNotificationPermissions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private setupNotificationPermissions(): void {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.currentUser = res[0];
        this.chatService.connect(this.currentUser.id);
        await this.loadOnlineUsers();
        await this.loadAllMessages();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      this.toastr?.error('Failed to load user data', 'Error');
    }
  }

  async loadAllMessages(): Promise<void> {
    try {
      for (const user of this.onlineUsers) {
        if (user.id !== this.currentUser?.id) {
          await this.loadUserMessages(user.id);
        }
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading all messages:', error);
    }
  }

  async loadUserMessages(userId: number): Promise<void> {
    try {
      const messages = await this.chatService.getChatMessages(userId).toPromise();
      
      // ✅ SORT MESSAGES: Newest at bottom (ascending by timestamp)
      const sortedMessages = messages ? this.sortMessagesByTime(messages) : [];
      
      const lastMessage = sortedMessages && sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1] : null;
      const unreadMessages = sortedMessages ? sortedMessages.filter((m: any) => !m.read && m.sender_id === userId) : [];
      
      this.userMessagesCache.set(userId, {
        messages: sortedMessages || [],
        lastMessage: lastMessage,
        unreadCount: unreadMessages.length,
        lastMessageTime: lastMessage?.timestamp || null
      });
      
      if (unreadMessages.length > 0) {
        this.unreadMessages.set(userId, unreadMessages.length);
        this.unreadCount += unreadMessages.length;
        
        const user = this.onlineUsers.find(u => u.id === userId);
        if (user) {
          user.hasUnread = true;
          user.unreadCount = unreadMessages.length;
          user.lastMessagePreview = this.getMessagePreview(lastMessage);
          user.lastMessageTime = this.getRelativeTime(lastMessage?.timestamp);
        }
      } else if (lastMessage) {
        const user = this.onlineUsers.find(u => u.id === userId);
        if (user) {
          user.lastMessagePreview = this.getMessagePreview(lastMessage);
          user.lastMessageTime = this.getRelativeTime(lastMessage.timestamp);
        }
      }
    } catch (error) {
      console.error(`Error loading messages for user ${userId}:`, error);
    }
  }

  // ✅ Helper: Sort messages by time (oldest first, newest at bottom)
  sortMessagesByTime(messages: any[]): any[] {
    if (!messages || messages.length === 0) return [];
    
    return messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending: oldest first
    });
  }

  setupChatListeners(): void {
    this.subscriptions.push(
      this.chatService.messageReceived.subscribe((data) => {
        const senderId = data.sender_id;
        
        // ✅ Update cache with sorted messages
        if (this.userMessagesCache.has(senderId)) {
          const cache = this.userMessagesCache.get(senderId)!;
          cache.messages.push(data);
          // ✅ Keep messages sorted
          cache.messages = this.sortMessagesByTime(cache.messages);
          cache.lastMessage = cache.messages[cache.messages.length - 1];
          cache.lastMessageTime = data.timestamp;
          this.userMessagesCache.set(senderId, cache);
        }
        
        // If this is the selected user, add to current messages
        if (this.selectedUser && senderId === this.selectedUser.id) {
          // ✅ Add and sort messages
          this.messages.push(data);
          this.messages = this.sortMessagesByTime(this.messages);
          this.chatService.markAsRead(data.id, `chat_${this.currentUser.id}_${this.selectedUser.id}`);
          this.scrollToBottom();
          this.cdr.detectChanges();
        } else if (senderId !== this.currentUser?.id) {
          this.showMessageNotification(data);
          
          const currentUnread = this.unreadMessages.get(senderId) || 0;
          this.unreadMessages.set(senderId, currentUnread + 1);
          this.unreadCount++;
          
          this.updateUserWithPreview(senderId, data);
        }
        
        this.playNotificationSound();
      })
    );

    this.subscriptions.push(
      this.chatService.onlineUsersUpdated.subscribe((userIds) => {
        this.updateOnlineStatus(userIds);
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.push(
      this.chatService.userTyping.subscribe((data) => {
        if (data.user_id === this.selectedUser?.id) {
          this.userTypingId = data.is_typing ? data.user_id : null;
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.push(
      this.chatService.messageRead.subscribe((data) => {
        for (const [userId, cache] of this.userMessagesCache) {
          const msg = cache.messages.find(m => m.id === data.message_id);
          if (msg) {
            msg.read = true;
            break;
          }
        }
        
        const msg = this.messages.find(m => m.id === data.message_id);
        if (msg) {
          msg.read = true;
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.push(
      this.chatService.connectionStatus.subscribe((connected) => {
        if (!connected) {
          console.log('Chat reconnecting...', 'Warning');
        } else {
           console.log('Chat connected', 'Success');
        }
      })
    );
  }

  updateUserWithPreview(userId: number, message: any): void {
    const user = this.onlineUsers.find(u => u.id === userId);
    if (user) {
      user.hasUnread = true;
      user.unreadCount = (user.unreadCount || 0) + 1;
      user.lastMessagePreview = this.getMessagePreview(message);
      user.lastMessageTime = this.getRelativeTime(message.timestamp);
      
      this.onlineUsers.sort((a, b) => {
        if (a.hasUnread && !b.hasUnread) return -1;
        if (!a.hasUnread && b.hasUnread) return 1;
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return 0;
      });
      
      this.cdr.detectChanges();
    }
  }

  getMessagePreview(message: any): string {
    if (!message) return 'No messages';
    if (message.is_attachment) {
      return `📎 ${message.attachment_name || 'Attachment'}`;
    }
    if (message.message) {
      return message.message.length > 50 ? message.message.substring(0, 50) + '...' : message.message;
    }
    return 'New message';
  }

  getRelativeTime(timestamp: string): string {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageTime.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  showMessageNotification(message: any): void {
    const sender = this.onlineUsers.find(u => u.id === message.sender_id);
    if (!sender) return;

    const senderName = `${sender.firstname} ${sender.lastname}`;
    const messageText = this.getMessagePreview(message);

    this.toastr?.info(
      `<strong>${senderName}</strong><br>${messageText}`,
      '💬 New Message',
      {
        enableHtml: true,
        timeOut: 5000,
        positionClass: 'toast-top-right',
        tapToDismiss: true,
        onActivateTick: true
      }
    );

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`💬 ${senderName}`, {
          body: messageText,
          icon: '/assets/chat-icon.png',
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }

    this.playNotificationSound();
  }

  playNotificationSound(): void {
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0Y...';
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Silently fail
    }
  }

  getonlineCount(): number {
    return this.onlineUsers.filter(u => u.online).length;
  }

  async loadOnlineUsers(): Promise<void> {
    try {
      const users = await this.chatService.getOnlineUsers().toPromise();
      this.onlineUsers = users.map(user => ({
        ...user,
        hasUnread: false,
        unreadCount: 0,
        lastMessagePreview: 'No messages',
        lastMessageTime: ''
      }));
      console.log('✅ Online users loaded:', users);
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  }

  updateOnlineStatus(userIds: string[]): void {
    this.onlineUsers.forEach(user => {
      user.online = userIds.includes(user.id.toString());
    });
    this.onlineUsers.sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return 0;
    });
    this.cdr.detectChanges();
  }

  async selectUser(user: any): Promise<void> {
    if (this.selectedUser?.id === user.id) {
      this.selectedUser = null;
      this.messages = [];
      this.cdr.detectChanges();
      return;
    }

    this.selectedUser = user;
    this.isLoading = true;
    this.userTypingId = null;
    
    this.unreadMessages.delete(user.id);
    user.hasUnread = false;
    user.unreadCount = 0;
    this.unreadCount = Array.from(this.unreadMessages.values()).reduce((a, b) => a + b, 0);
    
    // ✅ Load from cache with sorted messages
    if (this.userMessagesCache.has(user.id)) {
      const cache = this.userMessagesCache.get(user.id)!;
      this.messages = this.sortMessagesByTime(cache.messages); // ✅ Ensure sorted
      this.isLoading = false;
      this.scrollToBottom();
      this.cdr.detectChanges();
      
      const unreadMessages = cache.messages.filter((m: any) => !m.read && m.sender_id === user.id);
      if (unreadMessages.length > 0) {
        const room = `chat_${this.currentUser.id}_${user.id}`;
        unreadMessages.forEach((msg: any) => {
          this.chatService.markAsRead(msg.id, room);
          msg.read = true;
        });
      }
    }

    const room = `chat_${this.currentUser.id}_${user.id}`;
    this.chatService.joinChatRoom(room, this.currentUser.id);

    try {
      await this.loadUserMessages(user.id);
      const cache = this.userMessagesCache.get(user.id)!;
      this.messages = this.sortMessagesByTime(cache.messages); // ✅ Ensure sorted
      this.isLoading = false;
      this.scrollToBottom();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading messages:', error);
      this.isLoading = false;
       console.log('Failed to load messages');
    }
  }

  // File attachment methods
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    if (!this.allowedFileTypes.includes(file.type)) {
      this.toastr?.error('Only images and PDF files are allowed');
      input.value = '';
      return;
    }
    
    if (file.size > this.maxFileSize) {
      this.toastr?.error('File size must be less than 5MB');
      input.value = '';
      return;
    }
    
    this.selectedFile = file;
    this.selectedFileData = null;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedFileData = e.target.result;
      this.selectedFilePreview = e.target.result;
      this.toastr?.success(`File "${file.name}" attached`);
      this.cdr.detectChanges();
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.toastr?.error('Failed to read file');
    };
    reader.readAsDataURL(file);
    
    input.value = '';
  }

  removeFile(): void {
    this.selectedFile = null;
    this.selectedFileData = null;
    this.selectedFilePreview = null;
    this.cdr.detectChanges();
  }

  getFileIcon(fileType: string | undefined): string {
    if (!fileType) return '📎';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isAttachmentImage(attachmentType: string): boolean {
    return attachmentType?.includes('image') || false;
  }

  // ✅ FIXED: Send message and add to bottom
  sendMessage(): void {
    if (!this.selectedUser || !this.currentUser) return;
    if (!this.newMessage.trim() && !this.selectedFileData) return;

    const room = `chat_${this.currentUser.id}_${this.selectedUser.id}`;
    
    let attachment = null;
    if (this.selectedFileData) {
      attachment = {
        data: this.selectedFileData,
        name: this.selectedFile?.name || 'attachment',
        type: this.selectedFile?.type || 'application/octet-stream',
        size: this.selectedFile?.size || 0
      };
    }
    
    this.chatService.sendMessage(
      room,
      this.currentUser.id,
      this.selectedUser.id,
      this.newMessage.trim(),
      attachment
    );

    const tempMessage: any = {
      id: Date.now(),
      sender_id: this.currentUser.id,
      receiver_id: this.selectedUser.id,
      message: this.newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      temp: true,
      is_attachment: !!attachment,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      attachment_data: attachment?.data,
      attachment_size: attachment?.size
    };
    
    // ✅ Add to messages (at the bottom)
    this.messages.push(tempMessage);
    // ✅ Ensure sorting (though new message should be at bottom already)
    this.messages = this.sortMessagesByTime(this.messages);
    
    // Update cache
    if (this.userMessagesCache.has(this.selectedUser.id)) {
      const cache = this.userMessagesCache.get(this.selectedUser.id)!;
      cache.messages.push(tempMessage);
      cache.messages = this.sortMessagesByTime(cache.messages);
      cache.lastMessage = cache.messages[cache.messages.length - 1];
      cache.lastMessageTime = tempMessage.timestamp;
      this.userMessagesCache.set(this.selectedUser.id, cache);
    }
    
    // Update user list preview
    const user = this.onlineUsers.find(u => u.id === this.selectedUser?.id);
    if (user) {
      user.lastMessagePreview = this.getMessagePreview(tempMessage);
      user.lastMessageTime = 'Just now';
    }
    
    this.newMessage = '';
    this.selectedFile = null;
    this.selectedFileData = null;
    this.selectedFilePreview = null;
    
    // ✅ Scroll to bottom to show new message
    setTimeout(() => {
      this.scrollToBottom();
      this.cdr.detectChanges();
    }, 50);
  }

  onTyping(): void {
    if (this.selectedUser && this.currentUser) {
      const room = `chat_${this.currentUser.id}_${this.selectedUser.id}`;
      this.chatService.sendTyping(room, this.currentUser.id, true);
      
      clearTimeout((this as any).typingTimeout);
      (this as any).typingTimeout = setTimeout(() => {
        this.chatService.sendTyping(room, this.currentUser.id, false);
      }, 2000);
    }
  }

  // ✅ FIXED: Scroll to bottom of messages
  scrollToBottom(): void {
    try {
      const element = this.messageContainer?.nativeElement;
      if (element) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight;
        });
      }
    } catch (err) {
      // Ignore
    }
  }

  isOwnMessage(message: any): boolean {
    return message.sender_id === this.currentUser?.id;
  }

  getMessageTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getMessageDate(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      this.loadOnlineUsers();
      this.loadAllMessages();
      // ✅ Scroll to bottom when opening chat
      setTimeout(() => this.scrollToBottom(), 300);
    }
  }

  closeChat(): void {
    this.isOpen = false;
    this.selectedUser = null;
    this.messages = [];
    this.selectedFile = null;
    this.selectedFileData = null;
    this.selectedFilePreview = null;
    this.cdr.detectChanges();
  }

  viewAttachment(attachmentData: string, attachmentName: string, attachmentType: string): void {
    if (!attachmentData) return;
    
    if (this.isAttachmentImage(attachmentType)) {
      this.openImageModal(attachmentData, attachmentName);
    } else {
      const link = document.createElement('a');
      link.href = attachmentData;
      link.download = attachmentName || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  openImageModal(imageUrl: string, imageName: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      cursor: pointer;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = imageName || 'Image';
    img.style.cssText = `
      max-width: 100%;
      max-height: 80vh;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      object-fit: contain;
      background: white;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: -40px;
      right: -10px;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    overlay.onclick = () => {
      document.body.removeChild(overlay);
    };
    
    container.onclick = (e) => e.stopPropagation();
    
    container.appendChild(closeBtn);
    container.appendChild(img);
    overlay.appendChild(container);
    
    document.body.appendChild(overlay);
  }
}