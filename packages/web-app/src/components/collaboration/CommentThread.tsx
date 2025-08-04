import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Collapse,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Comment as CommentIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  updateComment, 
  deleteComment, 
  resolveComment,
  addCommentReply 
} from '../../store/slices/collaborationSlice';
import websocketService from '../../services/websocket.service';

interface CommentThreadProps {
  commentId: string;
  onClose?: () => void;
  embedded?: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  commentId,
  onClose,
  embedded = false,
}) => {
  const dispatch = useDispatch();
  const comment = useSelector((state: RootState) => state.collaboration.comments[commentId]);
  const collaborators = useSelector((state: RootState) => state.collaboration.collaborators);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment?.content || '');
  const [showReplies, setShowReplies] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!comment) return null;

  const author = collaborators[comment.userId] || {
    name: 'Unknown User',
    email: 'unknown@example.com',
    color: '#888',
  };

  const isAuthor = currentUser?.id === comment.userId;

  const handleReply = () => {
    if (replyText.trim()) {
      dispatch(addCommentReply({
        commentId,
        reply: {
          userId: currentUser?.id || '',
          content: replyText.trim(),
        },
      }));
      
      // Send through WebSocket
      websocketService.addComment(comment.sectionId, replyText.trim());
      
      setReplyText('');
    }
  };

  const handleUpdate = () => {
    if (editText.trim() && editText !== comment.content) {
      dispatch(updateComment({
        commentId,
        content: editText.trim(),
      }));
      
      websocketService.updateComment(commentId, editText.trim());
    }
    setIsEditing(false);
  };

  const handleResolve = () => {
    dispatch(resolveComment(commentId));
    websocketService.resolveComment(commentId);
  };

  const handleDelete = () => {
    dispatch(deleteComment(commentId));
    setAnchorEl(null);
    onClose?.();
  };

  const getInitials = (name: string, email: string): string => {
    if (name && name.trim()) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <Paper
      elevation={embedded ? 0 : 2}
      sx={{
        p: 2,
        maxWidth: embedded ? '100%' : 400,
        backgroundColor: comment.resolved ? 'action.hover' : 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Avatar
          sx={{
            bgcolor: author.color,
            width: 32,
            height: 32,
            fontSize: 14,
            mr: 1,
          }}
        >
          {getInitials(author.name || '', author.email)}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2">
              {author.name || author.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </Typography>
            {comment.resolved && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Resolved"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {/* Actions Menu */}
        <Box>
          {isAuthor && (
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content */}
      {isEditing ? (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            size="small"
            autoFocus
          />
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button size="small" onClick={handleUpdate} variant="contained">
              Save
            </Button>
            <Button size="small" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {comment.content}
        </Typography>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <>
          <Button
            size="small"
            onClick={() => setShowReplies(!showReplies)}
            startIcon={<CommentIcon />}
          >
            {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
          </Button>
          
          <Collapse in={showReplies}>
            <Box sx={{ mt: 2 }}>
              {comment.replies.map((reply) => {
                const replyAuthor = collaborators[reply.userId] || {
                  name: 'Unknown User',
                  email: 'unknown@example.com',
                  color: '#888',
                };
                
                return (
                  <Box key={reply.id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: replyAuthor.color,
                        width: 24,
                        height: 24,
                        fontSize: 12,
                      }}
                    >
                      {getInitials(replyAuthor.name || '', replyAuthor.email)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight="medium">
                          {replyAuthor.name || replyAuthor.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {reply.content}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Reply Input */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleReply();
            }
          }}
          size="small"
          multiline
          rows={1}
        />
        <Button
          onClick={handleReply}
          disabled={!replyText.trim()}
          startIcon={<ReplyIcon />}
        >
          Reply
        </Button>
      </Box>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { setIsEditing(true); setAnchorEl(null); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {!comment.resolved && (
          <MenuItem onClick={() => { handleResolve(); setAnchorEl(null); }}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
            Resolve
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default CommentThread;