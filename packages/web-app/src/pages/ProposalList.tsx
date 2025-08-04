import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  FileCopy,
  Launch,
  Article
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  createProposal, 
  deleteProposal, 
  setCurrentProposal 
} from '../store/slices/proposalSlice';

interface CreateProposalDialog {
  open: boolean;
  title: string;
  description: string;
}

export default function ProposalList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { proposals, loading } = useSelector((state: RootState) => state.proposal);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [createDialog, setCreateDialog] = useState<CreateProposalDialog>({
    open: false,
    title: '',
    description: ''
  });

  const handleCreateProposal = () => {
    // Create a new proposal
    const newProposal = {
      id: `proposal-${Date.now()}`,
      title: createDialog.title || 'Untitled Proposal',
      description: createDialog.description,
      sections: [],
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    };

    dispatch(createProposal(newProposal));
    dispatch(setCurrentProposal(newProposal));
    
    // Close dialog and navigate to builder
    setCreateDialog({ open: false, title: '', description: '' });
    navigate(`/proposals/${newProposal.id}/builder`);
  };

  const handleOpenProposal = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      dispatch(setCurrentProposal(proposal));
      navigate(`/proposals/${proposalId}/builder`);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, proposalId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedProposal(proposalId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProposal(null);
  };

  const handleDeleteProposal = () => {
    if (selectedProposal) {
      dispatch(deleteProposal(selectedProposal));
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'in_progress':
        return 'warning';
      case 'review':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Proposals
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog({ ...createDialog, open: true })}
          >
            Create Proposal
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage your proposals and track their progress
        </Typography>
      </Box>

      {proposals.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Article sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No proposals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first proposal to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog({ ...createDialog, open: true })}
          >
            Create Your First Proposal
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sections</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow
                  key={proposal.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleOpenProposal(proposal.id)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {proposal.title}
                      </Typography>
                      {proposal.description && (
                        <Typography variant="body2" color="text.secondary">
                          {proposal.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={proposal.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(proposal.status)}
                    />
                  </TableCell>
                  <TableCell>{proposal.sections.length}</TableCell>
                  <TableCell>{formatDate(proposal.updatedAt)}</TableCell>
                  <TableCell>{formatDate(proposal.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, proposal.id);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Proposal Dialog */}
      <Dialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ ...createDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Proposal Title"
              fullWidth
              value={createDialog.title}
              onChange={(e) => setCreateDialog({ ...createDialog, title: e.target.value })}
              placeholder="Enter proposal title"
              autoFocus
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={createDialog.description}
              onChange={(e) => setCreateDialog({ ...createDialog, description: e.target.value })}
              placeholder="Brief description of the proposal"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ ...createDialog, open: false })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateProposal}
            disabled={!createDialog.title.trim()}
          >
            Create Proposal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedProposal) {
            handleOpenProposal(selectedProposal);
          }
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement duplicate
          handleMenuClose();
        }}>
          <FileCopy sx={{ mr: 1 }} fontSize="small" />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Implement export
          handleMenuClose();
        }}>
          <Launch sx={{ mr: 1 }} fontSize="small" />
          Export
        </MenuItem>
        <MenuItem onClick={handleDeleteProposal} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
}