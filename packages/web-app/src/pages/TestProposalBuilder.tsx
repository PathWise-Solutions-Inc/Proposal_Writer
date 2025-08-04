import React, { useState } from 'react';
import { Container, Grid, Paper, Box, Typography, Button, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { ProposalSection, SectionType } from '../types/section.types';
import SectionTree from '../components/proposal/SectionTree';
import SectionEditor from '../components/proposal/SectionEditor';
import { setCurrentProposal, addSection, updateSection } from '../store/slices/proposalSlice';
import { RootState } from '../store';

const TestProposalBuilder: React.FC = () => {
  const dispatch = useDispatch();
  const { sectionTree } = useSelector((state: RootState) => state.proposal);
  const [selectedSection, setSelectedSection] = useState<ProposalSection | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);

  React.useEffect(() => {
    // Create test proposal with sections containing long text
    const testProposal = {
      id: 'test-1',
      title: 'Test Proposal - UI Issue Demo',
      description: 'Demonstrating the structure panel text overflow issue',
      sections: [
        {
          id: 'section-1',
          type: SectionType.HEADING,
          title: 'Executive Summary',
          content: { 
            text: 'This is a very long executive summary text that should not be displayed in full in the proposal structure panel. It contains detailed information about our company, our experience, our approach to solving the client problems, and much more content that would make the structure panel completely unreadable if displayed in full.',
            level: 1 
          },
          order: 1,
          isRequired: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        {
          id: 'section-2',
          type: SectionType.PARAGRAPH,
          title: 'Company Background',
          content: { 
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. This paragraph contains a lot of text that will overflow in the structure panel.'
          },
          order: 2,
          isRequired: false,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        {
          id: 'section-3',
          type: SectionType.LIST,
          title: 'Key Deliverables',
          content: { 
            listType: 'unordered',
            listItems: ['Item 1', 'Item 2', 'Item 3']
          },
          order: 3,
          isRequired: true,
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      ],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test-user'
    };

    dispatch(setCurrentProposal(testProposal));
  }, [dispatch]);

  const handleSectionSelect = (section: ProposalSection) => {
    setSelectedSection(section);
    // Load section content into editor
    const contentText = typeof section.content === 'string' 
      ? section.content 
      : section.content?.text || '';
    setEditorContent(contentText);
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    
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

  const handleEditSection = (section: ProposalSection) => {
    setSelectedSection(section);
    setShowEditor(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Test Proposal Builder - UI Issue Demo
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Proposal Structure</Typography>
              <Typography variant="body2" color="text.secondary">
                Notice how the long content text appears in the structure panel
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <SectionTree 
                onSectionSelect={handleSectionSelect}
                onEditSection={handleEditSection}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Content Editor</Typography>
              {selectedSection && (
                <Typography variant="body2" color="text.secondary">
                  Editing: {selectedSection.title}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              {selectedSection ? (
                <TextField
                  fullWidth
                  multiline
                  variant="outlined"
                  value={editorContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter your content here..."
                  sx={{
                    height: '100%',
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
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Select a section to edit
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click on a section in the structure panel to start editing
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Section Editor Dialog */}
      {selectedSection && showEditor && (
        <SectionEditor
          section={selectedSection}
          open={showEditor}
          onClose={() => setShowEditor(false)}
          onSave={() => setShowEditor(false)}
        />
      )}
    </Container>
  );
};

export default TestProposalBuilder;