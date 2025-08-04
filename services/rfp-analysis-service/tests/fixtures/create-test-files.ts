import fs from 'fs-extra';
import path from 'path';

/**
 * Utility to create test files on demand for testing scenarios
 */
export class TestFileCreator {
  private static tempDir = '/tmp/proposal-writer-tests';

  static async ensureTempDir(): Promise<void> {
    await fs.ensureDir(this.tempDir);
  }

  static async cleanup(): Promise<void> {
    try {
      await fs.remove(this.tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Create a minimal valid PDF file for testing
   */
  static async createTestPDF(filename: string = 'test.pdf'): Promise<string> {
    await this.ensureTempDir();
    
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 125
>>
stream
BT
/F1 12 Tf
50 750 Td
(REQUEST FOR PROPOSAL - TEST DOCUMENT) Tj
0 -30 Td
(This is a test PDF for RFP Analysis Engine testing.) Tj
0 -30 Td
(Client: Test Corporation) Tj
0 -30 Td
(Due Date: 2024-12-31) Tj
0 -30 Td
(Budget: $100,000 - $500,000) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000290 00000 n 
0000000470 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
540
%%EOF`;

    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, pdfContent);
    return filePath;
  }

  /**
   * Create a test Word document (minimal DOCX structure)
   */
  static async createTestDOCX(filename: string = 'test.docx'): Promise<string> {
    await this.ensureTempDir();
    
    // This is a simplified DOCX - in reality, DOCX is a complex ZIP structure
    // For testing purposes, we'll create a file with .docx extension
    const docxContent = `
REQUEST FOR PROPOSAL - WORD DOCUMENT TEST

Company: Word Test Corporation
Project: Document Processing System
RFP ID: DOC-2024-001

EVALUATION CRITERIA:
1. Technical Expertise (40%)
2. Cost Effectiveness (30%)
3. Timeline (20%)
4. Support (10%)

REQUIREMENTS:
- Microsoft Office integration
- Cloud-based solution
- 24/7 support availability
- SOC 2 compliance

Budget Range: $75,000 - $200,000
Proposal Due: March 31, 2024
    `;

    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, docxContent);
    return filePath;
  }

  /**
   * Create a comprehensive text RFP file
   */
  static async createTestTXT(filename: string = 'test.txt'): Promise<string> {
    await this.ensureTempDir();
    
    const txtContent = `REQUEST FOR PROPOSAL - COMPREHENSIVE TEXT FILE

SECTION 1: PROJECT OVERVIEW
Company: Text File Test Corp
Project: Enterprise System Integration
RFP Number: TXT-2024-ESI-001
Issue Date: January 1, 2024
Due Date: March 15, 2024

SECTION 2: EVALUATION CRITERIA
The following criteria will be used to evaluate proposals:

1. Technical Approach and Architecture (35%)
   - System design quality
   - Integration capabilities
   - Scalability considerations
   - Security implementation

2. Team Experience and Qualifications (25%)
   - Relevant project experience
   - Team member certifications
   - Past client success stories
   - Technical expertise depth

3. Project Management and Timeline (20%)
   - Implementation methodology
   - Risk management approach
   - Milestone planning
   - Quality assurance processes

4. Cost and Financial Considerations (15%)
   - Total project cost
   - Cost breakdown transparency
   - Value proposition
   - Payment terms flexibility

5. Post-Implementation Support (5%)
   - Support availability
   - Maintenance services
   - Training programs
   - Documentation quality

SECTION 3: MANDATORY REQUIREMENTS
All proposals must address the following mandatory requirements:

TECHNICAL REQUIREMENTS:
- Cloud-native architecture (AWS, Azure, or GCP)
- RESTful API design with OpenAPI 3.0 documentation
- PostgreSQL or MySQL database backend
- Redis caching layer implementation
- Elasticsearch for search functionality
- Docker containerization
- Kubernetes orchestration support
- SSL/TLS encryption for all communications
- OAuth 2.0 authentication implementation
- Role-based access control (RBAC)

INTEGRATION REQUIREMENTS:
- Salesforce CRM integration
- Microsoft Office 365 integration
- Slack notification system
- GitHub/GitLab repository connections
- LDAP/Active Directory authentication
- SAML 2.0 single sign-on support
- Webhook support for third-party services
- ETL capabilities for data migration

COMPLIANCE REQUIREMENTS:
- SOC 2 Type II compliance
- GDPR data protection compliance
- HIPAA compliance capabilities
- ISO 27001 security standards
- Regular security audit support
- Data encryption at rest and in transit
- Audit trail and logging capabilities
- Backup and disaster recovery planning

PERFORMANCE REQUIREMENTS:
- 99.9% uptime SLA guarantee
- Sub-2 second page load times
- Support for 1000+ concurrent users
- Auto-scaling capabilities
- Load balancing implementation
- CDN integration for global performance
- Database optimization and indexing
- Caching strategy implementation

SECTION 4: PREFERRED QUALIFICATIONS
The following qualifications are preferred but not mandatory:

VENDOR QUALIFICATIONS:
- Minimum 5 years experience in enterprise solutions
- ISO 9001 quality management certification
- Agile/Scrum development methodology
- DevOps culture and practices
- 24/7 technical support availability
- Multiple data center locations
- Financial stability and insurance coverage
- Local presence for on-site support

TECHNOLOGY PREFERENCES:
- React.js or Vue.js frontend framework
- Node.js or Python backend development
- MongoDB NoSQL database experience
- Machine learning and AI capabilities
- Mobile application development
- Progressive Web App (PWA) implementation
- GraphQL API experience
- Microservices architecture

SECTION 5: PROJECT TIMELINE
The expected project timeline is as follows:

Phase 1: Discovery and Planning (Weeks 1-4)
- Requirements gathering and analysis
- System architecture design
- Technical specifications development
- Project planning and resource allocation

Phase 2: Development and Integration (Weeks 5-20)
- Core system development
- API development and testing
- Third-party integrations
- Security implementation
- Performance optimization

Phase 3: Testing and Quality Assurance (Weeks 21-24)
- Unit testing and code review
- Integration testing
- User acceptance testing
- Security penetration testing
- Performance and load testing

Phase 4: Deployment and Launch (Weeks 25-28)
- Production environment setup
- Data migration and validation
- User training and documentation
- Go-live support and monitoring
- Post-launch optimization

SECTION 6: BUDGET INFORMATION
Total Project Budget: $500,000 - $1,200,000

Budget Breakdown Guidelines:
- Development and Implementation: 60-70%
- Project Management: 10-15%
- Testing and Quality Assurance: 10-15%
- Training and Documentation: 5-10%
- Contingency: 5-10%

Payment Schedule:
- 20% upon contract signing
- 30% upon Phase 1 completion
- 30% upon Phase 2 completion
- 15% upon Phase 3 completion
- 5% upon final acceptance and go-live

SECTION 7: PROPOSAL SUBMISSION REQUIREMENTS
All proposals must include the following sections:

EXECUTIVE SUMMARY (Maximum 3 pages)
- Project understanding and approach
- Key value propositions
- High-level timeline and budget
- Team introduction and credentials

TECHNICAL APPROACH (Maximum 15 pages)
- Detailed system architecture
- Technology stack recommendations
- Integration strategy and approach
- Security and compliance measures
- Performance and scalability planning

PROJECT MANAGEMENT (Maximum 8 pages)
- Project methodology and approach
- Timeline with detailed milestones
- Resource allocation and team structure
- Risk management and mitigation
- Quality assurance processes

TEAM AND EXPERIENCE (Maximum 10 pages)
- Team member profiles and roles
- Relevant project case studies
- Client references and testimonials
- Certifications and qualifications
- Company background and stability

COST PROPOSAL (Maximum 5 pages)
- Detailed cost breakdown by phase
- Resource rates and assumptions
- Optional features and pricing
- Payment terms and conditions
- Cost comparison and justification

SECTION 8: EVALUATION PROCESS
The evaluation process will consist of the following stages:

Stage 1: Initial Screening (Week 1)
- Compliance with mandatory requirements
- Completeness of proposal submission
- Budget alignment and feasibility
- Initial technical assessment

Stage 2: Detailed Technical Review (Weeks 2-3)
- Technical architecture evaluation
- Integration capabilities assessment
- Security and compliance review
- Performance and scalability analysis

Stage 3: Vendor Presentations (Week 4)
- 2-hour presentation and demonstration
- Technical deep-dive discussions
- Q&A session with evaluation team
- Team member interviews

Stage 4: Reference Checks (Week 5)
- Client reference interviews
- Project success validation
- Support and maintenance feedback
- Financial stability verification

Stage 5: Final Selection (Week 6)
- Comprehensive evaluation scoring
- Cost-benefit analysis
- Final vendor selection
- Contract negotiation initiation

SECTION 9: TERMS AND CONDITIONS
The following terms and conditions apply to this RFP:

GENERAL TERMS:
- Proposals must be submitted by 5:00 PM EST on March 15, 2024
- Late submissions will not be accepted
- Proposals are valid for 90 days from submission date
- All costs for proposal preparation are vendor responsibility
- Client reserves right to reject any or all proposals
- Client reserves right to negotiate with selected vendor

CONFIDENTIALITY:
- All RFP information is confidential and proprietary
- Vendors must sign non-disclosure agreement
- Proposal information will be kept confidential
- No information sharing between competing vendors

INTELLECTUAL PROPERTY:
- All developed IP will be owned by client
- Vendor retains rights to pre-existing IP
- Open source components must be clearly identified
- License agreements must be provided for all software

WARRANTIES AND GUARANTEES:
- 12-month warranty on all delivered solutions
- Performance guarantees as specified in SLA
- Error correction and bug fixes at no additional cost
- Professional indemnity insurance required

SECTION 10: CONTACT INFORMATION
Primary Contact:
Jennifer Martinez, CTO
Email: jennifer.martinez@textfiletestcorp.com
Phone: (555) 987-6543

Secondary Contact:
David Kim, Procurement Director
Email: david.kim@textfiletestcorp.com
Phone: (555) 987-6544

All questions must be submitted in writing by February 28, 2024.
Responses will be provided to all registered vendors by March 5, 2024.

Thank you for your interest in this project opportunity.

Text File Test Corp
Enterprise Solutions Division
123 Technology Drive
Innovation City, IC 12345
www.textfiletestcorp.com`;

    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, txtContent);
    return filePath;
  }

  /**
   * Create an RTF file for testing
   */
  static async createTestRTF(filename: string = 'test.rtf'): Promise<string> {
    await this.ensureTempDir();
    
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 REQUEST FOR PROPOSAL - RTF FORMAT TEST\\par
\\par
Company: RTF Test Solutions\\par
Project: Rich Text Document Processing\\par
RFP ID: RTF-2024-001\\par
\\par
\\b EVALUATION CRITERIA:\\b0\\par
1. Technical Approach (40%)\\par
2. Experience (30%)\\par
3. Cost (20%)\\par
4. Timeline (10%)\\par
\\par
\\b REQUIREMENTS:\\b0\\par
- RTF document processing capability\\par
- Rich text formatting preservation\\par
- Cross-platform compatibility\\par
- Unicode character support\\par
\\par
Budget: $50,000 - $150,000\\par
Due Date: April 30, 2024\\par
}`;

    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, rtfContent);
    return filePath;
  }

  /**
   * Create a large file for testing file size limits
   */
  static async createLargeFile(
    filename: string = 'large-test.pdf',
    sizeInMB: number = 55
  ): Promise<string> {
    await this.ensureTempDir();
    
    const filePath = path.join(this.tempDir, filename);
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = sizeInMB;
    
    const writeStream = fs.createWriteStream(filePath);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = Buffer.alloc(chunkSize, `Large file test data chunk ${i}\n`);
      writeStream.write(chunk);
    }
    
    await new Promise<void>((resolve, reject) => {
      writeStream.end((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    return filePath;
  }

  /**
   * Create a corrupted PDF file for error testing
   */
  static async createCorruptedPDF(filename: string = 'corrupted.pdf'): Promise<string> {
    await this.ensureTempDir();
    
    const corruptedContent = `%PDF-1.4
This is not a valid PDF file content.
It should cause parsing errors in the text extraction service.
Random binary data: ${Buffer.from('corrupted data').toString('base64')}
%%EOF`;

    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, corruptedContent);
    return filePath;
  }

  /**
   * Create an empty file for edge case testing
   */
  static async createEmptyFile(filename: string = 'empty.txt'): Promise<string> {
    await this.ensureTempDir();
    
    const filePath = path.join(this.tempDir, filename);
    await fs.writeFile(filePath, '');
    return filePath;
  }

  /**
   * Create a file with special characters in the name
   */
  static async createSpecialCharFile(): Promise<string> {
    const specialFilename = 'RFP-2024!@#$%^&*()_+{}[]\\|;\':",.pdf';
    return this.createTestPDF(specialFilename);
  }

  /**
   * Create multiple test files for batch testing
   */
  static async createTestFileBatch(count: number = 5): Promise<string[]> {
    const files: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const filename = `batch-test-${i + 1}.txt`;
      const content = `Batch test file ${i + 1}\nContent for testing purposes\nFile number: ${i + 1}`;
      
      await this.ensureTempDir();
      const filePath = path.join(this.tempDir, filename);
      await fs.writeFile(filePath, content);
      files.push(filePath);
    }
    
    return files;
  }
}

// Export utility functions for easy access
export const createTestPDF = TestFileCreator.createTestPDF.bind(TestFileCreator);
export const createTestDOCX = TestFileCreator.createTestDOCX.bind(TestFileCreator);
export const createTestTXT = TestFileCreator.createTestTXT.bind(TestFileCreator);
export const createTestRTF = TestFileCreator.createTestRTF.bind(TestFileCreator);
export const createLargeFile = TestFileCreator.createLargeFile.bind(TestFileCreator);
export const createCorruptedPDF = TestFileCreator.createCorruptedPDF.bind(TestFileCreator);
export const createEmptyFile = TestFileCreator.createEmptyFile.bind(TestFileCreator);
export const createSpecialCharFile = TestFileCreator.createSpecialCharFile.bind(TestFileCreator);
export const createTestFileBatch = TestFileCreator.createTestFileBatch.bind(TestFileCreator);
export const cleanupTestFiles = TestFileCreator.cleanup.bind(TestFileCreator);