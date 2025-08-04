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
  History
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { setCurrentProposal, updateProposalTitle } from '../store/slices/proposalSlice';
import { ProposalSection, SectionType } from '../types/section.types';
import SectionTree from '../components/proposal/SectionTree';

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id: proposalId } = useParams<{ id: string }>();
  
  const { currentProposal, sectionTree, loading, error } = useSelector(
    (state: RootState) => state.proposal
  );
  
  const [selectedSection, setSelectedSection] = useState<ProposalSection | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mock proposal data - in real app, this would come from API
  useEffect(() => {
    if (proposalId && !currentProposal) {
      // Mock loading a proposal
      const mockProposal = {
        id: proposalId,
        title: 'IT Services Proposal - Acme Corp',
        description: 'Comprehensive IT services proposal for Acme Corporation',
        sections: [
          {
            id: 'section_1',
            type: SectionType.HEADING,
            title: 'Executive Summary',
            content: { text: 'Executive Summary', level: 1 },
            order: 0,
            isCollapsed: false,
            isRequired: true,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['executive', 'summary']
            }
          },
          {
            id: 'section_2',
            type: SectionType.PARAGRAPH,
            title: 'Company Overview',
            content: { text: 'Our company has been providing exceptional IT services...' },
            order: 1,
            isCollapsed: false,
            isRequired: false,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['company', 'overview']
            }
          },
          {
            id: 'section_3',
            type: SectionType.GROUP,
            title: 'Technical Solution',
            content: { text: 'Technical Solution' },
            order: 2,
            isCollapsed: false,
            isRequired: true,
            children: [
              {
                id: 'section_3_1',
                type: SectionType.HEADING,
                title: 'Architecture Overview',
                content: { text: 'Architecture Overview', level: 2 },
                parentId: 'section_3',
                order: 0,
                isCollapsed: false,
                isRequired: true,
                metadata: {
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  tags: ['architecture', 'technical']
                }
              },
              {
                id: 'section_3_2',
                type: SectionType.LIST,
                title: 'Key Features',
                content: {
                  listType: 'unordered' as any,
                  listItems: [
                    'Scalable cloud infrastructure',
                    '24/7 monitoring and support',
                    'Advanced security protocols',
                    'Automated backup systems'
                  ]
                },
                parentId: 'section_3',
                order: 1,
                isCollapsed: false,
                isRequired: false,
                metadata: {
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  tags: ['features', 'technical']
                }
              }
            ],
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['technical', 'solution']
            }
          }
        ],
        rfpId: 'rfp_123',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user_123'
      };
      
      dispatch(setCurrentProposal(mockProposal));
    }
  }, [proposalId, currentProposal, dispatch]);

  const handleSaveProposal = async () => {
    if (!currentProposal) return;
    
    try {
      // In real app, this would save to API
      console.log('Saving proposal:', currentProposal);
      setHasUnsavedChanges(false);
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

          <Stack direction="row" spacing={1}>
            <Tooltip title="View history">
              <IconButton>
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
            
            <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
              {selectedSection ? (
                <Box>
                  <Typography variant="body1">
                    Content editor for "{selectedSection.title}" will be implemented here.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    This will include rich text editing, AI content generation, 
                    and integration with your content library.
                  </Typography>
                </Box>
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
    </Container>
  );
}