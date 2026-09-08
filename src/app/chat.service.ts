// chat.service.ts - Enhanced with better reconnection
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: Socket;
  private apiUrl = 'https://renderdemo-pnzm.onrender.com';
  private socketUrl = 'https://renderdemo-pnzm.onrender.com';
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // ✅ EventEmitters
  public messageReceived = new EventEmitter<any>();
  public onlineUsersUpdated = new EventEmitter<any>();
  public userTyping = new EventEmitter<any>();
  public messageRead = new EventEmitter<any>();
  public connectionStatus = this.connectionStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(userId: number): void {
    if (this.socket && this.isConnected) {
      console.log('⚠️ Already connected to chat');
      return;
    }

    try {
      this.socket = io(this.socketUrl, {
        query: { user_id: userId.toString() },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
        path: '/socket.io/'
      });

      this.socket.on('connect', () => {
        console.log('✅ Chat connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionStatusSubject.next(true);
        // Emit user online status
        this.socket.emit('user_online', { user_id: userId });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Chat disconnected:', reason);
        this.isConnected = false;
        this.connectionStatusSubject.next(false);
        
        // Attempt to reconnect if not intentional
        if (reason !== 'io client disconnect') {
          setTimeout(() => this.connect(userId), 2000);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Chat connection error:', error);
        this.isConnected = false;
        this.connectionStatusSubject.next(false);
        
        // Retry connection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(userId), 3000 * this.reconnectAttempts);
        }
      });

      this.socket.on('new_message', (data) => {
        console.log('📨 New message received:', data);
        this.messageReceived.emit(data);
      });

      this.socket.on('online_users', (data) => {
        console.log('👥 Online users updated:', data);
        this.onlineUsersUpdated.emit(data);
      });

      this.socket.on('user_typing', (data) => {
        this.userTyping.emit(data);
      });

      this.socket.on('message_read', (data) => {
        this.messageRead.emit(data);
      });

      this.socket.on('reconnect', () => {
        console.log('🔄 Chat reconnected');
        this.isConnected = true;
        this.connectionStatusSubject.next(true);
        this.socket.emit('user_online', { user_id: userId });
      });

    } catch (error) {
      console.error('❌ Error connecting to chat:', error);
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
      
      // Retry connection after delay
      setTimeout(() => this.connect(userId), 5000);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      // @ts-ignore
      this.socket = null;
      this.isConnected = false;
      this.connectionStatusSubject.next(false);
    }
  }

  joinChatRoom(room: string, userId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { room, user_id: userId });
    } else {
      console.warn('⚠️ Cannot join room - socket not connected');
      // Retry after connection
      setTimeout(() => {
        if (this.isConnected) {
          this.joinChatRoom(room, userId);
        }
      }, 1000);
    }
  }

  leaveChatRoom(room: string, userId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { room, user_id: userId });
    }
  }

  sendMessage(room: string, senderId: number, receiverId: number, message: string, attachment?: any): void {
    if (this.socket && this.isConnected) {
      const payload: any = {
        room,
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim()
      };
      
      if (attachment) {
        payload.attachment_data = attachment.data;
        payload.attachment_name = attachment.name;
        payload.attachment_type = attachment.type;
        payload.attachment_size = attachment.size;
      }
      
      this.socket.emit('send_message', payload);
      console.log('📤 Message sent:', payload);
    } else {
      console.warn('⚠️ Cannot send message - socket not connected');
      this.sendMessageViaHttp(senderId, receiverId, message, attachment).subscribe({
        next: (res) => {
          console.log('✅ Message sent via HTTP fallback:', res);
          // Emit the message locally
          this.messageReceived.emit({
            ...res,
            sender_id: senderId,
            receiver_id: receiverId,
            message: message,
            timestamp: new Date().toISOString()
          });
        },
        error: (err) => console.error('❌ Failed to send message:', err)
      });
    }
  }

  private sendMessageViaHttp(senderId: number, receiverId: number, message: string, attachment?: any): Observable<any> {
    const payload: any = {
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.trim()
    };
    
    if (attachment) {
      payload.attachment_data = attachment.data;
      payload.attachment_name = attachment.name;
      payload.attachment_type = attachment.type;
      payload.attachment_size = attachment.size;
    }
    
    return this.http.post(`${this.apiUrl}/api/chat/messages`, payload);
  }

  sendTyping(room: string, userId: number, isTyping: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', {
        room,
        user_id: userId,
        is_typing: isTyping
      });
    }
  }

  markAsRead(messageId: number, room: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_as_read', {
        message_id: messageId,
        room
      });
    } else {
      this.markMessageAsReadViaHttp(messageId).subscribe({
        next: () => console.log('✅ Message marked as read via HTTP'),
        error: (err) => console.error('❌ Failed to mark as read:', err)
      });
    }
  }

  private markMessageAsReadViaHttp(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/chat/messages/${messageId}/read`, {});
  }

  getOnlineUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/users/online`);
  }

  getChatMessages(receiverId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/messages/${receiverId}`);
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}