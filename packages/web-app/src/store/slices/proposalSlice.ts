import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ProposalSection, 
  SectionTreeState, 
  SectionType, 
  DragResult,
  DEFAULT_SECTION_TEMPLATES 
} from '../../types/section.types';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  sections: ProposalSection[];
  rfpId?: string;
  status: 'draft' | 'in_progress' | 'review' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ProposalState {
  proposals: Proposal[];
  currentProposal: Proposal | null;
  sectionTree: SectionTreeState;
  loading: boolean;
  error: string | null;
}

const initialSectionTreeState: SectionTreeState = {
  sections: [],
  selectedSectionId: undefined,
  draggedSectionId: undefined,
  expandedSections: new Set<string>(),
  searchQuery: '',
  filters: {}
};

const initialState: ProposalState = {
  proposals: [],
  currentProposal: null,
  sectionTree: initialSectionTreeState,
  loading: false,
  error: null,
};

// Helper functions
const generateSectionId = (): string => {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const findSectionById = (sections: ProposalSection[], id: string): ProposalSection | null => {
  for (const section of sections) {
    if (section.id === id) return section;
    if (section.children) {
      const found = findSectionById(section.children, id);
      if (found) return found;
    }
  }
  return null;
};

const removeSectionById = (sections: ProposalSection[], id: string): ProposalSection[] => {
  return sections.filter(section => {
    if (section.id === id) return false;
    if (section.children) {
      section.children = removeSectionById(section.children, id);
    }
    return true;
  });
};

const updateSectionById = (
  sections: ProposalSection[], 
  id: string, 
  updates: Partial<ProposalSection>
): ProposalSection[] => {
  return sections.map(section => {
    if (section.id === id) {
      return { ...section, ...updates, metadata: { ...section.metadata, updatedAt: new Date().toISOString() } };
    }
    if (section.children) {
      return { ...section, children: updateSectionById(section.children, id, updates) };
    }
    return section;
  });
};

const reorderSections = (sections: ProposalSection[]): ProposalSection[] => {
  return sections.map((section, index) => ({
    ...section,
    order: index,
    children: section.children ? reorderSections(section.children) : undefined
  }));
};

const proposalSlice = createSlice({
  name: 'proposal',
  initialState,
  reducers: {
    // Proposal management
    setCurrentProposal: (state, action: PayloadAction<Proposal>) => {
      state.currentProposal = action.payload;
      state.sectionTree.sections = action.payload.sections;
      state.sectionTree.selectedSectionId = undefined;
      state.sectionTree.expandedSections = new Set();
    },

    updateProposalTitle: (state, action: PayloadAction<string>) => {
      if (state.currentProposal) {
        state.currentProposal.title = action.payload;
        state.currentProposal.updatedAt = new Date().toISOString();
      }
    },

    // Section tree management
    addSection: (state, action: PayloadAction<{ 
      parentId?: string; 
      type?: SectionType; 
      templateId?: string;
      position?: number;
    }>) => {
      const { parentId, type = SectionType.PARAGRAPH, templateId, position } = action.payload;
      const template = templateId 
        ? DEFAULT_SECTION_TEMPLATES.find(t => t.id === templateId)
        : DEFAULT_SECTION_TEMPLATES.find(t => t.type === type);
      
      const newSection: ProposalSection = {
        id: generateSectionId(),
        type: template?.type || type,
        title: template?.name || 'New Section',
        content: template?.defaultContent || { text: '' },
        parentId,
        children: type === SectionType.GROUP ? [] : undefined,
        order: position ?? 0,
        isCollapsed: false,
        isRequired: false,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: []
        }
      };

      if (parentId) {
        // Add to parent's children
        const updateParentChildren = (sections: ProposalSection[]): ProposalSection[] => {
          return sections.map(section => {
            if (section.id === parentId) {
              const children = section.children || [];
              const insertIndex = position !== undefined ? position : children.length;
              children.splice(insertIndex, 0, newSection);
              return { ...section, children: reorderSections(children) };
            }
            if (section.children) {
              return { ...section, children: updateParentChildren(section.children) };
            }
            return section;
          });
        };
        state.sectionTree.sections = updateParentChildren(state.sectionTree.sections);
      } else {
        // Add to root level
        const insertIndex = position !== undefined ? position : state.sectionTree.sections.length;
        state.sectionTree.sections.splice(insertIndex, 0, newSection);
        state.sectionTree.sections = reorderSections(state.sectionTree.sections);
      }

      // Auto-select the new section
      state.sectionTree.selectedSectionId = newSection.id;

      // Update current proposal if exists
      if (state.currentProposal) {
        state.currentProposal.sections = state.sectionTree.sections;
        state.currentProposal.updatedAt = new Date().toISOString();
      }
    },

    deleteSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      state.sectionTree.sections = removeSectionById(state.sectionTree.sections, sectionId);
      state.sectionTree.sections = reorderSections(state.sectionTree.sections);
      
      // Clear selection if deleted section was selected
      if (state.sectionTree.selectedSectionId === sectionId) {
        state.sectionTree.selectedSectionId = undefined;
      }

      // Remove from expanded sections
      state.sectionTree.expandedSections.delete(sectionId);

      // Update current proposal
      if (state.currentProposal) {
        state.currentProposal.sections = state.sectionTree.sections;
        state.currentProposal.updatedAt = new Date().toISOString();
      }
    },

    updateSection: (state, action: PayloadAction<{ 
      sectionId: string; 
      updates: Partial<ProposalSection> 
    }>) => {
      const { sectionId, updates } = action.payload;
      state.sectionTree.sections = updateSectionById(state.sectionTree.sections, sectionId, updates);
      
      // Update current proposal
      if (state.currentProposal) {
        state.currentProposal.sections = state.sectionTree.sections;
        state.currentProposal.updatedAt = new Date().toISOString();
      }
    },

    duplicateSection: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      const originalSection = findSectionById(state.sectionTree.sections, sectionId);
      
      if (originalSection) {
        const duplicatedSection: ProposalSection = {
          ...originalSection,
          id: generateSectionId(),
          title: `${originalSection.title} (Copy)`,
          children: originalSection.children?.map(child => ({
            ...child,
            id: generateSectionId(),
            parentId: generateSectionId()
          })),
          metadata: {
            ...originalSection.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        // Add the duplicated section after the original
        if (originalSection.parentId) {
          // Find parent and insert after original
          const updateParentChildren = (sections: ProposalSection[]): ProposalSection[] => {
            return sections.map(section => {
              if (section.id === originalSection.parentId) {
                const children = section.children || [];
                const originalIndex = children.findIndex(child => child.id === sectionId);
                if (originalIndex !== -1) {
                  children.splice(originalIndex + 1, 0, duplicatedSection);
                }
                return { ...section, children: reorderSections(children) };
              }
              if (section.children) {
                return { ...section, children: updateParentChildren(section.children) };
              }
              return section;
            });
          };
          state.sectionTree.sections = updateParentChildren(state.sectionTree.sections);
        } else {
          // Add to root level after original
          const originalIndex = state.sectionTree.sections.findIndex(section => section.id === sectionId);
          if (originalIndex !== -1) {
            state.sectionTree.sections.splice(originalIndex + 1, 0, duplicatedSection);
            state.sectionTree.sections = reorderSections(state.sectionTree.sections);
          }
        }

        // Update current proposal
        if (state.currentProposal) {
          state.currentProposal.sections = state.sectionTree.sections;
          state.currentProposal.updatedAt = new Date().toISOString();
        }
      }
    },

    moveSection: (state, action: PayloadAction<DragResult>) => {
      const { source, destination, draggableId } = action.payload;
      
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      // Find and remove the dragged section
      const draggedSection = findSectionById(state.sectionTree.sections, draggableId);
      if (!draggedSection) return;

      state.sectionTree.sections = removeSectionById(state.sectionTree.sections, draggableId);

      // Update parent reference
      const newParentId = destination.droppableId === 'root' ? undefined : destination.droppableId;
      const updatedSection = { ...draggedSection, parentId: newParentId };

      // Insert at new position
      if (newParentId) {
        // Insert into parent's children
        const updateParentChildren = (sections: ProposalSection[]): ProposalSection[] => {
          return sections.map(section => {
            if (section.id === newParentId) {
              const children = section.children || [];
              children.splice(destination.index, 0, updatedSection);
              return { ...section, children: reorderSections(children) };
            }
            if (section.children) {
              return { ...section, children: updateParentChildren(section.children) };
            }
            return section;
          });
        };
        state.sectionTree.sections = updateParentChildren(state.sectionTree.sections);
      } else {
        // Insert at root level
        state.sectionTree.sections.splice(destination.index, 0, updatedSection);
        state.sectionTree.sections = reorderSections(state.sectionTree.sections);
      }

      // Update current proposal
      if (state.currentProposal) {
        state.currentProposal.sections = state.sectionTree.sections;
        state.currentProposal.updatedAt = new Date().toISOString();
      }
    },

    selectSection: (state, action: PayloadAction<string>) => {
      state.sectionTree.selectedSectionId = action.payload;
    },

    toggleSectionExpansion: (state, action: PayloadAction<string>) => {
      const sectionId = action.payload;
      if (state.sectionTree.expandedSections.has(sectionId)) {
        state.sectionTree.expandedSections.delete(sectionId);
      } else {
        state.sectionTree.expandedSections.add(sectionId);
      }
    },

    setSectionSearchQuery: (state, action: PayloadAction<string>) => {
      state.sectionTree.searchQuery = action.payload;
    },

    setSectionFilters: (state, action: PayloadAction<SectionTreeState['filters']>) => {
      state.sectionTree.filters = action.payload;
    },

    // Drag state management
    setDraggedSection: (state, action: PayloadAction<string | undefined>) => {
      state.sectionTree.draggedSectionId = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
});

export const {
  setCurrentProposal,
  updateProposalTitle,
  addSection,
  deleteSection,
  updateSection,
  duplicateSection,
  moveSection,
  selectSection,
  toggleSectionExpansion,
  setSectionSearchQuery,
  setSectionFilters,
  setDraggedSection,
  setLoading,
  setError
} = proposalSlice.actions;

export default proposalSlice.reducer;