import { createContext, useContext, useMemo, useEffect } from 'react';
import APIClient from "../../../dyce-npm-package/APIClient.js";

const APIClientContext = createContext(null);

export const APIClientProvider = ({ children }) => {
    const apiClient = useMemo(() => {
        const token = localStorage.getItem('accessToken') || '';
        const client = new APIClient(token);
        return client;
    }, []);

    // Add any additional logic here if you need to handle refresh tokens or re-authentication

    return (
        <APIClientContext.Provider value={apiClient}>
            {children}
        </APIClientContext.Provider>
    );
};

export const useAPIClient = () => {
    const context = useContext(APIClientContext);
    if (!context) throw new Error("useAPIClient must be used within an APIClientProvider");
    return context;
};
