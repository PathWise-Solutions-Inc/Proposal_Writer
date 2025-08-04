export enum SectionType {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  TABLE = 'table',
  IMAGE = 'image',
  CUSTOM = 'custom',
  GROUP = 'group'
}

export enum ListType {
  UNORDERED = 'unordered',
  ORDERED = 'ordered',
  CHECKLIST = 'checklist'
}

export interface SectionContent {
  text?: string;
  level?: number; // For headings (1-6)
  listType?: ListType;
  listItems?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  imageUrl?: string;
  imageAlt?: string;
  customHtml?: string;
}

export interface ProposalSection {
  id: string;
  type: SectionType;
  title: string;
  content: SectionContent;
  parentId?: string;
  children?: ProposalSection[];
  order: number;
  isCollapsed?: boolean;
  isRequired?: boolean;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    tags?: string[];
    notes?: string;
  };
}

export interface SectionTreeState {
  sections: ProposalSection[];
  selectedSectionId?: string;
  draggedSectionId?: string;
  expandedSections: Set<string>;
  searchQuery?: string;
  filters: {
    type?: SectionType;
    isRequired?: boolean;
    tags?: string[];
  };
}

export interface DragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination?: {
    droppableId: string;
    index: number;
  };
  draggableId: string;
  type: string;
}

export interface SectionTreeActions {
  addSection: (parentId?: string, type?: SectionType) => void;
  deleteSection: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<ProposalSection>) => void;
  moveSection: (result: DragResult) => void;
  selectSection: (sectionId: string) => void;
  toggleSection: (sectionId: string) => void;
  duplicateSection: (sectionId: string) => void;
}

export interface SectionTemplateItem {
  id: string;
  name: string;
  type: SectionType;
  description: string;
  icon: string;
  defaultContent: SectionContent;
}

export const DEFAULT_SECTION_TEMPLATES: SectionTemplateItem[] = [
  {
    id: 'heading-1',
    name: 'Main Heading',
    type: SectionType.HEADING,
    description: 'Primary section heading',
    icon: 'Title',
    defaultContent: { text: 'New Section', level: 1 }
  },
  {
    id: 'heading-2',
    name: 'Sub Heading',
    type: SectionType.HEADING,
    description: 'Secondary section heading',
    icon: 'Subject',
    defaultContent: { text: 'New Subsection', level: 2 }
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    type: SectionType.PARAGRAPH,
    description: 'Text content block',
    icon: 'TextFields',
    defaultContent: { text: 'Enter your content here...' }
  },
  {
    id: 'bullet-list',
    name: 'Bullet List',
    type: SectionType.LIST,
    description: 'Unordered list of items',
    icon: 'List',
    defaultContent: { 
      listType: ListType.UNORDERED, 
      listItems: ['Item 1', 'Item 2', 'Item 3'] 
    }
  },
  {
    id: 'numbered-list',
    name: 'Numbered List',
    type: SectionType.LIST,
    description: 'Ordered list of items',
    icon: 'ListOrdered',
    defaultContent: { 
      listType: ListType.ORDERED, 
      listItems: ['First item', 'Second item', 'Third item'] 
    }
  },
  {
    id: 'table',
    name: 'Table',
    type: SectionType.TABLE,
    description: 'Data table with headers',
    icon: 'Table',
    defaultContent: {
      tableData: {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['Data 1', 'Data 2', 'Data 3'],
          ['Data 4', 'Data 5', 'Data 6']
        ]
      }
    }
  },
  {
    id: 'image',
    name: 'Image',
    type: SectionType.IMAGE,
    description: 'Image with caption',
    icon: 'Image',
    defaultContent: { imageUrl: '', imageAlt: 'Image description' }
  },
  {
    id: 'group',
    name: 'Section Group',
    type: SectionType.GROUP,
    description: 'Collapsible group of sections',
    icon: 'Folder',
    defaultContent: { text: 'Section Group' }
  }
];