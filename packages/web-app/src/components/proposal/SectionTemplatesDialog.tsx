import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Description,
  Search,
  Clear,
  Add,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import { 
  sectionTemplates, 
  templateCategories, 
  SectionTemplate,
  getTemplatesByCategory 
} from '../../data/sectionTemplates';
import { addSection } from '../../store/slices/proposalSlice';
import { ProposalSection, SectionType } from '../../types/section.types';

interface SectionTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  parentSectionId?: string;
  proposalId: string;
}

export function SectionTemplatesDialog({ 
  open, 
  onClose, 
  parentSectionId,
  proposalId 
}: SectionTemplatesDialogProps) {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(templateCategories[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedCategory(newValue);
  };

  const generateSectionWithId = (
    templateSection: Omit<ProposalSection, 'id' | 'proposalId' | 'createdAt' | 'updatedAt'>,
    proposalId: string
  ): ProposalSection => {
    const now = new Date();
    const section: ProposalSection = {
      ...templateSection,
      id: uuidv4(),
      proposalId,
      createdAt: now,
      updatedAt: now,
    };

    // Recursively generate IDs for children
    if (section.children) {
      section.children = section.children.map(child => 
        generateSectionWithId(child as any, proposalId)
      );
    }

    return section;
  };

  const handleAddTemplate = (template: SectionTemplate) => {
    const newSection = generateSectionWithId(template.section, proposalId);
    
    dispatch(addSection({
      section: newSection,
      parentId: parentSectionId,
    }));
    
    onClose();
  };

  const filteredTemplates = searchQuery
    ? sectionTemplates.filter(
        template =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getTemplatesByCategory(selectedCategory);

  const getSectionTypeColor = (type: SectionType) => {
    const colors: Record<SectionType, string> = {
      [SectionType.HEADING]: 'primary',
      [SectionType.PARAGRAPH]: 'default',
      [SectionType.LIST]: 'success',
      [SectionType.TABLE]: 'warning',
      [SectionType.IMAGE]: 'error',
      [SectionType.CUSTOM]: 'secondary',
      [SectionType.GROUP]: 'info',
    };
    return colors[type] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            <Typography variant="h6">Section Templates</Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {!searchQuery && (
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            {templateCategories.map((category) => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        )}
        
        <Box sx={{ p: 2, minHeight: 400, maxHeight: 500, overflow: 'auto' }}>
          {filteredTemplates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No templates found
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredTemplates.map((template) => (
                <Grid item xs={12} sm={6} key={template.id}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {template.name}
                        </Typography>
                        <Chip
                          label={template.section.type}
                          size="small"
                          color={getSectionTypeColor(template.section.type) as any}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      
                      {/* Preview of template structure */}
                      {template.section.type === SectionType.GROUP && template.section.children && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Contains:
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {template.section.children.slice(0, 3).map((child, index) => (
                              <Typography key={index} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                • {child.title}
                              </Typography>
                            ))}
                            {template.section.children.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                • ... and {template.section.children.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => handleAddTemplate(template)}
                        fullWidth
                      >
                        Add to Proposal
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}