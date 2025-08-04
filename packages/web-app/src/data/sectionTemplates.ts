import { ProposalSection, SectionType } from '../types/section.types';

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  section: Omit<ProposalSection, 'id' | 'proposalId' | 'createdAt' | 'updatedAt'>;
}

export const sectionTemplates: SectionTemplate[] = [
  // Executive Summary Templates
  {
    id: 'exec-summary-basic',
    name: 'Executive Summary',
    description: 'Standard executive summary with key points',
    category: 'Executive Summary',
    section: {
      type: SectionType.GROUP,
      title: 'Executive Summary',
      isRequired: true,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Overview',
          content: { text: 'Overview' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.PARAGRAPH,
          title: 'Problem Statement',
          content: { text: 'Clearly define the problem or opportunity that this proposal addresses...' },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.PARAGRAPH,
          title: 'Proposed Solution',
          content: { text: 'Describe your proposed solution and its key benefits...' },
          isRequired: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.LIST,
          title: 'Key Benefits',
          content: {
            listItems: [
              'Benefit 1: Describe the primary benefit',
              'Benefit 2: Explain the secondary benefit',
              'Benefit 3: Additional value proposition',
            ],
            listType: 'unordered',
          },
          isRequired: true,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Technical Approach Templates
  {
    id: 'tech-approach-detailed',
    name: 'Technical Approach',
    description: 'Comprehensive technical solution description',
    category: 'Technical',
    section: {
      type: SectionType.GROUP,
      title: 'Technical Approach',
      isRequired: true,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Technical Overview',
          content: { text: 'Technical Overview' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.PARAGRAPH,
          title: 'Architecture',
          content: { text: 'Describe the system architecture and design principles...' },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.LIST,
          title: 'Technology Stack',
          content: {
            listItems: [
              'Frontend: React, TypeScript, Material-UI',
              'Backend: Node.js, Express, PostgreSQL',
              'Infrastructure: AWS, Docker, Kubernetes',
            ],
            listType: 'unordered',
          },
          isRequired: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Project Timeline Templates
  {
    id: 'timeline-phases',
    name: 'Project Timeline',
    description: 'Phase-based project timeline',
    category: 'Project Management',
    section: {
      type: SectionType.GROUP,
      title: 'Project Timeline',
      isRequired: true,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Implementation Phases',
          content: { text: 'Implementation Phases' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.TABLE,
          title: 'Project Phases',
          content: {
            tableData: {
              headers: ['Phase', 'Duration', 'Deliverables', 'Milestones'],
              rows: [
                ['Phase 1: Discovery', '2 weeks', 'Requirements document, Technical spec', 'Kickoff complete'],
                ['Phase 2: Development', '8 weeks', 'Core features, API integration', 'MVP ready'],
                ['Phase 3: Testing', '2 weeks', 'Test reports, Bug fixes', 'UAT complete'],
                ['Phase 4: Deployment', '1 week', 'Production release', 'Go-live'],
              ],
            },
          },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Budget Templates
  {
    id: 'budget-breakdown',
    name: 'Budget Breakdown',
    description: 'Detailed cost breakdown table',
    category: 'Financial',
    section: {
      type: SectionType.GROUP,
      title: 'Budget',
      isRequired: true,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Cost Breakdown',
          content: { text: 'Cost Breakdown' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.TABLE,
          title: 'Budget Details',
          content: {
            tableData: {
              headers: ['Item', 'Quantity', 'Unit Cost', 'Total Cost'],
              rows: [
                ['Development Hours', '320', '$150/hr', '$48,000'],
                ['Project Management', '80', '$125/hr', '$10,000'],
                ['Infrastructure Setup', '1', '$5,000', '$5,000'],
                ['Licenses & Tools', '1', '$2,000', '$2,000'],
              ],
            },
          },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.PARAGRAPH,
          title: 'Payment Terms',
          content: { text: 'Payment terms: 50% upon contract signing, 25% at midpoint milestone, 25% upon project completion.' },
          isRequired: false,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Team Qualifications
  {
    id: 'team-quals',
    name: 'Team Qualifications',
    description: 'Team member profiles and expertise',
    category: 'Team',
    section: {
      type: SectionType.GROUP,
      title: 'Team Qualifications',
      isRequired: false,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Our Team',
          content: { text: 'Our Team' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.PARAGRAPH,
          title: 'Team Overview',
          content: { text: 'Our team brings together experts in software development, project management, and domain expertise...' },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.LIST,
          title: 'Key Team Members',
          content: {
            listItems: [
              'Technical Lead - 10+ years experience in enterprise software',
              'Senior Developer - Expert in React and Node.js ecosystems',
              'Project Manager - PMP certified with agile expertise',
              'QA Lead - Automated testing and quality assurance specialist',
            ],
            listType: 'unordered',
          },
          isRequired: false,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Risk Management
  {
    id: 'risk-mitigation',
    name: 'Risk Management',
    description: 'Risk assessment and mitigation strategies',
    category: 'Project Management',
    section: {
      type: SectionType.GROUP,
      title: 'Risk Management',
      isRequired: false,
      isExpanded: true,
      order: 0,
      children: [
        {
          id: '',
          proposalId: '',
          type: SectionType.HEADING,
          title: 'Risk Assessment',
          content: { text: 'Risk Assessment' },
          isRequired: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '',
          proposalId: '',
          type: SectionType.TABLE,
          title: 'Risk Matrix',
          content: {
            tableData: {
              headers: ['Risk', 'Probability', 'Impact', 'Mitigation Strategy'],
              rows: [
                ['Scope Creep', 'Medium', 'High', 'Clear requirements, change management process'],
                ['Technical Complexity', 'Low', 'Medium', 'Proof of concept, phased approach'],
                ['Resource Availability', 'Low', 'High', 'Dedicated team, backup resources'],
                ['Integration Issues', 'Medium', 'Medium', 'Early integration testing, API documentation'],
              ],
            },
          },
          isRequired: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  },

  // Simple Templates
  {
    id: 'simple-paragraph',
    name: 'Paragraph Section',
    description: 'Simple text paragraph',
    category: 'Basic',
    section: {
      type: SectionType.PARAGRAPH,
      title: 'New Section',
      content: { text: 'Enter your content here...' },
      isRequired: false,
      order: 0,
    },
  },
  {
    id: 'simple-list',
    name: 'Bullet List',
    description: 'Unordered list of items',
    category: 'Basic',
    section: {
      type: SectionType.LIST,
      title: 'Key Points',
      content: {
        listItems: ['Point 1', 'Point 2', 'Point 3'],
        listType: 'unordered',
      },
      isRequired: false,
      order: 0,
    },
  },
  {
    id: 'simple-table',
    name: 'Data Table',
    description: 'Table for structured data',
    category: 'Basic',
    section: {
      type: SectionType.TABLE,
      title: 'Data Table',
      content: {
        tableData: {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
          ],
        },
      },
      isRequired: false,
      order: 0,
    },
  },
];

export const templateCategories = [...new Set(sectionTemplates.map(t => t.category))];

export function getTemplatesByCategory(category: string): SectionTemplate[] {
  return sectionTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): SectionTemplate | undefined {
  return sectionTemplates.find(t => t.id === id);
}