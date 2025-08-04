import { Organization } from './Organization';
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    isActive: boolean;
    refreshToken?: string;
    organizationId?: string;
    organization?: Organization;
    createdAt: Date;
    updatedAt: Date;
    hashPassword(): Promise<void>;
    validatePassword(password: string): Promise<boolean>;
}
//# sourceMappingURL=User.d.ts.map