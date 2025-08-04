import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { 
  addCollaborator, 
  removeCollaborator, 
  updateCollaboratorCursor,
  applyRemoteChange,
  addComment,
  updateComment,
  resolveComment
} from '../store/slices/collaborationSlice';
import { updateSection } from '../store/slices/proposalSlice';

export interface CollaboratorPresence {
  userId: string;
  email: string;
  name: string;
  color: string;
  cursor?: {
    sectionId: string;
    position: number;
  };
  isTyping?: boolean;
  lastActivity: string;
}

export interface CollaborationEvent {
  type: string;
  proposalId: string;
  userId: string;
  timestamp: number;
  data: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private proposalId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    // Initialize socket connection when service is created
    this.connect();
  }

  connect() {
    const token = localStorage.getItem('access_token') || 'demo-access-token';
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8003';

    this.socket = io(wsUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Rejoin proposal room if we were in one
      if (this.proposalId) {
        this.joinProposal(this.proposalId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    // Collaboration events
    this.socket.on('collaboration-event', (event: CollaborationEvent) => {
      this.handleCollaborationEvent(event);
    });

    // User presence events
    this.socket.on('users-online', ({ proposalId, users }) => {
      console.log('Users online:', users);
      // Update Redux store with online users
      users.forEach((user: any) => {
        store.dispatch(addCollaborator({
          userId: user.userId,
          email: user.email,
          name: user.email, // TODO: Get actual name
          color: this.getUserColor(user.userId),
          isOnline: true,
          lastActivity: new Date().toISOString()
        }));
      });
    });

    // Typing indicators
    this.socket.on('user-typing', ({ userId, sectionId, isTyping }) => {
      store.dispatch(updateCollaboratorCursor({
        userId,
        cursor: { sectionId, position: 0 },
        isTyping
      }));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleCollaborationEvent(event: CollaborationEvent) {
    const { type, userId, data } = event;

    switch (type) {
      case 'USER_JOINED':
        store.dispatch(addCollaborator({
          userId,
          email: data.email,
          name: data.email,
          color: this.getUserColor(userId),
          isOnline: true,
          lastActivity: new Date().toISOString()
        }));
        break;

      case 'USER_LEFT':
        store.dispatch(removeCollaborator(userId));
        break;

      case 'CURSOR_MOVED':
        store.dispatch(updateCollaboratorCursor({
          userId,
          cursor: data
        }));
        break;

      case 'CONTENT_CHANGED':
        store.dispatch(applyRemoteChange({
          sectionId: data.sectionId,
          changes: data.changes,
          userId
        }));
        break;

      case 'SECTION_ADDED':
      case 'SECTION_DELETED':
      case 'SECTION_REORDERED':
        // These are handled by the proposal slice
        // We might want to add notifications here
        break;

      case 'COMMENT_ADDED':
        store.dispatch(addComment(data.comment));
        break;

      case 'COMMENT_UPDATED':
        store.dispatch(updateComment({
          commentId: data.commentId,
          content: data.content
        }));
        break;

      case 'COMMENT_RESOLVED':
        store.dispatch(resolveComment(data.commentId));
        break;
    }
  }

  // Public methods
  joinProposal(proposalId: string) {
    if (!this.socket) return;
    
    this.proposalId = proposalId;
    this.socket.emit('join-proposal', { proposalId });
  }

  leaveProposal(proposalId: string) {
    if (!this.socket) return;
    
    this.socket.emit('leave-proposal', { proposalId });
    this.proposalId = null;
  }

  sendCursorPosition(sectionId: string, position: number) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('cursor-move', {
      sectionId,
      position,
      proposalId: this.proposalId
    });
  }

  sendContentChange(sectionId: string, changes: any) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('content-change', {
      sectionId,
      changes,
      proposalId: this.proposalId
    });
  }

  sendSectionAdd(section: any, parentId?: string, index?: number) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('section-add', {
      section,
      parentId,
      index,
      proposalId: this.proposalId
    });
  }

  sendSectionDelete(sectionId: string) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('section-delete', {
      sectionId,
      proposalId: this.proposalId
    });
  }

  sendSectionReorder(sectionOrders: Array<{ id: string; order: number; parentId?: string }>) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('section-reorder', {
      sectionOrders,
      proposalId: this.proposalId
    });
  }

  sendTypingIndicator(sectionId: string, isTyping: boolean) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit(isTyping ? 'typing-start' : 'typing-stop', {
      proposalId: this.proposalId,
      sectionId
    });
  }

  addComment(sectionId: string, content: string, position?: any) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('comment-add', {
      proposalId: this.proposalId,
      comment: {
        id: `comment_${Date.now()}`,
        sectionId,
        content,
        position,
        createdAt: new Date().toISOString()
      }
    });
  }

  updateComment(commentId: string, content: string) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('comment-update', {
      proposalId: this.proposalId,
      commentId,
      content
    });
  }

  resolveComment(commentId: string) {
    if (!this.socket || !this.proposalId) return;
    
    this.socket.emit('comment-resolve', {
      proposalId: this.proposalId,
      commentId
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Helper methods
  private getUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#B983FF', '#FD79A8', '#A0E7E5'
    ];
    
    // Generate consistent color based on user ID
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export for use in components
export default websocketService;