import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Stack
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  ViewList,
  ViewModule,
  UnfoldMore,
  UnfoldLess,
  Clear,
  Tune
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../store';
import { SectionType, DEFAULT_SECTION_TEMPLATES } from '../../types/section.types';
import { 
  addSection, 
  setSectionSearchQuery, 
  setSectionFilters,
  toggleSectionExpansion
} from '../../store/slices/proposalSlice';
import SectionTypeSelector from './SectionTypeSelector';

interface SectionControlsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  showTemplateSelector?: boolean;
}

const SectionControls: React.FC<SectionControlsProps> = ({
  onExpandAll,
  onCollapseAll,
  showTemplateSelector = true
}) => {
  const dispatch = useDispatch();
  const { sectionTree } = useSelector((state: RootState) => state.proposal);
  
  const [searchValue, setSearchValue] = useState(sectionTree.searchQuery || '');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');

  const activeFilters = Object.entries(sectionTree.filters || {}).filter(
    ([key, value]) => value !== undefined && value !== null && value !== ''
  ).length;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    dispatch(setSectionSearchQuery(value));
  };

  const handleClearSearch = () => {
    setSearchValue('');
    dispatch(setSectionSearchQuery(''));
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterByType = (type: SectionType | undefined) => {
    dispatch(setSectionFilters({
      ...sectionTree.filters,
      type
    }));
    handleFilterClose();
  };

  const handleFilterByRequired = (isRequired: boolean | undefined) => {
    dispatch(setSectionFilters({
      ...sectionTree.filters,
      isRequired
    }));
    handleFilterClose();
  };

  const handleClearFilters = () => {
    dispatch(setSectionFilters({}));
    handleFilterClose();
  };

  const handleAddSection = (templateId?: string, type?: SectionType) => {
    dispatch(addSection({ templateId, type }));
    setShowTypeSelector(false);
  };

  const renderFilterChips = () => {
    const chips = [];
    
    if (sectionTree.filters?.type) {
      const template = DEFAULT_SECTION_TEMPLATES.find(t => t.type === sectionTree.filters.type);
      chips.push(
        <Chip
          key="type"
          label={`Type: ${template?.name || sectionTree.filters.type}`}
          size="small"
          onDelete={() => handleFilterByType(undefined)}
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }

    if (sectionTree.filters?.isRequired !== undefined) {
      chips.push(
        <Chip
          key="required"
          label={sectionTree.filters.isRequired ? 'Required only' : 'Optional only'}
          size="small"
          onDelete={() => handleFilterByRequired(undefined)}
          sx={{ mr: 0.5, mb: 0.5 }}
        />
      );
    }

    return chips;
  };

  return (
    <Box>
      {/* Main Controls Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        {/* Add Section Button */}
        {showTemplateSelector && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowTypeSelector(true)}
            sx={{ minWidth: 'auto' }}
          >
            Add Section
          </Button>
        )}

        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search sections..."
          value={searchValue}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 200, maxWidth: 300 }}
        />

        {/* Filter Button */}
        <Tooltip title="Filter sections">
          <IconButton
            onClick={handleFilterClick}
            color={activeFilters > 0 ? 'primary' : 'default'}
            sx={{ position: 'relative' }}
          >
            <FilterList />
            {activeFilters > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {activeFilters}
              </Box>
            )}
          </IconButton>
        </Tooltip>

        {/* View Mode Toggle */}
        <Tooltip title={`Switch to ${viewMode === 'list' ? 'tree' : 'list'} view`}>
          <IconButton
            onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            color={viewMode === 'tree' ? 'primary' : 'default'}
          >
            {viewMode === 'list' ? <ViewModule /> : <ViewList />}
          </IconButton>
        </Tooltip>

        {/* Expand/Collapse Controls */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Expand all sections">
            <IconButton size="small" onClick={onExpandAll}>
              <UnfoldMore fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Collapse all sections">
            <IconButton size="small" onClick={onCollapseAll}>
              <UnfoldLess fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Section Count */}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {sectionTree.sections.length} sections
        </Typography>
      </Box>

      {/* Active Filters */}
      {renderFilterChips().length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Active filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {renderFilterChips()}
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{ ml: 1 }}
            >
              Clear all
            </Button>
          </Box>
        </Box>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: { minWidth: 250 }
        }}
      >
        <MenuItem onClick={handleFilterClose} disabled>
          <ListItemIcon>
            <Tune fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="subtitle2">Filter Options</Typography>
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleFilterByType(undefined)}>
          <ListItemText>All Types</ListItemText>
          {!sectionTree.filters?.type && '✓'}
        </MenuItem>
        
        {DEFAULT_SECTION_TEMPLATES.map((template) => (
          <MenuItem
            key={template.id}
            onClick={() => handleFilterByType(template.type)}
          >
            <ListItemText>{template.name}</ListItemText>
            {sectionTree.filters?.type === template.type && '✓'}
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={() => handleFilterByRequired(undefined)}>
          <ListItemText>All Sections</ListItemText>
          {sectionTree.filters?.isRequired === undefined && '✓'}
        </MenuItem>
        
        <MenuItem onClick={() => handleFilterByRequired(true)}>
          <ListItemText>Required Only</ListItemText>
          {sectionTree.filters?.isRequired === true && '✓'}
        </MenuItem>
        
        <MenuItem onClick={() => handleFilterByRequired(false)}>
          <ListItemText>Optional Only</ListItemText>
          {sectionTree.filters?.isRequired === false && '✓'}
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleClearFilters}>
          <ListItemIcon>
            <Clear fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clear Filters</ListItemText>
        </MenuItem>
      </Menu>

      {/* Section Type Selector */}
      <SectionTypeSelector
        open={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleAddSection}
      />
    </Box>
  );
};

export default SectionControls;