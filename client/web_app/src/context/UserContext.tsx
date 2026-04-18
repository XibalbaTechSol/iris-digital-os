import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'FEA_SPECIALIST' | 'ICA_CONSULTANT' | 'SDPC_NURSE' | 'ADRC_AGENT' | 'DHS_AUDITOR';

interface UserProfile {
    id: string;
    name: string;
    role: UserRole;
}

interface UserContextType {
    user: UserProfile;
    setRole: (role: UserRole) => void;
}

const defaultUser: UserProfile = {
    id: 'DEMO_USER_01',
    name: 'C. Sterling',
    role: 'ADMIN'
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile>(defaultUser);

    const setRole = (role: UserRole) => {
        setUser(prev => ({ ...prev, role }));
    };

    return (
        <UserContext.Provider value={{ user, setRole }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
