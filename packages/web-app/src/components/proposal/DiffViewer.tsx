import React, { useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Compare as CompareIcon,
  AddCircleOutline as AddIcon,
  RemoveCircleOutline as RemoveIcon,
  ChangeCircleOutlined as ChangeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { diffWords, diffLines, Change } from 'diff';
import { ProposalVersion } from './VersionHistory';

interface DiffViewerProps {
  version1: ProposalVersion;
  version2: ProposalVersion;
  open: boolean;
  onClose: () => void;
}

type DiffMode = 'unified' | 'split' | 'inline';

const DiffViewer: React.FC<DiffViewerProps> = ({
  version1,
  version2,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const [diffMode, setDiffMode] = React.useState<DiffMode>('unified');

  // Mock content for demonstration - in real app, this would come from version data
  const content1 = `Executive Summary

Our company offers comprehensive IT services tailored to meet your specific needs. With over 10 years of experience in the industry, we have successfully delivered projects for Fortune 500 companies.

Technical Approach

We propose a phased implementation approach that minimizes risk and ensures smooth transition. Our methodology includes:
- Initial assessment and planning
- Proof of concept development
- Iterative implementation
- Testing and validation
- Deployment and support`;

  const content2 = `Executive Summary

Our company offers cutting-edge IT solutions designed to transform your business operations. With over 15 years of proven expertise, we have successfully delivered innovative projects for Fortune 500 companies and emerging enterprises.

Technical Approach

We recommend an agile implementation strategy that maximizes flexibility and delivers rapid value. Our enhanced methodology includes:
- Comprehensive assessment and strategic planning
- Rapid prototype development
- Agile sprint-based implementation
- Continuous integration and testing
- Seamless deployment with 24/7 support
- Post-implementation optimization`;

  const differences = useMemo(() => {
    return diffLines(content1, content2);
  }, [content1, content2]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;

    differences.forEach((change) => {
      if (change.added) {
        added += change.count || 1;
      } else if (change.removed) {
        removed += change.count || 1;
      }
    });

    // Estimate modified lines (simplified)
    modified = Math.min(added, removed);

    return { added, removed, modified };
  }, [differences]);

  const renderUnifiedDiff = () => (
    <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}>
      {differences.map((part, index) => {
        const color = part.added
          ? theme.palette.success.main
          : part.removed
          ? theme.palette.error.main
          : theme.palette.text.primary;

        const bgcolor = part.added
          ? alpha(theme.palette.success.main, 0.1)
          : part.removed
          ? alpha(theme.palette.error.main, 0.1)
          : 'transparent';

        const prefix = part.added ? '+' : part.removed ? '-' : ' ';

        return (
          <Box
            key={index}
            sx={{
              color,
              bgcolor,
              whiteSpace: 'pre-wrap',
              py: 0.25,
              px: 1,
              my: 0.25,
              borderRadius: 0.5,
            }}
          >
            {part.value.split('\n').map((line, lineIndex) => (
              <Box key={lineIndex} sx={{ minHeight: '1.2em' }}>
                {line && `${prefix} ${line}`}
              </Box>
            ))}
          </Box>
        );
      })}
    </Paper>
  );

  const renderSplitDiff = () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Old Version */}
      <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="error">
          v{version1.version}: {version1.title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {differences.map((part, index) => {
            if (part.added) return null;
            
            const color = part.removed ? theme.palette.error.main : theme.palette.text.primary;
            const bgcolor = part.removed ? alpha(theme.palette.error.main, 0.1) : 'transparent';
            
            return (
              <Box
                key={index}
                sx={{
                  color,
                  bgcolor,
                  whiteSpace: 'pre-wrap',
                  py: 0.25,
                  px: 1,
                  my: 0.25,
                  borderRadius: 0.5,
                }}
              >
                {part.value}
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* New Version */}
      <Paper variant="outlined" sx={{ flex: 1, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="success">
          v{version2.version}: {version2.title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {differences.map((part, index) => {
            if (part.removed) return null;
            
            const color = part.added ? theme.palette.success.main : theme.palette.text.primary;
            const bgcolor = part.added ? alpha(theme.palette.success.main, 0.1) : 'transparent';
            
            return (
              <Box
                key={index}
                sx={{
                  color,
                  bgcolor,
                  whiteSpace: 'pre-wrap',
                  py: 0.25,
                  px: 1,
                  my: 0.25,
                  borderRadius: 0.5,
                }}
              >
                {part.value}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );

  const renderInlineDiff = () => (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
        {differences.map((part, index) => {
          if (part.added || part.removed) {
            const words = diffWords(
              part.removed ? part.value : '',
              part.added ? part.value : ''
            );
            
            return (
              <Box key={index} sx={{ my: 1 }}>
                {words.map((word, wordIndex) => {
                  const color = word.added
                    ? theme.palette.success.main
                    : word.removed
                    ? theme.palette.error.main
                    : theme.palette.text.primary;

                  const bgcolor = word.added
                    ? alpha(theme.palette.success.main, 0.2)
                    : word.removed
                    ? alpha(theme.palette.error.main, 0.2)
                    : 'transparent';

                  const textDecoration = word.removed ? 'line-through' : 'none';

                  return (
                    <Box
                      key={wordIndex}
                      component="span"
                      sx={{
                        color,
                        bgcolor,
                        textDecoration,
                        px: word.added || word.removed ? 0.5 : 0,
                        borderRadius: 0.5,
                      }}
                    >
                      {word.value}
                    </Box>
                  );
                })}
              </Box>
            );
          }
          
          return (
            <Box key={index} sx={{ whiteSpace: 'pre-wrap' }}>
              {part.value}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon />
            <Typography variant="h6">Compare Versions</Typography>
          </Box>
          
          <ToggleButtonGroup
            value={diffMode}
            exclusive
            onChange={(_, mode) => mode && setDiffMode(mode)}
            size="small"
          >
            <ToggleButton value="unified">Unified</ToggleButton>
            <ToggleButton value="split">Split</ToggleButton>
            <ToggleButton value="inline">Inline</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Version Info */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Old Version
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                v{version1.version}: {version1.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(version1.createdAt), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Paper>

            <CompareIcon color="action" />

            <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
              <Typography variant="subtitle2" color="success" gutterBottom>
                New Version
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                v{version2.version}: {version2.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(version2.createdAt), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Paper>
          </Stack>
        </Box>

        {/* Change Statistics */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Chip
            icon={<AddIcon />}
            label={`${stats.added} additions`}
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<ChangeIcon />}
            label={`${stats.modified} modifications`}
            color="warning"
            variant="outlined"
          />
          <Chip
            icon={<RemoveIcon />}
            label={`${stats.removed} deletions`}
            color="error"
            variant="outlined"
          />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Diff Content */}
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {diffMode === 'unified' && renderUnifiedDiff()}
          {diffMode === 'split' && renderSplitDiff()}
          {diffMode === 'inline' && renderInlineDiff()}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<CompareIcon />}
          onClick={() => {
            // TODO: Export diff report
            console.log('Export diff report');
          }}
        >
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiffViewer;