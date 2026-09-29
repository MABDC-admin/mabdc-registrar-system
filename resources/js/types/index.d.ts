export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        modulePermissions: Record<string, boolean>;
    };
    pendingRegistrationCount?: number;
    recentPendingRegistrations?: Array<{
        id: number;
        full_name: string;
        level_applied_for: string;
        created_at: string;
    }>;
    recentNotifications?: any[];
};
