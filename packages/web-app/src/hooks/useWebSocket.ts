import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import websocketService from '../services/websocket.service';
import { setConnectionStatus } from '../store/slices/collaborationSlice';
import { RootState } from '../store';

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const { id: proposalId } = useParams<{ id: string }>();
  const currentProposalId = useRef<string | null>(null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Initialize WebSocket connection
  useEffect(() => {
    if (isAuthenticated) {
      // Connection is already established in the service constructor
      dispatch(setConnectionStatus('connecting'));
      
      // Check connection status after a short delay
      const checkConnection = setTimeout(() => {
        if (websocketService.isConnected) {
          dispatch(setConnectionStatus('connected'));
        } else {
          dispatch(setConnectionStatus('error'));
        }
      }, 1000);

      return () => clearTimeout(checkConnection);
    }
  }, [isAuthenticated, dispatch]);

  // Join/leave proposal rooms
  useEffect(() => {
    if (proposalId && websocketService.isConnected && proposalId !== currentProposalId.current) {
      // Leave previous proposal room if any
      if (currentProposalId.current) {
        websocketService.leaveProposal(currentProposalId.current);
      }

      // Join new proposal room
      websocketService.joinProposal(proposalId);
      currentProposalId.current = proposalId;
    }

    return () => {
      if (currentProposalId.current) {
        websocketService.leaveProposal(currentProposalId.current);
        currentProposalId.current = null;
      }
    };
  }, [proposalId]);

  // WebSocket methods
  const sendCursorPosition = useCallback((sectionId: string, position: number) => {
    websocketService.sendCursorPosition(sectionId, position);
  }, []);

  const sendContentChange = useCallback((sectionId: string, changes: any) => {
    websocketService.sendContentChange(sectionId, changes);
  }, []);

  const sendTypingIndicator = useCallback((sectionId: string, isTyping: boolean) => {
    websocketService.sendTypingIndicator(sectionId, isTyping);
  }, []);

  const sendSectionAdd = useCallback((section: any, parentId?: string, index?: number) => {
    websocketService.sendSectionAdd(section, parentId, index);
  }, []);

  const sendSectionDelete = useCallback((sectionId: string) => {
    websocketService.sendSectionDelete(sectionId);
  }, []);

  const sendSectionReorder = useCallback((sectionOrders: any[]) => {
    websocketService.sendSectionReorder(sectionOrders);
  }, []);

  const addComment = useCallback((sectionId: string, content: string, position?: any) => {
    websocketService.addComment(sectionId, content, position);
  }, []);

  const updateComment = useCallback((commentId: string, content: string) => {
    websocketService.updateComment(commentId, content);
  }, []);

  const resolveComment = useCallback((commentId: string) => {
    websocketService.resolveComment(commentId);
  }, []);

  return {
    isConnected: websocketService.isConnected,
    sendCursorPosition,
    sendContentChange,
    sendTypingIndicator,
    sendSectionAdd,
    sendSectionDelete,
    sendSectionReorder,
    addComment,
    updateComment,
    resolveComment,
  };
};