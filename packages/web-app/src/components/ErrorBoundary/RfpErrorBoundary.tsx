import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../ErrorBoundary';

interface RfpErrorBoundaryProps {
  children: React.ReactNode;
  rfpId?: string;
}

export class RfpErrorBoundary extends ErrorBoundary {
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Log RFP-specific errors
    console.error('RFP analysis error:', {
      error,
      errorInfo,
      rfpId: (this.props as RfpErrorBoundaryProps).rfpId,
      timestamp: new Date().toISOString()
    });
  }
  
  public render() {
    if (this.state.hasError) {
      return <RfpErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    
    return this.props.children;
  }
}

const RfpErrorFallback: React.FC<{
  error: Error | null;
  onReset: () => void;
}> = ({ error, onReset }) => {
  const navigate = useNavigate();
  
  return (
    <Box p={3}>
      <Alert 
        severity="error" 
        icon={<ErrorOutline />}
        action={
          <Box>
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<Refresh />}
              onClick={onReset}
              sx={{ mr: 1 }}
            >
              Retry
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<Home />}
              onClick={() => navigate('/rfp-analysis')}
            >
              Back to RFP List
            </Button>
          </Box>
        }
      >
        <Typography variant="subtitle1" gutterBottom>
          RFP Analysis Error
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {process.env.NODE_ENV === 'development' 
            ? error?.message 
            : 'Unable to process the RFP. This might be due to file format issues or temporary server problems.'}
        </Typography>
      </Alert>
    </Box>
  );
};