import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  IconButton,
  alpha,
  useTheme
} from '@mui/material';
import {
  Close,
  Title,
  Subject,
  TextFields,
  FormatListBulleted,
  FormatListNumbered,
  TableChart,
  Image,
  Code,
  Folder
} from '@mui/icons-material';

import { SectionType, DEFAULT_SECTION_TEMPLATES, SectionTemplateItem } from '../../types/section.types';

interface SectionTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId?: string, type?: SectionType) => void;
}

const getTemplateIcon = (iconName: string) => {
  switch (iconName) {
    case 'Heading1':
    case 'Title':
      return <Title />;
    case 'Heading2':
    case 'Subject':
      return <Subject />;
    case 'Type':
    case 'TextFields':
      return <TextFields />;
    case 'List':
      return <FormatListBulleted />;
    case 'ListOrdered':
      return <FormatListNumbered />;
    case 'Table':
      return <TableChart />;
    case 'Image':
      return <Image />;
    case 'Code':
      return <Code />;
    case 'Folder':
      return <Folder />;
    default:
      return <TextFields />;
  }
};

const getTypeColor = (type: SectionType) => {
  switch (type) {
    case SectionType.HEADING:
      return '#2563EB';
    case SectionType.PARAGRAPH:
      return '#6B7280';
    case SectionType.LIST:
      return '#10B981';
    case SectionType.TABLE:
      return '#F59E0B';
    case SectionType.IMAGE:
      return '#EF4444';
    case SectionType.CUSTOM:
      return '#8B5CF6';
    case SectionType.GROUP:
      return '#3B82F6';
    default:
      return '#6B7280';
  }
};

const SectionTypeSelector: React.FC<SectionTypeSelectorProps> = ({
  open,
  onClose,
  onSelect
}) => {
  const theme = useTheme();

  const handleSelectTemplate = (template: SectionTemplateItem) => {
    onSelect(template.id, template.type);
  };

  const groupedTemplates = DEFAULT_SECTION_TEMPLATES.reduce((groups, template) => {
    const category = template.type === SectionType.HEADING ? 'Headers' :
                    template.type === SectionType.PARAGRAPH ? 'Content' :
                    template.type === SectionType.LIST ? 'Lists' :
                    template.type === SectionType.TABLE ? 'Data' :
                    template.type === SectionType.IMAGE ? 'Media' :
                    template.type === SectionType.GROUP ? 'Structure' :
                    'Other';
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {} as Record<string, SectionTemplateItem[]>);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2">
            Add New Section
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose a section type to add to your proposal
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                color: 'text.primary',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: 0.5
              }}
            >
              {category}
            </Typography>
            
            <Grid container spacing={2}>
              {templates.map((template) => {
                const typeColor = getTypeColor(template.type);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4],
                          borderColor: alpha(typeColor, 0.3)
                        }
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleSelectTemplate(template)}
                        sx={{
                          height: '100%',
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start'
                        }}
                      >
                        <CardContent sx={{ p: 0, width: '100%', '&:last-child': { pb: 0 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                backgroundColor: alpha(typeColor, 0.1),
                                color: typeColor,
                                mr: 1.5
                              }}
                            >
                              {getTemplateIcon(template.icon)}
                            </Box>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {template.name}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.8rem',
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {template.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionTypeSelector;