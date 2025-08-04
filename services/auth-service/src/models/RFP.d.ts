import { Organization } from './Organization';
import { User } from './User';
export declare class RFP {
    id: string;
    title: string;
    description: string;
    clientName: string;
    dueDate: Date | null;
    metadata: {
        originalFileName?: string;
        fileSize?: number;
        pageCount?: number;
        uploadedBy?: string;
        fileHash?: string;
        filePath?: string;
        mimeType?: string;
        analysisError?: string;
    } | null;
    extractedText: string;
    analysisResults: {
        evaluationCriteria?: Array<{
            criterion: string;
            weight: number;
            description: string;
            maxPoints?: number;
            scoringCriteria?: Array<string>;
        }>;
        requirements?: Array<{
            id: string;
            text: string;
            category: string;
            mandatory: boolean;
        }>;
        keyDates?: Array<{
            event: string;
            date: Date | null;
        }>;
        budgetRange?: {
            min?: number;
            max?: number;
            currency?: string;
        } | null;
        summary?: string;
        keywords?: Array<string>;
        totalPoints?: number;
        confidenceScore?: number;
        analysisCompletedAt?: Date;
    } | null;
    status: 'uploaded' | 'processing' | 'analyzed' | 'error';
    organizationId: string;
    organization: Organization;
    uploadedById: string;
    uploadedBy: User;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=RFP.d.ts.map