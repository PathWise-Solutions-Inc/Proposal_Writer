import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Skeleton,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../store';
import { ProposalSection, SectionType } from '../../types/section.types';
import { 
  moveSection, 
  setDraggedSection,
  toggleSectionExpansion
} from '../../store/slices/proposalSlice';

import SectionNode from './SectionNode';
import SectionControls from './SectionControls';
import SectionEditor from './SectionEditor';

interface SectionTreeProps {
  showControls?: boolean;
  readOnly?: boolean;
  maxHeight?: string | number;
  onSectionSelect?: (section: ProposalSection) => void;
}

const SectionTree: React.FC<SectionTreeProps> = ({
  showControls = true,
  readOnly = false,
  maxHeight = '70vh',
  onSectionSelect
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { sectionTree, loading, error } = useSelector((state: RootState) => state.proposal);
  
  const [editingSection, setEditingSection] = useState<ProposalSection | null>(null);

  // Filter sections based on search and filters
  const filteredSections = useMemo(() => {
    let sections = [...sectionTree.sections];
    
    // Apply search filter
    if (sectionTree.searchQuery) {
      const searchLower = sectionTree.searchQuery.toLowerCase();
      const filterBySearch = (sections: ProposalSection[]): ProposalSection[] => {
        return sections.filter(section => {
          const matchesTitle = section.title.toLowerCase().includes(searchLower);
          const matchesContent = section.content.text?.toLowerCase().includes(searchLower);
          const hasMatchingChildren = section.children && 
            filterBySearch(section.children).length > 0;
          
          return matchesTitle || matchesContent || hasMatchingChildren;
        }).map(section => ({
          ...section,
          children: section.children ? filterBySearch(section.children) : undefined
        }));
      };
      sections = filterBySearch(sections);
    }
    
    // Apply type filter
    if (sectionTree.filters?.type) {
      const filterByType = (sections: ProposalSection[]): ProposalSection[] => {
        return sections.filter(section => {
          const matchesType = section.type === sectionTree.filters.type;
          const hasMatchingChildren = section.children && 
            filterByType(section.children).length > 0;
          
          return matchesType || hasMatchingChildren;
        }).map(section => ({
          ...section,
          children: section.children ? filterByType(section.children) : undefined
        }));
      };
      sections = filterByType(sections);
    }
    
    // Apply required filter
    if (sectionTree.filters?.isRequired !== undefined) {
      const filterByRequired = (sections: ProposalSection[]): ProposalSection[] => {
        return sections.filter(section => {
          const matchesRequired = section.isRequired === sectionTree.filters.isRequired;
          const hasMatchingChildren = section.children && 
            filterByRequired(section.children).length > 0;
          
          return matchesRequired || hasMatchingChildren;
        }).map(section => ({
          ...section,
          children: section.children ? filterByRequired(section.children) : undefined
        }));
      };
      sections = filterByRequired(sections);
    }
    
    return sections;
  }, [sectionTree.sections, sectionTree.searchQuery, sectionTree.filters]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    console.log('Drag ended:', {
      draggableId,
      source: source,
      destination: destination
    });
    
    // Clear drag state
    dispatch(setDraggedSection(undefined));
    
    if (!destination) {
      console.log('No destination, cancelling drag');
      return;
    }
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('Same position, cancelling drag');
      return;
    }
    
    // Dispatch move action
    dispatch(moveSection({
      source,
      destination,
      draggableId,
      type: 'SECTION'
    }));
  }, [dispatch]);

  const handleDragStart = useCallback((start: any) => {
    console.log('Drag started:', {
      draggableId: start.draggableId,
      source: start.source
    });
    dispatch(setDraggedSection(start.draggableId));
  }, [dispatch]);

  const handleExpandAll = useCallback(() => {
    const expandAllSections = (sections: ProposalSection[]) => {
      sections.forEach(section => {
        if (section.type === SectionType.GROUP && section.children?.length) {
          if (!sectionTree.expandedSections.has(section.id)) {
            dispatch(toggleSectionExpansion(section.id));
          }
          if (section.children) {
            expandAllSections(section.children);
          }
        }
      });
    };
    expandAllSections(sectionTree.sections);
  }, [dispatch, sectionTree.sections, sectionTree.expandedSections]);

  const handleCollapseAll = useCallback(() => {
    const collapseAllSections = (sections: ProposalSection[]) => {
      sections.forEach(section => {
        if (section.type === SectionType.GROUP) {
          if (sectionTree.expandedSections.has(section.id)) {
            dispatch(toggleSectionExpansion(section.id));
          }
          if (section.children) {
            collapseAllSections(section.children);
          }
        }
      });
    };
    collapseAllSections(sectionTree.sections);
  }, [dispatch, sectionTree.sections, sectionTree.expandedSections]);

  const handleSectionEdit = useCallback((section: ProposalSection) => {
    setEditingSection(section);
  }, []);

  const handleSectionSelect = useCallback((section: ProposalSection) => {
    if (onSectionSelect) {
      onSectionSelect(section);
    }
  }, [onSectionSelect]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {showControls && (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
          </Box>
        )}
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={60}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // Empty state
  if (filteredSections.length === 0) {
    const hasActiveFilters = sectionTree.searchQuery || 
      Object.keys(sectionTree.filters || {}).length > 0;
    
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        {showControls && (
          <SectionControls
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        )}
        
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {hasActiveFilters ? 'No sections match your filters' : 'No sections yet'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {hasActiveFilters 
            ? 'Try adjusting your search or filter criteria' 
            : 'Add your first section to get started building your proposal'
          }
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showControls && (
        <SectionControls
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />
      )}
      
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight
        }}
      >
        <DragDropContext
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <Droppable droppableId="root" type="SECTION">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                role="tree"
                aria-label="Proposal section structure"
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 1,
                  backgroundColor: snapshot.isDraggingOver 
                    ? alpha(theme.palette.primary.main, 0.05) 
                    : 'transparent',
                  transition: 'background-color 0.2s ease-in-out',
                  minHeight: 200,
                  position: 'relative'
                }}
              >
                <Fade in timeout={300}>
                  <Box>
                    {filteredSections.map((section, index) => {
                      console.log('Rendering section:', { id: section.id, index, title: section.title });
                      return (
                        <SectionNode
                          key={section.id}
                          section={section}
                          index={index}
                          isSelected={sectionTree.selectedSectionId === section.id}
                          isExpanded={sectionTree.expandedSections.has(section.id)}
                          isDragDisabled={readOnly}
                          level={0}
                          onEdit={handleSectionEdit}
                        />
                      );
                    })}
                    {provided.placeholder}
                  </Box>
                </Fade>
                
                {/* Drop zone indicator */}
                {snapshot.isDraggingOver && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: `2px dashed ${theme.palette.primary.main}`,
                      borderRadius: 1,
                      pointerEvents: 'none',
                      backgroundColor: alpha(theme.palette.primary.main, 0.02)
                    }}
                  />
                )}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          open={Boolean(editingSection)}
          onClose={() => setEditingSection(null)}
          onSave={() => setEditingSection(null)}
        />
      )}
    </Box>
  );
};

export default SectionTree;