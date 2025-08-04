import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  TextFields,
  Timer
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { SectionType } from '../../../types/section.types';

interface EditorStatusBarProps {
  wordCount: number;
  characterCount: number;
  readingTime: number;
  isSaving: boolean;
  lastSaved: Date | null;
  sectionType: SectionType;
}

const EditorStatusBar: React.FC<EditorStatusBarProps> = ({
  wordCount,
  characterCount,
  readingTime,
  isSaving,
  lastSaved,
  sectionType
}) => {
  const theme = useTheme();

  const getSectionTypeLabel = (type: SectionType): string => {
    const labels: Record<SectionType, string> = {
      [SectionType.HEADING]: 'Heading',
      [SectionType.PARAGRAPH]: 'Paragraph',
      [SectionType.LIST]: 'List',
      [SectionType.TABLE]: 'Table',
      [SectionType.IMAGE]: 'Image',
      [SectionType.CUSTOM]: 'Custom',
      [SectionType.GROUP]: 'Group'
    };
    return labels[type] || 'Unknown';
  };

  const getSaveStatus = () => {
    if (isSaving) {
      return {
        icon: <CircularProgress size={14} />,
        text: 'Saving...',
        color: theme.palette.warning.main
      };
    } else if (lastSaved) {
      return {
        icon: <CheckCircle sx={{ fontSize: 14 }} />,
        text: `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`,
        color: theme.palette.success.main
      };
    } else {
      return {
        icon: <Schedule sx={{ fontSize: 14 }} />,
        text: 'Not saved',
        color: theme.palette.text.secondary
      };
    }
  };

  const saveStatus = getSaveStatus();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        borderTop: `1px solid ${theme.palette.divider}`,
        minHeight: 40,
        gap: 2
      }}
    >
      {/* Section Type */}
      <Chip
        label={getSectionTypeLabel(sectionType)}
        size="small"
        variant="outlined"
        sx={{
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />

      <Divider orientation="vertical" flexItem />

      {/* Word Count */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextFields sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
        <Typography variant="caption" color="text.secondary">
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </Typography>
      </Box>

      {/* Character Count */}
      <Typography variant="caption" color="text.secondary">
        {characterCount.toLocaleString()} {characterCount === 1 ? 'character' : 'characters'}
      </Typography>

      {/* Reading Time */}
      {wordCount > 0 && (
        <>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
            <Typography variant="caption" color="text.secondary">
              ~{readingTime} min read
            </Typography>
          </Box>
        </>
      )}

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Save Status */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          color: saveStatus.color
        }}
      >
        {saveStatus.icon}
        <Typography 
          variant="caption" 
          sx={{ 
            color: saveStatus.color,
            fontWeight: isSaving ? 500 : 400
          }}
        >
          {saveStatus.text}
        </Typography>
      </Box>

      {/* Additional Status Indicators */}
      {wordCount === 0 && (
        <>
          <Divider orientation="vertical" flexItem />
          <Typography variant="caption" color="text.disabled">
            Start typing to see statistics
          </Typography>
        </>
      )}

      {/* Content Quality Indicators */}
      {wordCount > 0 && (
        <>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Length indicator */}
            {wordCount < 10 && (
              <Chip
                label="Short"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem', 
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {wordCount >= 10 && wordCount < 50 && (
              <Chip
                label="Medium"
                size="small"
                color="info"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem', 
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {wordCount >= 50 && (
              <Chip
                label="Detailed"
                size="small"
                color="success"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem', 
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default EditorStatusBar;