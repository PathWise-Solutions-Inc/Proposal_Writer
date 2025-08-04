import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisClientType } from 'redis';
import jwt from 'jsonwebtoken';
import { logger, ProposalLogger } from '../utils/logger';
import { CacheService } from '../config/redis';
import { CollaborationMessage, CursorPosition } from '../types/proposal.types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  proposalId?: string;
}

export class CollaborationGateway {
  private io: SocketIOServer;
  private _redis: RedisClientType;
  private cacheService: CacheService;
  private connectedUsers: Map<string, Set<string>> = new Map(); // proposalId -> Set of userIds

  constructor(io: SocketIOServer, redis: RedisClientType) {
    this.io = io;
    this._redis = redis;
    this.cacheService = CacheService.getInstance(redis);
  }

  initialize() {
    // Authentication middleware for Socket.IO
    this.io.use(this.authenticateSocket.bind(this));

    // Handle connections
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('✅ Collaboration Gateway initialized');
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: Function) {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Handle demo token for development
      if (token === 'demo-access-token') {
        socket.userId = 'demo-user-id';
        socket.email = 'demo@example.com';
        return next();
      }

      // Verify JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      socket.userId = decoded.userId || decoded.id;
      socket.email = decoded.email;

      ProposalLogger.collaborationEvent('socket_authenticated', socket.userId || 'unknown', socket.userId || 'unknown', {
        socketId: socket.id
      });

      next();
    } catch (error) {
      ProposalLogger.security('Socket authentication failed', 'unknown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        socketId: socket.id
      });
      next(new Error('Authentication failed'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket) {
    if (!socket.userId) {
      socket.disconnect();
      return;
    }

    logger.info(`👤 User connected to collaboration`, {
      userId: socket.userId,
      socketId: socket.id
    });

    // Handle joining a proposal room
    socket.on('join-proposal', async (data: { proposalId: string }) => {
      await this.handleJoinProposal(socket, data.proposalId);
    });

    // Handle leaving a proposal room
    socket.on('leave-proposal', async (data: { proposalId: string }) => {
      await this.handleLeaveProposal(socket, data.proposalId);
    });

    // Handle cursor movement
    socket.on('cursor-move', async (data: CursorPosition) => {
      await this.handleCursorMove(socket, data);
    });

    // Handle content changes
    socket.on('content-change', async (data: any) => {
      await this.handleContentChange(socket, data);
    });

    // Handle section operations
    socket.on('section-add', async (data: any) => {
      await this.handleSectionAdd(socket, data);
    });

    socket.on('section-delete', async (data: any) => {
      await this.handleSectionDelete(socket, data);
    });

    socket.on('section-reorder', async (data: any) => {
      await this.handleSectionReorder(socket, data);
    });

    // Handle comments
    socket.on('comment-add', async (data: any) => {
      await this.handleCommentAdd(socket, data);
    });

    socket.on('comment-update', async (data: any) => {
      await this.handleCommentUpdate(socket, data);
    });

    socket.on('comment-resolve', async (data: any) => {
      await this.handleCommentResolve(socket, data);
    });

    // Handle typing indicators
    socket.on('typing-start', async (data: { proposalId: string; sectionId: string }) => {
      await this.handleTypingStart(socket, data);
    });

    socket.on('typing-stop', async (data: { proposalId: string; sectionId: string }) => {
      await this.handleTypingStop(socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      await this.handleDisconnect(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      ProposalLogger.error(error, 'WebSocket error', {
        userId: socket.userId,
        socketId: socket.id
      });
    });
  }

  private async handleJoinProposal(socket: AuthenticatedSocket, proposalId: string) {
    if (!socket.userId) return;

    try {
      // TODO: Verify user has access to this proposal
      // For now, allow all authenticated users

      // Join the proposal room
      await socket.join(`proposal:${proposalId}`);
      socket.proposalId = proposalId;

      // Track connected users
      if (!this.connectedUsers.has(proposalId)) {
        this.connectedUsers.set(proposalId, new Set());
      }
      this.connectedUsers.get(proposalId)!.add(socket.userId);

      // Set user presence in cache
      await this.cacheService.setUserPresence(proposalId, socket.userId, {
        socketId: socket.id,
        email: socket.email,
        joinedAt: new Date(),
        isOnline: true
      }, 300); // 5 minute TTL

      // Notify other users in the proposal
      const message: CollaborationMessage = {
        type: 'USER_JOINED',
        proposalId,
        userId: socket.userId,
        timestamp: Date.now(),
        data: {
          email: socket.email,
          joinedAt: new Date()
        }
      };

      socket.to(`proposal:${proposalId}`).emit('collaboration-event', message);

      // Send current online users to the joining user
      const onlineUsers = await this.cacheService.getAllUserPresence(proposalId);
      socket.emit('users-online', { proposalId, users: onlineUsers });

      ProposalLogger.collaborationEvent('user_joined', proposalId, socket.userId, {
        socketId: socket.id
      });

    } catch (error) {
      ProposalLogger.error(error as Error, 'Join proposal error', {
        proposalId,
        userId: socket.userId,
        socketId: socket.id
      });
      socket.emit('error', { message: 'Failed to join proposal' });
    }
  }

  private async handleLeaveProposal(socket: AuthenticatedSocket, proposalId: string) {
    if (!socket.userId) return;

    try {
      // Leave the proposal room
      await socket.leave(`proposal:${proposalId}`);

      // Remove from connected users
      const connectedInProposal = this.connectedUsers.get(proposalId);
      if (connectedInProposal) {
        connectedInProposal.delete(socket.userId);
        if (connectedInProposal.size === 0) {
          this.connectedUsers.delete(proposalId);
        }
      }

      // Remove user presence from cache
      await this.cacheService.removeUserPresence(proposalId, socket.userId);

      // Notify other users
      const message: CollaborationMessage = {
        type: 'USER_LEFT',
        proposalId,
        userId: socket.userId,
        timestamp: Date.now(),
        data: {}
      };

      socket.to(`proposal:${proposalId}`).emit('collaboration-event', message);

      ProposalLogger.collaborationEvent('user_left', proposalId, socket.userId, {
        socketId: socket.id
      });

    } catch (error) {
      ProposalLogger.error(error as Error, 'Leave proposal error', {
        proposalId,
        userId: socket.userId,
        socketId: socket.id
      });
    }
  }

  private async handleCursorMove(socket: AuthenticatedSocket, data: CursorPosition) {
    if (!socket.userId || !socket.proposalId) return;

    try {
      // Update cursor position in cache
      await this.cacheService.setUserPresence(socket.proposalId, socket.userId, {
        cursor: data,
        lastActivity: new Date()
      }, 30); // 30 second TTL for cursor positions

      // Broadcast cursor position to other users
      const message: CollaborationMessage = {
        type: 'CURSOR_MOVED',
        proposalId: socket.proposalId,
        userId: socket.userId,
        timestamp: Date.now(),
        data: data
      };

      socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

    } catch (error) {
      ProposalLogger.error(error as Error, 'Cursor move error', {
        proposalId: socket.proposalId,
        userId: socket.userId
      });
    }
  }

  private async handleContentChange(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    try {
      // TODO: Apply operational transformation for conflict resolution
      // For now, just broadcast the change

      const message: CollaborationMessage = {
        type: 'CONTENT_CHANGED',
        proposalId: socket.proposalId,
        userId: socket.userId,
        timestamp: Date.now(),
        data: {
          sectionId: data.sectionId,
          changes: data.changes,
          version: data.version
        }
      };

      socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

      ProposalLogger.collaborationEvent('content_changed', socket.proposalId, socket.userId, {
        sectionId: data.sectionId,
        changeType: data.changes?.type
      });

    } catch (error) {
      ProposalLogger.error(error as Error, 'Content change error', {
        proposalId: socket.proposalId,
        userId: socket.userId,
        sectionId: data.sectionId
      });
    }
  }

  private async handleSectionAdd(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'SECTION_ADDED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        section: data.section,
        parentId: data.parentId,
        index: data.index
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

    ProposalLogger.collaborationEvent('section_added', socket.proposalId, socket.userId, {
      sectionId: data.section?.id,
      sectionTitle: data.section?.title
    });
  }

  private async handleSectionDelete(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'SECTION_DELETED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        sectionId: data.sectionId
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

    ProposalLogger.collaborationEvent('section_deleted', socket.proposalId, socket.userId, {
      sectionId: data.sectionId
    });
  }

  private async handleSectionReorder(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'SECTION_REORDERED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        sectionOrders: data.sectionOrders
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

    ProposalLogger.collaborationEvent('sections_reordered', socket.proposalId, socket.userId, {
      sectionsCount: data.sectionOrders?.length
    });
  }

  private async handleCommentAdd(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'COMMENT_ADDED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        comment: {
          ...data.comment,
          userId: socket.userId,
          createdAt: new Date()
        }
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);

    ProposalLogger.collaborationEvent('comment_added', socket.proposalId, socket.userId, {
      sectionId: data.comment?.sectionId,
      commentId: data.comment?.id
    });
  }

  private async handleCommentUpdate(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'COMMENT_UPDATED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        commentId: data.commentId,
        content: data.content,
        updatedAt: new Date()
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);
  }

  private async handleCommentResolve(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId || !socket.proposalId) return;

    const message: CollaborationMessage = {
      type: 'COMMENT_RESOLVED',
      proposalId: socket.proposalId,
      userId: socket.userId,
      timestamp: Date.now(),
      data: {
        commentId: data.commentId,
        resolved: true,
        resolvedAt: new Date()
      }
    };

    socket.to(`proposal:${socket.proposalId}`).emit('collaboration-event', message);
  }

  private async handleTypingStart(socket: AuthenticatedSocket, data: { proposalId: string; sectionId: string }) {
    if (!socket.userId) return;

    socket.to(`proposal:${data.proposalId}`).emit('user-typing', {
      userId: socket.userId,
      sectionId: data.sectionId,
      isTyping: true
    });
  }

  private async handleTypingStop(socket: AuthenticatedSocket, data: { proposalId: string; sectionId: string }) {
    if (!socket.userId) return;

    socket.to(`proposal:${data.proposalId}`).emit('user-typing', {
      userId: socket.userId,
      sectionId: data.sectionId,
      isTyping: false
    });
  }

  private async handleDisconnect(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    logger.info(`👤 User disconnected from collaboration`, {
      userId: socket.userId,
      socketId: socket.id
    });

    // Clean up user presence for all proposals
    if (socket.proposalId) {
      await this.handleLeaveProposal(socket, socket.proposalId);
    }

    // Remove from all connected users tracking
    for (const [proposalId, users] of this.connectedUsers.entries()) {
      if (users.has(socket.userId)) {
        users.delete(socket.userId);
        if (users.size === 0) {
          this.connectedUsers.delete(proposalId);
        }

        // Clean up presence cache
        await this.cacheService.removeUserPresence(proposalId, socket.userId);
      }
    }
  }

  // Public methods for external use
  public async broadcastToProposal(proposalId: string, message: CollaborationMessage) {
    this.io.to(`proposal:${proposalId}`).emit('collaboration-event', message);
  }

  public async getConnectedUsers(proposalId: string): Promise<string[]> {
    const users = this.connectedUsers.get(proposalId);
    return users ? Array.from(users) : [];
  }

  public close() {
    this.io.close();
    logger.info('🔌 Collaboration Gateway closed');
  }
}