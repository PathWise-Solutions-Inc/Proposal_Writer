import { Organization } from './Organization';
import { User } from './User';
import { RFP } from './RFP';
export declare class Proposal {
    id: string;
    title: string;
    proposalNumber: string;
    structure: {
        sections: Array<{
            id: string;
            title: string;
            order: number;
            content?: string;
            subsections?: Array<{
                id: string;
                title: string;
                order: number;
                content?: string;
            }>;
            metadata?: {
                wordCount?: number;
                lastEditedBy?: string;
                lastEditedAt?: Date;
                aiGenerated?: boolean;
            };
        }>;
    };
    status: 'draft' | 'in_review' | 'finalized' | 'submitted' | 'won' | 'lost';
    complianceTracking: {
        requirements?: Array<{
            requirementId: string;
            addressed: boolean;
            sectionIds: string[];
            notes?: string;
        }>;
        overallScore?: number;
        lastChecked?: Date;
    };
    metadata: {
        clientInfo?: {
            name: string;
            industry?: string;
            size?: string;
            painPoints?: string[];
        };
        winThemes?: string[];
        discriminators?: string[];
        pricing?: {
            total?: number;
            currency?: string;
            breakdown?: any;
        };
    };
    collaborators: Array<{
        userId: string;
        role: 'owner' | 'editor' | 'reviewer' | 'viewer';
        addedAt: Date;
    }>;
    versions: Array<{
        versionNumber: number;
        createdAt: Date;
        createdBy: string;
        changes: string;
        snapshot?: any;
    }>;
    organizationId: string;
    organization: Organization;
    rfpId: string;
    rfp: RFP;
    ownerId: string;
    owner: User;
    submissionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Proposal.d.ts.map