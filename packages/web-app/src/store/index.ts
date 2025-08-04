import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import authReducer from './slices/authSlice';
import proposalReducer from './slices/proposalSlice';
import uiReducer from './slices/uiSlice';

// Enable Immer MapSet plugin for Set and Map support
enableMapSet();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    proposal: proposalReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredActionsPaths: [
          'payload.expandedSections',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.sections',
          'payload.metadata'
        ],
        ignoredPaths: [
          'proposal.sectionTree.expandedSections',
          'proposal.currentProposal.createdAt',
          'proposal.currentProposal.updatedAt',
          'proposal.currentProposal.sections',
          'proposal.proposals'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;