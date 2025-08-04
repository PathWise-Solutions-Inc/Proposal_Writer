import React from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Tooltip,
  Chip,
  Typography,
  Badge,
  styled,
  keyframes
} from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const OnlineBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    animation: `${pulse} 2s infinite`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: '1px solid currentColor',
      content: '""',
    },
  },
}));

const CollaboratorPresence: React.FC = () => {
  const { collaborators, activeUsers, connectionStatus } = useSelector(
    (state: RootState) => state.collaboration
  );
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);

  const onlineCollaborators = activeUsers
    .filter(userId => userId !== currentUserId)
    .map(userId => collaborators[userId])
    .filter(Boolean);

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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Connection Status */}
      <Tooltip title={`Status: ${getStatusText()}`}>
        <Chip
          icon={<CircleIcon sx={{ fontSize: 12 }} />}
          label={getStatusText()}
          size="small"
          color={getStatusColor()}
          variant="outlined"
          sx={{ 
            '& .MuiChip-icon': { 
              animation: connectionStatus === 'connecting' ? `${pulse} 1s infinite` : 'none' 
            }
          }}
        />
      </Tooltip>

      {/* Active Collaborators */}
      {onlineCollaborators.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary">
            {onlineCollaborators.length} active {onlineCollaborators.length === 1 ? 'user' : 'users'}
          </Typography>
          
          <AvatarGroup max={4} spacing="medium">
            {onlineCollaborators.map((collaborator) => (
              <Tooltip
                key={collaborator.userId}
                title={
                  <Box>
                    <Typography variant="body2">{collaborator.name || collaborator.email}</Typography>
                    {collaborator.isTyping && (
                      <Typography variant="caption" color="primary">
                        Currently typing...
                      </Typography>
                    )}
                  </Box>
                }
              >
                <OnlineBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <Avatar
                    sx={{
                      bgcolor: collaborator.color,
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      border: collaborator.isTyping ? `2px solid ${collaborator.color}` : 'none',
                      animation: collaborator.isTyping ? `${pulse} 1s infinite` : 'none',
                    }}
                  >
                    {getInitials(collaborator.name, collaborator.email)}
                  </Avatar>
                </OnlineBadge>
              </Tooltip>
            ))}
          </AvatarGroup>
        </>
      )}

      {/* No active collaborators */}
      {connectionStatus === 'connected' && onlineCollaborators.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Working solo
        </Typography>
      )}
    </Box>
  );
};

export default CollaboratorPresence;