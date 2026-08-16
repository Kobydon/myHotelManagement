// chat.component.ts - Updated with file attachment support
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Allowed file types
  private allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  private maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(
    private chatService: ChatService,
    private userService: userService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.setupChatListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  async loadCurrentUser(): Promise<void> {
    try {
      const res = await this.userService.getUser();
      if (res && res.length > 0) {
        this.currentUser = res[0];
        this.chatService.connect(this.currentUser.id);
        await this.loadOnlineUsers();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      this.toastr?.error('Failed to load user data', 'Error');
    }
  }

  setupChatListeners(): void {
    this.subscriptions.push(
      this.chatService.messageReceived.subscribe((data) => {
        if (this.selectedUser && data.sender_id === this.selectedUser.id) {
          this.messages.push(data);
          this.chatService.markAsRead(data.id, `chat_${this.currentUser.id}_${this.selectedUser.id}`);
        } else if (data.sender_id !== this.currentUser?.id) {
          this.unreadCount++;
        }
        this.scrollToBottom();
      })
    );

    this.subscriptions.push(
      this.chatService.onlineUsersUpdated.subscribe((userIds) => {
        this.updateOnlineStatus(userIds);
      })
    );

    this.subscriptions.push(
      this.chatService.userTyping.subscribe((data) => {
        if (data.user_id === this.selectedUser?.id) {
          this.userTypingId = data.is_typing ? data.user_id : null;
        }
      })
    );

    this.subscriptions.push(
      this.chatService.messageRead.subscribe((data) => {
        const msg = this.messages.find(m => m.id === data.message_id);
        if (msg) {
          msg.read = true;
        }
      })
    );

    this.subscriptions.push(
      this.chatService.connectionStatus.subscribe((connected) => {
        if (!connected) {
          // this.toastr?.warning('Chat disconnected. Reconnecting...', 'Warning');
        }
      })
    );
  }

  getonlineCount(): number {
    return this.onlineUsers.filter(u => u.online).length;
  }

  async loadOnlineUsers(): Promise<void> {
    try {
      const users = await this.chatService.getOnlineUsers().toPromise();
      this.onlineUsers = users;
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
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      return 0;
    });
  }

  async selectUser(user: any): Promise<void> {
    if (this.selectedUser?.id === user.id) {
      this.selectedUser = null;
      this.messages = [];
      return;
    }

    this.selectedUser = user;
    this.messages = [];
    this.isLoading = true;
    this.userTypingId = null;
    this.unreadCount = 0;

    const room = `chat_${this.currentUser.id}_${user.id}`;
    this.chatService.joinChatRoom(room, this.currentUser.id);

    try {
      const messages = await this.chatService.getChatMessages(user.id).toPromise();
      this.messages = messages;
      this.isLoading = false;
      this.scrollToBottom();
      
      const unreadMessages = messages.filter((m: any) => !m.read && m.sender_id === user.id);
      unreadMessages.forEach((msg: any) => {
        this.chatService.markAsRead(msg.id, room);
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      this.isLoading = false;
      this.toastr?.error('Failed to load messages');
    }
  }

  // ✅ File attachment methods
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!this.allowedFileTypes.includes(file.type)) {
      this.toastr?.error('Only images and PDF files are allowed');
      input.value = '';
      return;
    }
    
    // Validate file size
    if (file.size > this.maxFileSize) {
      this.toastr?.error('File size must be less than 5MB');
      input.value = '';
      return;
    }
    
    this.selectedFile = file;
    this.selectedFileData = null;
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedFileData = e.target.result;
      this.selectedFilePreview = e.target.result;
      this.toastr?.success(`File "${file.name}" attached`);
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
  }

 getFileIcon(fileType: string | undefined): string {
  if (!fileType) return '📎'; // ✅ Return default for undefined
  
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

  // ✅ Updated sendMessage with file attachment
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

    // Add message to local list
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
    
    this.messages.push(tempMessage);
    this.newMessage = '';
    this.selectedFile = null;
    this.selectedFileData = null;
    this.selectedFilePreview = null;
    this.scrollToBottom();
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

  scrollToBottom(): void {
    try {
      const element = this.messageContainer?.nativeElement;
      if (element) {
        setTimeout(() => {
          element.scrollTop = element.scrollHeight;
        }, 100);
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
    }
  }

  closeChat(): void {
    this.isOpen = false;
    this.selectedUser = null;
    this.messages = [];
    this.selectedFile = null;
    this.selectedFileData = null;
    this.selectedFilePreview = null;
  }

  // ✅ View attachment in modal
  viewAttachment(attachmentData: string, attachmentName: string, attachmentType: string): void {
    if (!attachmentData) return;
    
    // If it's an image, open in modal
    if (this.isAttachmentImage(attachmentType)) {
      this.openImageModal(attachmentData, attachmentName);
    } else {
      // For PDF and other files, download
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