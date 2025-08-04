import React from 'react';
import { Box, Typography, Button, Alert, Snackbar } from '@mui/material';
import { ErrorOutline, Save, ContentCopy } from '@mui/icons-material';
import { ErrorBoundary } from '../ErrorBoundary';

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onSaveContent?: (content: string) => void;
  currentContent?: string;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showSnackbar: boolean;
}

export class EditorErrorBoundary extends ErrorBoundary {
  state: EditorErrorBoundaryState = {
    hasError: false,
    error: null,
    showSnackbar: false
  };
  
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Log editor-specific errors
    console.error('Editor error:', {
      error,
      errorInfo,
      hasUnsavedContent: !!(this.props as EditorErrorBoundaryProps).currentContent,
      timestamp: new Date().toISOString()
    });
  }
  
  private handleSaveContent = () => {
    const { onSaveContent, currentContent } = this.props as EditorErrorBoundaryProps;
    if (onSaveContent && currentContent) {
      onSaveContent(currentContent);
      this.setState({ showSnackbar: true });
    }
  };
  
  private handleCopyContent = () => {
    const { currentContent } = this.props as EditorErrorBoundaryProps;
    if (currentContent) {
      navigator.clipboard.writeText(currentContent);
      this.setState({ showSnackbar: true });
    }
  };
  
  public render() {
    if (this.state.hasError) {
      const { currentContent } = this.props as EditorErrorBoundaryProps;
      
      return (
        <>
          <Box p={2}>
            <Alert 
              severity="error" 
              icon={<ErrorOutline />}
              action={
                <Box>
                  {currentContent && (
                    <>
                      <Button 
                        color="inherit" 
                        size="small" 
                        startIcon={<Save />}
                        onClick={this.handleSaveContent}
                        sx={{ mr: 1 }}
                      >
                        Save Draft
                      </Button>
                      <Button 
                        color="inherit" 
                        size="small" 
                        startIcon={<ContentCopy />}
                        onClick={this.handleCopyContent}
                      >
                        Copy Content
                      </Button>
                    </>
                  )}
                </Box>
              }
            >
              <Typography variant="subtitle1" gutterBottom>
                Editor Error
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The editor encountered an error. Your content has been preserved.
                {currentContent && ' You can save a draft or copy your content to clipboard.'}
              </Typography>
            </Alert>
          </Box>
          
          <Snackbar
            open={this.state.showSnackbar}
            autoHideDuration={3000}
            onClose={() => this.setState({ showSnackbar: false })}
            message="Content saved successfully"
          />
        </>
      );
    }
    
    return this.props.children;
  }
}