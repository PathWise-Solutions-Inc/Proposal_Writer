import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { Keyboard } from '@mui/icons-material';
import { useKeyboardShortcutsList } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const shortcuts = useKeyboardShortcutsList();

  const formatKey = (key: string) => {
    // Replace common key names with symbols
    const keyMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Delete': 'Del',
      'Escape': 'Esc',
    };
    return keyMap[key] || key;
  };

  const renderKeys = (keys: string) => {
    const keyParts = keys.split('+');
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {keyParts.map((key, index) => (
          <React.Fragment key={index}>
            <Chip
              label={formatKey(key)}
              size="small"
              variant="outlined"
              sx={{
                height: 24,
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                bgcolor: 'background.paper',
              }}
            />
            {index < keyParts.length - 1 && (
              <Typography variant="caption" color="text.secondary">
                +
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    );
  };

  const groupedShortcuts = {
    'File Operations': shortcuts.filter(s => 
      s.description.includes('Save') || 
      s.description.includes('Preview') ||
      s.description.includes('Export')
    ),
    'Section Management': shortcuts.filter(s => 
      s.description.includes('section') || 
      s.description.includes('Section')
    ),
    'Navigation': shortcuts.filter(s => 
      s.description.includes('Search') || 
      s.description.includes('Toggle')
    ),
    'AI Features': shortcuts.filter(s => 
      s.description.includes('AI') || 
      s.description.includes('Generate')
    ),
    'General': shortcuts.filter(s => 
      s.description.includes('Close') || 
      s.description.includes('Cancel')
    ),
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Keyboard />
        Keyboard Shortcuts
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Shortcut</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedShortcuts).map(([group, groupShortcuts]) => (
                groupShortcuts.length > 0 && (
                  <React.Fragment key={group}>
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        sx={{
                          bgcolor: 'action.hover',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                        }}
                      >
                        {group}
                      </TableCell>
                    </TableRow>
                    {groupShortcuts.map((shortcut, index) => (
                      <TableRow key={`${group}-${index}`}>
                        <TableCell sx={{ width: '40%' }}>
                          {renderKeys(shortcut.keys)}
                        </TableCell>
                        <TableCell>{shortcut.description}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                )
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Note: On macOS, use Cmd instead of Ctrl for keyboard shortcuts.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}