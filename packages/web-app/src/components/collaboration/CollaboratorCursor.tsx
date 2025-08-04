import React, { useEffect, useState } from 'react';
import { Box, Typography, Fade, styled } from '@mui/material';
import { keyframes } from '@mui/system';

const blink = keyframes`
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
`;

const fadeInOut = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
`;

const CursorContainer = styled(Box)<{ color: string }>(({ color }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 1000,
  transition: 'all 0.15s ease-out',
}));

const CursorLine = styled(Box)<{ color: string }>(({ color }) => ({
  width: '2px',
  height: '20px',
  backgroundColor: color,
  animation: `${blink} 1s infinite`,
  position: 'relative',
}));

const CursorLabel = styled(Box)<{ color: string }>(({ color }) => ({
  position: 'absolute',
  top: '-24px',
  left: '0',
  backgroundColor: color,
  color: 'white',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  animation: `${fadeInOut} 3s ease-out`,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-4px',
    left: '8px',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: `4px solid ${color}`,
  },
}));

interface CollaboratorCursorProps {
  userId: string;
  name: string;
  color: string;
  position: { top: number; left: number };
  isTyping?: boolean;
  showLabel?: boolean;
}

const CollaboratorCursor: React.FC<CollaboratorCursorProps> = ({
  userId,
  name,
  color,
  position,
  isTyping = false,
  showLabel = true,
}) => {
  const [isLabelVisible, setIsLabelVisible] = useState(true);

  useEffect(() => {
    // Hide label after 3 seconds
    const timer = setTimeout(() => {
      setIsLabelVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [position]);

  // Show label when position changes significantly
  useEffect(() => {
    setIsLabelVisible(true);
  }, [position.top, position.left]);

  return (
    <CursorContainer
      color={color}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <CursorLine color={color} />
      
      <Fade in={showLabel && isLabelVisible}>
        <CursorLabel color={color}>
          <Typography variant="caption" sx={{ color: 'inherit' }}>
            {name}
            {isTyping && ' (typing...)'}
          </Typography>
        </CursorLabel>
      </Fade>
    </CursorContainer>
  );
};

export default CollaboratorCursor;