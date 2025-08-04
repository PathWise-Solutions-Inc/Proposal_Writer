import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Stack,
  Alert,
  TextField
} from '@mui/material';
import {
  Home,
  ChevronRight,
  Save,
  Preview,
  Download,
  Share,
  Settings,
  History,
  AutoAwesome
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { setCurrentProposal, updateProposalTitle, updateSection } from '../store/slices/proposalSlice';
import { ProposalSection, SectionType } from '../types/section.types';
import SectionTree from '../components/proposal/SectionTree';
import CollaboratorPresence from '../components/collaboration/CollaboratorPresence';
import VersionHistory from '../components/proposal/VersionHistory';
// import { RichTextEditor } from '../components/proposal/rich-text-editor';
import AIContentGenerator from '../components/proposal/AIContentGenerator';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAutoSave } from '../hooks/useAutoSave';

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: proposalId } = useParams<{ id: string }>();
  const { isConnected } = useWebSocket();
  
  const { currentProposal, sectionTree, loading, error, proposals } = useSelector(
    (state: RootState) => state.proposal
  );
  
  const [selectedSection, setSelectedSection] = useState<ProposalSection | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');

  // Load proposal from store or redirect if not found
  useEffect(() => {
    if (proposalId && !currentProposal) {
      // Check if proposal exists in the store
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        // Proposal not found, redirect to proposals list
        navigate('/proposals');
        return;
      }
      
      // Set current proposal if found
      dispatch(setCurrentProposal(proposal));
    }
  }, [proposalId, currentProposal, proposals, dispatch, navigate]);

  // Auto-save functionality
  const { triggerSave } = useAutoSave({
    onSave: async () => {
      if (!currentProposal) return;
      
      // In real app, this would save to API
      console.log('Auto-saving proposal:', currentProposal);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    interval: 30000, // 30 seconds
    debounceDelay: 2000, // 2 seconds
  });

  const handleSaveProposal = async () => {
    if (!currentProposal) return;
    
    try {
      // In real app, this would save to API
      console.log('Saving proposal:', currentProposal);
      setHasUnsavedChanges(false);
      
      // Trigger manual save
      await triggerSave();
    } catch (error) {
      console.error('Failed to save proposal:', error);
    }
  };

  const handlePreviewProposal = () => {
    // Navigate to preview page
    navigate(`/proposals/${proposalId}/preview`);
  };

  const handleSectionSelect = (section: ProposalSection) => {
    setSelectedSection(section);
    // Load section content into editor
    // Handle case where content might be a string or object
    const contentText = typeof section.content === 'string' 
      ? section.content 
      : section.content?.text || '';
    setEditorContent(contentText);
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
    
    // Update section content in Redux
    if (selectedSection) {
      dispatch(updateSection({
        sectionId: selectedSection.id,
        updates: {
          content: typeof selectedSection.content === 'string'
            ? { text: content }
            : { ...selectedSection.content, text: content }
        }
      }));
    }
  };

  const handleAIContentGenerated = (content: string) => {
    setEditorContent(content);
    handleContentChange(content);
    setShowAIGenerator(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>Loading proposal...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentProposal) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Proposal not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs 
          separator={<ChevronRight fontSize="small" />} 
          sx={{ mb: 2 }}
        >
          <Link 
            color="inherit" 
            href="/dashboard" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link color="inherit" href="/proposals">
            Proposals
          </Link>
          <Typography color="text.primary">
            {currentProposal.title}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              {currentProposal.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={currentProposal.status} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(currentProposal.updatedAt).toLocaleDateString()}
              </Typography>
              {hasUnsavedChanges && (
                <Chip label="Unsaved changes" size="small" color="warning" />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Collaboration Presence */}
            <CollaboratorPresence />
            
            <Divider orientation="vertical" flexItem />
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="View history">
                <IconButton onClick={() => setShowVersionHistory(true)}>
                  <History />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Settings">
                <IconButton>
                  <Settings />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={handlePreviewProposal}
              >
                Preview
              </Button>
              
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProposal}
                disabled={!hasUnsavedChanges}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Section Tree Panel */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper 
            variant="outlined" 
            sx={{ 
              height: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Proposal Structure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag and drop sections to reorganize
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <SectionTree
                showControls={true}
                readOnly={false}
                maxHeight="100%"
                onSectionSelect={handleSectionSelect}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Content Editor Panel */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper 
            variant="outlined" 
            sx={{ 
              height: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedSection ? selectedSection.title : 'Content Editor'}
                </Typography>
                
                {selectedSection && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<Download />}>
                      Export Section
                    </Button>
                    <Button size="small" startIcon={<Share />}>
                      Share
                    </Button>
                  </Stack>
                )}
              </Box>
              
              {selectedSection && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedSection.type} • {selectedSection.isRequired ? 'Required' : 'Optional'}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedSection ? (
                <>
                  {/* Editor Actions Bar */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid', 
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={selectedSection.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      {selectedSection.isRequired && (
                        <Chip 
                          label="Required" 
                          size="small" 
                          color="error" 
                          variant="outlined" 
                        />
                      )}
                    </Stack>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowAIGenerator(true)}
                      startIcon={<AutoAwesome />}
                    >
                      AI Generate
                    </Button>
                  </Box>

                  {/* Content Editor */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Enter your content here..."
                      sx={{
                        '& .MuiInputBase-root': {
                          height: '100%',
                          alignItems: 'flex-start',
                        },
                        '& .MuiInputBase-input': {
                          height: '100% !important',
                          overflow: 'auto !important',
                        },
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Select a section to edit
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a section from the structure panel on the left to start editing content
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Version History Dialog */}
      {showVersionHistory && currentProposal && (
        <VersionHistory
          proposalId={currentProposal.id}
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onRestore={(version) => {
            console.log('Restoring version:', version);
            // In real app, this would restore the selected version
            setShowVersionHistory(false);
          }}
        />
      )}

      {/* AI Content Generator Dialog */}
      {showAIGenerator && selectedSection && (
        <AIContentGenerator
          section={selectedSection}
          onContentGenerated={handleAIContentGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </Container>
  );
}