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
  Alert
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
  AutoAwesome,
  Keyboard
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { 
  setCurrentProposal, 
  updateProposalTitle, 
  updateSection,
  addSection,
  deleteSection,
  duplicateSection 
} from '../store/slices/proposalSlice';
import { ProposalSection, SectionType } from '../types/section.types';
import SectionTree from '../components/proposal/SectionTree';
import CollaboratorPresence from '../components/collaboration/CollaboratorPresence';
import VersionHistory from '../components/proposal/VersionHistory';
import { RichTextEditor } from '../components/proposal/RichTextEditor';
import AIContentGenerator from '../components/proposal/AIContentGenerator';
import { KeyboardShortcutsDialog } from '../components/proposal/KeyboardShortcutsDialog';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAutoSave } from '../hooks/useAutoSave';
import { ProposalErrorBoundary, EditorErrorBoundary } from '../components/ErrorBoundary';
import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const [showSectionTree, setShowSectionTree] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Initialize keyboard shortcuts
  useGlobalKeyboardShortcuts();

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

  // Keyboard shortcut event listeners
  useEffect(() => {
    const handleSaveShortcut = () => handleSaveProposal();
    const handlePreviewShortcut = () => handlePreviewProposal();
    const handleNewSectionShortcut = () => {
      // Add new section logic
      if (selectedSection) {
        dispatch(addSection({ parentId: selectedSection.id }));
      }
    };
    const handleDuplicateShortcut = () => {
      if (selectedSection) {
        dispatch(duplicateSection(selectedSection.id));
      }
    };
    const handleDeleteShortcut = () => {
      if (selectedSection && window.confirm('Delete this section?')) {
        dispatch(deleteSection(selectedSection.id));
        setSelectedSection(null);
      }
    };
    const handleAIGenerateShortcut = () => setShowAIGenerator(true);
    const handleToggleTreeShortcut = () => setShowSectionTree(prev => !prev);

    window.addEventListener('proposal:save', handleSaveShortcut);
    window.addEventListener('proposal:preview', handlePreviewShortcut);
    window.addEventListener('section:new', handleNewSectionShortcut);
    window.addEventListener('section:duplicate', handleDuplicateShortcut);
    window.addEventListener('section:delete', handleDeleteShortcut);
    window.addEventListener('ai:generate', handleAIGenerateShortcut);
    window.addEventListener('tree:toggle', handleToggleTreeShortcut);

    return () => {
      window.removeEventListener('proposal:save', handleSaveShortcut);
      window.removeEventListener('proposal:preview', handlePreviewShortcut);
      window.removeEventListener('section:new', handleNewSectionShortcut);
      window.removeEventListener('section:duplicate', handleDuplicateShortcut);
      window.removeEventListener('section:delete', handleDeleteShortcut);
      window.removeEventListener('ai:generate', handleAIGenerateShortcut);
      window.removeEventListener('tree:toggle', handleToggleTreeShortcut);
    };
  }, [selectedSection, dispatch]);

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
    <ProposalErrorBoundary proposalId={id}>
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
              
              <Tooltip title="Keyboard shortcuts">
                <IconButton onClick={() => setShowKeyboardShortcuts(true)}>
                  <Keyboard />
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
        {showSectionTree && (
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
        )}

        {/* Content Editor Panel */}
        <Grid item xs={12} md={showSectionTree ? 8 : 12} lg={showSectionTree ? 9 : 12}>
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
                  <Box sx={{ flex: 1, p: 2 }}>
                    <EditorErrorBoundary 
                      currentContent={editorContent}
                      onSaveContent={(content) => {
                        // Handle emergency save
                        handleContentChange(content);
                        handleSaveProposal();
                      }}
                    >
                      <RichTextEditor
                        initialContent={editorContent}
                        onChange={handleContentChange}
                        placeholder="Enter your content here..."
                        readOnly={false}
                      />
                    </EditorErrorBoundary>
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

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </Container>
    </ProposalErrorBoundary>
  );
}