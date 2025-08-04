import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Collaborator {
  userId: string;
  email: string;
  name: string;
  color: string;
  isOnline: boolean;
  cursor?: {
    sectionId: string;
    position: number;
  };
  isTyping?: boolean;
  lastActivity: string;
}

export interface Comment {
  id: string;
  sectionId: string;
  userId: string;
  content: string;
  position?: {
    startOffset?: number;
    endOffset?: number;
    lineNumber?: number;
  };
  resolved: boolean;
  replies: Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationState {
  collaborators: Record<string, Collaborator>;
  comments: Record<string, Comment>;
  activeUsers: string[];
  typingUsers: Record<string, string>; // userId -> sectionId
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSync: string | null;
}

const initialState: CollaborationState = {
  collaborators: {},
  comments: {},
  activeUsers: [],
  typingUsers: {},
  connectionStatus: 'disconnected',
  lastSync: null,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // Connection management
    setConnectionStatus: (state, action: PayloadAction<CollaborationState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },

    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },

    // Collaborator management
    addCollaborator: (state, action: PayloadAction<Collaborator>) => {
      const collaborator = action.payload;
      state.collaborators[collaborator.userId] = collaborator;
      
      if (collaborator.isOnline && !state.activeUsers.includes(collaborator.userId)) {
        state.activeUsers.push(collaborator.userId);
      }
    },

    removeCollaborator: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      delete state.collaborators[userId];
      state.activeUsers = state.activeUsers.filter(id => id !== userId);
      delete state.typingUsers[userId];
    },

    updateCollaboratorCursor: (state, action: PayloadAction<{
      userId: string;
      cursor?: { sectionId: string; position: number };
      isTyping?: boolean;
    }>) => {
      const { userId, cursor, isTyping } = action.payload;
      
      if (state.collaborators[userId]) {
        if (cursor !== undefined) {
          state.collaborators[userId].cursor = cursor;
        }
        
        if (isTyping !== undefined) {
          state.collaborators[userId].isTyping = isTyping;
          
          if (isTyping && cursor) {
            state.typingUsers[userId] = cursor.sectionId;
          } else {
            delete state.typingUsers[userId];
          }
        }
        
        state.collaborators[userId].lastActivity = new Date().toISOString();
      }
    },

    setCollaboratorOffline: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      
      if (state.collaborators[userId]) {
        state.collaborators[userId].isOnline = false;
        state.activeUsers = state.activeUsers.filter(id => id !== userId);
        delete state.typingUsers[userId];
      }
    },

    // Comment management
    addComment: (state, action: PayloadAction<Comment>) => {
      const comment = action.payload;
      state.comments[comment.id] = comment;
    },

    updateComment: (state, action: PayloadAction<{
      commentId: string;
      content: string;
    }>) => {
      const { commentId, content } = action.payload;
      
      if (state.comments[commentId]) {
        state.comments[commentId].content = content;
        state.comments[commentId].updatedAt = new Date().toISOString();
      }
    },

    resolveComment: (state, action: PayloadAction<string>) => {
      const commentId = action.payload;
      
      if (state.comments[commentId]) {
        state.comments[commentId].resolved = true;
      }
    },

    deleteComment: (state, action: PayloadAction<string>) => {
      const commentId = action.payload;
      delete state.comments[commentId];
    },

    addCommentReply: (state, action: PayloadAction<{
      commentId: string;
      reply: {
        userId: string;
        content: string;
      };
    }>) => {
      const { commentId, reply } = action.payload;
      
      if (state.comments[commentId]) {
        state.comments[commentId].replies.push({
          id: `reply_${Date.now()}`,
          userId: reply.userId,
          content: reply.content,
          createdAt: new Date().toISOString(),
        });
      }
    },

    // Remote changes
    applyRemoteChange: (state, action: PayloadAction<{
      sectionId: string;
      changes: any;
      userId: string;
    }>) => {
      // This is handled by the proposal slice
      // We just update the last sync time here
      state.lastSync = new Date().toISOString();
    },

    // Clear collaboration state
    clearCollaboration: (state) => {
      state.collaborators = {};
      state.comments = {};
      state.activeUsers = [];
      state.typingUsers = {};
      state.lastSync = null;
    },
  },
});

export const {
  setConnectionStatus,
  setLastSync,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorCursor,
  setCollaboratorOffline,
  addComment,
  updateComment,
  resolveComment,
  deleteComment,
  addCommentReply,
  applyRemoteChange,
  clearCollaboration,
} = collaborationSlice.actions;

export default collaborationSlice.reducer;