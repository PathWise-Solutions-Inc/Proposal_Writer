import { User } from './User';
export declare class Organization {
    id: string;
    name: string;
    domain: string;
    description: string;
    subscriptionTier: string;
    maxUsers: number;
    maxProposalsPerMonth: number;
    settings: {
        branding?: {
            primaryColor?: string;
            logo?: string;
        };
        features?: {
            aiContentGeneration?: boolean;
            clientResearch?: boolean;
            advancedAnalytics?: boolean;
        };
    };
    users: User[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
//# sourceMappingURL=Organization.d.ts.map