import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  History as HistoryIcon,
  RestoreOutlined as RestoreIcon,
  Compare as CompareIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Update as AutoSaveIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DiffViewer from './DiffViewer';

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  type: 'manual' | 'auto' | 'milestone';
  title: string;
  description?: string;
  content: any; // Full proposal content at this version
  sections: any[]; // Section tree at this version
  createdBy: {
    userId: string;
    email: string;
    name?: string;
  };
  createdAt: string;
  size: number; // Size in bytes
  metadata: {
    wordCount: number;
    sectionCount: number;
    changes: {
      added: number;
      modified: number;
      deleted: number;
    };
  };
}

interface VersionHistoryProps {
  proposalId: string;
  open: boolean;
  onClose: () => void;
  onRestore?: (version: ProposalVersion) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  proposalId,
  open,
  onClose,
  onRestore,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProposalVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<ProposalVersion | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showDiff, setShowDiff] = useState(false);
  const [filterAutoSaves, setFilterAutoSaves] = useState(false);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Mock version history data
  useEffect(() => {
    const loadVersionHistory = async () => {
      setLoading(true);
      try {
        // In real app, fetch from API
        const mockVersions: ProposalVersion[] = [
          {
            id: 'v1',
            proposalId,
            version: 1,
            type: 'manual',
            title: 'Initial draft',
            description: 'First version of the proposal',
            content: {},
            sections: [],
            createdBy: {
              userId: currentUser?.id || '1',
              email: currentUser?.email || 'user@example.com',
              name: 'John Doe',
            },
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            size: 2048,
            metadata: {
              wordCount: 500,
              sectionCount: 5,
              changes: { added: 5, modified: 0, deleted: 0 },
            },
          },
          {
            id: 'v2',
            proposalId,
            version: 2,
            type: 'auto',
            title: 'Auto-save',
            content: {},
            sections: [],
            createdBy: {
              userId: currentUser?.id || '1',
              email: currentUser?.email || 'user@example.com',
              name: 'John Doe',
            },
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            size: 3072,
            metadata: {
              wordCount: 750,
              sectionCount: 6,
              changes: { added: 1, modified: 3, deleted: 0 },
            },
          },
          {
            id: 'v3',
            proposalId,
            version: 3,
            type: 'milestone',
            title: 'First client review',
            description: 'Version sent to client for initial feedback',
            content: {},
            sections: [],
            createdBy: {
              userId: currentUser?.id || '1',
              email: currentUser?.email || 'user@example.com',
              name: 'John Doe',
            },
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            size: 4096,
            metadata: {
              wordCount: 1200,
              sectionCount: 8,
              changes: { added: 2, modified: 5, deleted: 0 },
            },
          },
          {
            id: 'v4',
            proposalId,
            version: 4,
            type: 'manual',
            title: 'Post-feedback revision',
            description: 'Incorporated client feedback',
            content: {},
            sections: [],
            createdBy: {
              userId: '2',
              email: 'colleague@example.com',
              name: 'Jane Smith',
            },
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            size: 5120,
            metadata: {
              wordCount: 1500,
              sectionCount: 9,
              changes: { added: 1, modified: 6, deleted: 1 },
            },
          },
        ];

        setVersions(mockVersions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load version history');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadVersionHistory();
    }
  }, [open, proposalId, currentUser]);

  const filteredVersions = filterAutoSaves
    ? versions.filter(v => v.type !== 'auto')
    : versions;

  const getVersionIcon = (type: ProposalVersion['type']) => {
    switch (type) {
      case 'manual':
        return <SaveIcon />;
      case 'auto':
        return <AutoSaveIcon />;
      case 'milestone':
        return <HistoryIcon />;
      default:
        return <SaveIcon />;
    }
  };

  const getVersionColor = (type: ProposalVersion['type']) => {
    switch (type) {
      case 'manual':
        return 'primary';
      case 'auto':
        return 'default';
      case 'milestone':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleRestore = (version: ProposalVersion) => {
    if (window.confirm(`Are you sure you want to restore version ${version.version} ("${version.title}")?`)) {
      onRestore?.(version);
      onClose();
    }
  };

  const handleCompare = (version: ProposalVersion) => {
    if (!selectedVersion) {
      setSelectedVersion(version);
    } else if (selectedVersion.id === version.id) {
      setSelectedVersion(null);
    } else {
      setCompareVersion(version);
      setShowDiff(true);
    }
  };

  const renderVersionList = () => (
    <List sx={{ width: '100%' }}>
      {filteredVersions.map((version, index) => (
        <React.Fragment key={version.id}>
          <ListItem
            alignItems="flex-start"
            selected={selectedVersion?.id === version.id}
            sx={{
              '&:hover': { bgcolor: 'action.hover' },
              cursor: 'pointer',
            }}
            onClick={() => setSelectedVersion(version)}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: `${getVersionColor(version.type)}.light` }}>
                {getVersionIcon(version.type)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    v{version.version}: {version.title}
                  </Typography>
                  <Chip
                    label={version.type}
                    size="small"
                    color={getVersionColor(version.type)}
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  {version.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {version.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      by {version.createdBy.name || version.createdBy.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {version.metadata.wordCount} words
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSize(version.size)}
                    </Typography>
                  </Stack>
                  {version.metadata.changes && (
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {version.metadata.changes.added > 0 && (
                        <Chip
                          label={`+${version.metadata.changes.added}`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                      {version.metadata.changes.modified > 0 && (
                        <Chip
                          label={`~${version.metadata.changes.modified}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                      {version.metadata.changes.deleted > 0 && (
                        <Chip
                          label={`-${version.metadata.changes.deleted}`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Stack>
                  )}
                </Box>
              }
            />
            
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Compare versions">
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompare(version);
                    }}
                    color={selectedVersion?.id === version.id ? 'primary' : 'default'}
                  >
                    <CompareIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Preview">
                  <IconButton edge="end">
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Restore this version">
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(version);
                    }}
                  >
                    <RestoreIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
          {index < filteredVersions.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );

  const renderTimeline = () => (
    <Box sx={{ position: 'relative', pl: 4 }}>
      {/* Timeline line */}
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: 'divider',
        }}
      />
      
      {filteredVersions.map((version, index) => (
        <Box key={version.id} sx={{ position: 'relative', mb: 4 }}>
          {/* Timeline dot */}
          <Box
            sx={{
              position: 'absolute',
              left: -24,
              top: 8,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: `${getVersionColor(version.type)}.main`,
              border: 2,
              borderColor: 'background.paper',
            }}
          />
          
          {/* Version card */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateX(4px)',
              },
              ...(selectedVersion?.id === version.id && {
                borderColor: 'primary.main',
                borderWidth: 2,
              }),
            }}
            onClick={() => setSelectedVersion(version)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getVersionIcon(version.type)}
                <Typography variant="subtitle2">
                  v{version.version}: {version.title}
                </Typography>
                <Chip
                  label={version.type}
                  size="small"
                  color={getVersionColor(version.type)}
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Box>
            
            {version.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {version.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                by {version.createdBy.name || version.createdBy.email}
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" onClick={() => handleCompare(version)}>
                  <CompareIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleRestore(version)}>
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );

  return (
    <>
      <Dialog
        open={open && !showDiff}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon />
              <Typography variant="h6">Version History</Typography>
              <Chip label={`${versions.length} versions`} size="small" />
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={filterAutoSaves}
                    onChange={(e) => setFilterAutoSaves(e.target.checked)}
                    size="small"
                  />
                }
                label="Hide auto-saves"
              />
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, mode) => mode && setViewMode(mode)}
                size="small"
              >
                <ToggleButton value="list">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="timeline">
                  <TimelineIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredVersions.length === 0 ? (
            <Alert severity="info">No version history available</Alert>
          ) : (
            <>
              {selectedVersion && (
                <Alert
                  severity="info"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => setSelectedVersion(null)}
                    >
                      Clear
                    </Button>
                  }
                  sx={{ mb: 2 }}
                >
                  Selected v{selectedVersion.version} for comparison. Click another version to compare.
                </Alert>
              )}
              
              {viewMode === 'list' ? renderVersionList() : renderTimeline()}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Diff Viewer Dialog */}
      {showDiff && selectedVersion && compareVersion && (
        <DiffViewer
          version1={selectedVersion}
          version2={compareVersion}
          open={showDiff}
          onClose={() => {
            setShowDiff(false);
            setSelectedVersion(null);
            setCompareVersion(null);
          }}
        />
      )}
    </>
  );
};

export default VersionHistory;