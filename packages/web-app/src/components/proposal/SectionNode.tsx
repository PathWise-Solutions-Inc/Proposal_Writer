import React, { useState, memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  DragIndicator,
  ExpandMore,
  ExpandLess,
  MoreVert,
  Add,
  Edit,
  Delete,
  FileCopy,
  Visibility,
  VisibilityOff,
  Folder,
  FolderOpen,
  Title,
  TextFields,
  FormatListBulleted,
  FormatListNumbered,
  TableChart,
  Image,
  Code
} from '@mui/icons-material';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { useDispatch } from 'react-redux';

import { ProposalSection, SectionType } from '../../types/section.types';
import { 
  deleteSection, 
  duplicateSection, 
  selectSection, 
  toggleSectionExpansion,
  updateSection,
  addSection
} from '../../store/slices/proposalSlice';

interface SectionNodeProps {
  section: ProposalSection;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  isDragDisabled?: boolean;
  level: number;
  onEdit?: (section: ProposalSection) => void;
}

const getSectionIcon = (type: SectionType) => {
  switch (type) {
    case SectionType.HEADING:
      return <Title fontSize="small" />;
    case SectionType.PARAGRAPH:
      return <TextFields fontSize="small" />;
    case SectionType.LIST:
      return <FormatListBulleted fontSize="small" />;
    case SectionType.TABLE:
      return <TableChart fontSize="small" />;
    case SectionType.IMAGE:
      return <Image fontSize="small" />;
    case SectionType.CUSTOM:
      return <Code fontSize="small" />;
    case SectionType.GROUP:
      return <Folder fontSize="small" />;
    default:
      return <TextFields fontSize="small" />;
  }
};

const getSectionTypeColor = (type: SectionType) => {
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

const SectionNode: React.FC<SectionNodeProps> = memo(({
  section,
  index,
  isSelected,
  isExpanded,
  isDragDisabled = false,
  level,
  onEdit
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const hasChildren = section.children && section.children.length > 0;
  const canHaveChildren = section.type === SectionType.GROUP;
  const sectionColor = getSectionTypeColor(section.type);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = () => {
    dispatch(selectSection(section.id));
  };

  const handleToggleExpansion = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (canHaveChildren) {
      dispatch(toggleSectionExpansion(section.id));
    }
  };

  const handleDelete = () => {
    dispatch(deleteSection(section.id));
    handleMenuClose();
  };

  const handleDuplicate = () => {
    dispatch(duplicateSection(section.id));
    handleMenuClose();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(section);
    }
    handleMenuClose();
  };

  const handleAddChild = () => {
    if (canHaveChildren) {
      dispatch(addSection({ parentId: section.id }));
    }
    handleMenuClose();
  };

  const handleToggleRequired = () => {
    dispatch(updateSection({
      sectionId: section.id,
      updates: { isRequired: !section.isRequired }
    }));
    handleMenuClose();
  };

  const renderSectionContent = () => {
    switch (section.type) {
      case SectionType.HEADING:
        return (
          <Typography 
            variant={section.content.level === 1 ? 'h6' : 'subtitle1'}
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            {section.content.text || section.title}
          </Typography>
        );
      case SectionType.PARAGRAPH:
        return (
          <Typography variant="body2" color="text.secondary">
            {section.content.text || 'Empty paragraph'}
          </Typography>
        );
      case SectionType.LIST:
        return (
          <Typography variant="body2" color="text.secondary">
            {section.content.listItems?.length || 0} items
          </Typography>
        );
      case SectionType.TABLE:
        return (
          <Typography variant="body2" color="text.secondary">
            {section.content.tableData?.rows?.length || 0} rows, {section.content.tableData?.headers?.length || 0} columns
          </Typography>
        );
      case SectionType.IMAGE:
        return (
          <Typography variant="body2" color="text.secondary">
            {section.content.imageUrl ? 'Image attached' : 'No image'}
          </Typography>
        );
      case SectionType.GROUP:
        return (
          <Typography variant="body2" color="text.secondary">
            {hasChildren ? `${section.children?.length} sections` : 'Empty group'}
          </Typography>
        );
      default:
        return (
          <Typography variant="body2" color="text.secondary">
            {section.title}
          </Typography>
        );
    }
  };

  return (
    <Draggable
      draggableId={section.id}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            mb: 0.5,
            ml: level * 2,
          }}
        >
          <Box
            onClick={handleSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect();
              }
            }}
            tabIndex={0}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={canHaveChildren ? isExpanded : undefined}
            aria-level={level + 1}
            aria-label={`${section.title} - ${section.type}${section.isRequired ? ' (Required)' : ''}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              py: 0.75,
              borderRadius: 1,
              border: '1px solid',
              borderColor: isSelected 
                ? sectionColor 
                : snapshot.isDragging 
                  ? alpha(sectionColor, 0.3)
                  : 'transparent',
              backgroundColor: isSelected
                ? alpha(sectionColor, 0.08)
                : snapshot.isDragging
                  ? alpha(sectionColor, 0.05)
                  : isHovered
                    ? alpha(theme.palette.action.hover, 0.04)
                    : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: isSelected
                  ? alpha(sectionColor, 0.12)
                  : alpha(theme.palette.action.hover, 0.08),
              }
            }}
          >
            {/* Drag Handle */}
            <Box
              {...provided.dragHandleProps}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 1,
                opacity: isHovered || snapshot.isDragging ? 1 : 0.3,
                transition: 'opacity 0.2s ease-in-out',
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                }
              }}
            >
              <DragIndicator fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>

            {/* Expand/Collapse Button */}
            {canHaveChildren && (
              <IconButton
                size="small"
                onClick={handleToggleExpansion}
                sx={{ 
                  mr: 0.5, 
                  p: 0.25,
                  color: hasChildren ? 'text.primary' : 'text.disabled'
                }}
              >
                {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            )}

            {/* Section Icon */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 1,
                color: sectionColor
              }}
            >
              {getSectionIcon(section.type)}
            </Box>

            {/* Section Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 500 : 400,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {section.title}
                </Typography>
                
                {section.isRequired && (
                  <Chip
                    label="Required"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 16,
                      fontSize: '0.6rem',
                      color: theme.palette.error.main,
                      borderColor: theme.palette.error.main
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ mt: 0.25 }}>
                {renderSectionContent()}
              </Box>
            </Box>

            {/* Section Actions */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                opacity: isHovered || isSelected ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              {canHaveChildren && (
                <Tooltip title="Add child section">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChild();
                    }}
                    sx={{ p: 0.25, mr: 0.5 }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="More actions">
                <IconButton
                  size="small"
                  onClick={handleMenuClick}
                  sx={{ p: 0.25 }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Context Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { minWidth: 180 }
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Section</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleDuplicate}>
              <ListItemIcon>
                <FileCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={handleToggleRequired}>
              <ListItemIcon>
                {section.isRequired ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </ListItemIcon>
              <ListItemText>
                {section.isRequired ? 'Make Optional' : 'Make Required'}
              </ListItemText>
            </MenuItem>
            
            <MenuItem
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Delete fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          {/* Children Sections */}
          {canHaveChildren && hasChildren && (
            <Droppable droppableId={section.id} type="SECTION">
              {(provided, snapshot) => (
                <Collapse in={isExpanded}>
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      mt: 0.5,
                      ml: 1,
                      pl: 1,
                      borderLeft: `2px solid ${alpha(sectionColor, 0.2)}`,
                      backgroundColor: snapshot.isDraggingOver 
                        ? alpha(sectionColor, 0.05) 
                        : 'transparent',
                      transition: 'background-color 0.2s ease-in-out',
                      minHeight: 8
                    }}
                  >
                    {section.children?.map((childSection, childIndex) => (
                      <SectionNode
                        key={childSection.id}
                        section={childSection}
                        index={childIndex}
                        isSelected={isSelected}
                        isExpanded={isExpanded}
                        level={level + 1}
                        onEdit={onEdit}
                      />
                    ))}
                    {provided.placeholder}
                  </Box>
                </Collapse>
              )}
            </Droppable>
          )}
        </Box>
      )}
    </Draggable>
  );
});

SectionNode.displayName = 'SectionNode';

export default SectionNode;