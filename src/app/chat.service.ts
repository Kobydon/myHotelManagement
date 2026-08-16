// chat.service.ts
import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: Socket;
  private apiUrl = 'https://renderdemo-pnzm.onrender.com'
  private socketUrl = 'https://renderdemo-pnzm.onrender.com'
  private isConnected: boolean = false;
  
  // ✅ EventEmitters
  public messageReceived = new EventEmitter<any>();
  public onlineUsersUpdated = new EventEmitter<any>();
  public userTyping = new EventEmitter<any>();
  public messageRead = new EventEmitter<any>();
  public connectionStatus = new EventEmitter<boolean>();

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
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('✅ Chat connected successfully');
        this.isConnected = true;
        this.connectionStatus.emit(true);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Chat disconnected');
        this.isConnected = false;
        this.connectionStatus.emit(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Chat connection error:', error);
        this.isConnected = false;
        this.connectionStatus.emit(false);
      });

      this.socket.on('new_message', (data) => {
        this.messageReceived.emit(data);
      });

      this.socket.on('online_users', (data) => {
        this.onlineUsersUpdated.emit(data);
      });

      this.socket.on('user_typing', (data) => {
        this.userTyping.emit(data);
      });

      this.socket.on('message_read', (data) => {
        this.messageRead.emit(data);
      });

    } catch (error) {
      console.error('❌ Error connecting to chat:', error);
      this.isConnected = false;
      this.connectionStatus.emit(false);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      // @ts-ignore - Ignore the type error since we're cleaning up
      this.socket = null;
      this.isConnected = false;
      this.connectionStatus.emit(false);
    }
  }

  joinChatRoom(room: string, userId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { room, user_id: userId });
    }
  }

  leaveChatRoom(room: string, userId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { room, user_id: userId });
    }
  }

  /**
   * Send a message with optional attachment
   * @param room - Chat room ID
   * @param senderId - ID of the sender
   * @param receiverId - ID of the receiver
   * @param message - Text message
   * @param attachment - Optional attachment object { data, name, type, size }
   */
  sendMessage(room: string, senderId: number, receiverId: number, message: string, attachment?: any): void {
    if (this.socket && this.isConnected) {
      const payload: any = {
        room,
        sender_id: senderId,
        receiver_id: receiverId,
        message: message.trim()
      };
      
      // ✅ Add attachment if present
      if (attachment) {
        payload.attachment_data = attachment.data;
        payload.attachment_name = attachment.name;
        payload.attachment_type = attachment.type;
        payload.attachment_size = attachment.size;
      }
      
      this.socket.emit('send_message', payload);
    } else {
      console.warn('⚠️ Cannot send message - socket not connected');
      // ✅ HTTP fallback with attachment
      this.sendMessageViaHttp(senderId, receiverId, message, attachment).subscribe({
        next: (res) => console.log('✅ Message sent via HTTP fallback:', res),
        error: (err) => console.error('❌ Failed to send message:', err)
      });
    }
  }

  /**
   * HTTP fallback for sending messages with attachment
   */
  private sendMessageViaHttp(senderId: number, receiverId: number, message: string, attachment?: any): Observable<any> {
    const payload: any = {
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.trim()
    };
    
    // ✅ Add attachment if present
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
      // ✅ HTTP fallback for marking as read
      this.markMessageAsReadViaHttp(messageId).subscribe({
        next: () => console.log('✅ Message marked as read via HTTP'),
        error: (err) => console.error('❌ Failed to mark as read:', err)
      });
    }
  }

  /**
   * HTTP fallback for marking message as read
   */
  private markMessageAsReadViaHttp(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/chat/messages/${messageId}/read`, {});
  }

  getOnlineUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/users/online`);
  }

  getChatMessages(receiverId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/chat/messages/${receiverId}`);
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}