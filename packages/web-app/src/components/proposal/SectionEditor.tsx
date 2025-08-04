import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Stack
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { useDispatch } from 'react-redux';

import { ProposalSection, SectionType, ListType } from '../../types/section.types';
import { updateSection } from '../../store/slices/proposalSlice';

interface SectionEditorProps {
  section: ProposalSection;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  open,
  onClose,
  onSave
}) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: section.title,
    type: section.type,
    content: { ...section.content },
    isRequired: section.isRequired || false,
    tags: section.metadata?.tags || []
  });

  useEffect(() => {
    setFormData({
      title: section.title,
      type: section.type,
      content: { ...section.content },
      isRequired: section.isRequired || false,
      tags: section.metadata?.tags || []
    });
  }, [section]);

  const handleSave = () => {
    dispatch(updateSection({
      sectionId: section.id,
      updates: {
        title: formData.title,
        content: formData.content,
        isRequired: formData.isRequired,
        metadata: {
          ...section.metadata,
          tags: formData.tags,
          updatedAt: new Date()
        }
      }
    }));
    onSave();
  };

  const handleContentChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  const renderContentEditor = () => {
    switch (formData.type) {
      case SectionType.HEADING:
        return (
          <Box>
            <TextField
              fullWidth
              label="Heading Text"
              value={formData.content.text || ''}
              onChange={(e) => handleContentChange('text', e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Heading Level</InputLabel>
              <Select
                value={formData.content.level || 1}
                onChange={(e) => handleContentChange('level', e.target.value)}
                label="Heading Level"
              >
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <MenuItem key={level} value={level}>
                    Heading {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case SectionType.PARAGRAPH:
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Content"
            value={formData.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
            sx={{ mb: 2 }}
          />
        );

      case SectionType.LIST:
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>List Type</InputLabel>
              <Select
                value={formData.content.listType || ListType.UNORDERED}
                onChange={(e) => handleContentChange('listType', e.target.value)}
                label="List Type"
              >
                <MenuItem value={ListType.UNORDERED}>Bullet List</MenuItem>
                <MenuItem value={ListType.ORDERED}>Numbered List</MenuItem>
                <MenuItem value={ListType.CHECKLIST}>Checklist</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="List Items (one per line)"
              value={(formData.content.listItems || []).join('\n')}
              onChange={(e) => handleContentChange('listItems', e.target.value.split('\n').filter(item => item.trim()))}
              helperText="Enter each list item on a new line"
            />
          </Box>
        );

      case SectionType.IMAGE:
        return (
          <Box>
            <TextField
              fullWidth
              label="Image URL"
              value={formData.content.imageUrl || ''}
              onChange={(e) => handleContentChange('imageUrl', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Alt Text"
              value={formData.content.imageAlt || ''}
              onChange={(e) => handleContentChange('imageAlt', e.target.value)}
              helperText="Describe the image for accessibility"
            />
          </Box>
        );

      case SectionType.CUSTOM:
        return (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Custom HTML"
            value={formData.content.customHtml || ''}
            onChange={(e) => handleContentChange('customHtml', e.target.value)}
            helperText="Enter custom HTML content"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Content"
            value={formData.content.text || ''}
            onChange={(e) => handleContentChange('text', e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Edit Section
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Section Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Content
          </Typography>
          {renderContentEditor()}

          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                />
              }
              label="Required Section"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionEditor;