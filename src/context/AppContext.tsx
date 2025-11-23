import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AppContextProps {
    isTranscribing: boolean;
    setIsTranscribing: (value: boolean) => void;
    isBleConnected: boolean;
    setIsBleConnected: (value: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isTranscribing, setIsTranscribingState] = useState(false);
    const [isBleConnected, setIsBleConnected] = useState(false);

    const setIsTranscribing = (value: boolean) => {
        console.log('AppContext: setIsTranscribing called with', value);
        setIsTranscribingState(value);
    };

    return (
        <AppContext.Provider value={{ isTranscribing, setIsTranscribing, isBleConnected, setIsBleConnected }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
