import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { ErrorBoundary } from '../ErrorBoundary';

interface ProposalErrorBoundaryProps {
  children: React.ReactNode;
  proposalId?: string;
}

export class ProposalErrorBoundary extends ErrorBoundary {
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Log proposal-specific errors with context
    console.error('Proposal error:', {
      error,
      errorInfo,
      proposalId: (this.props as ProposalErrorBoundaryProps).proposalId,
      timestamp: new Date().toISOString()
    });
  }
  
  public render() {
    if (this.state.hasError) {
      const { proposalId } = this.props as ProposalErrorBoundaryProps;
      
      return (
        <Box p={3}>
          <Alert 
            severity="error" 
            icon={<ErrorOutline />}
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<Refresh />}
                onClick={this.handleReset}
              >
                Retry
              </Button>
            }
          >
            <Typography variant="subtitle1" gutterBottom>
              Error Loading Proposal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {process.env.NODE_ENV === 'development' 
                ? this.state.error?.message 
                : 'Unable to load the proposal. Please try refreshing or contact support if the issue persists.'}
            </Typography>
            {proposalId && (
              <Typography variant="caption" display="block" mt={1}>
                Proposal ID: {proposalId}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }
    
    return this.props.children;
  }
}