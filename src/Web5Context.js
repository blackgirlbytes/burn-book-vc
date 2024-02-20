// Web5Context.js
import { createContext, useContext, useState, useEffect } from 'react';
import { Web5 } from "@web5/api";

const Web5Context = createContext(null);

export const useWeb5 = () => useContext(Web5Context);

export const Web5Provider = ({ children }) => {
    const [web5Instance, setWeb5Instance] = useState(null);
    const [myDid, setMyDid] = useState(null);

    useEffect(() => {
        const connectWeb5 = async () => {
            try {
                const { web5, did } = await Web5.connect({ sync: '5s' });
                setWeb5Instance(web5);
                setMyDid(did);
            } catch (error) {
                console.error("Error connecting to Web5:", error);
            }
        };

        connectWeb5();
    }, []);

    
    return (
        <Web5Context.Provider value={{ web5Instance, myDid }}>
            {children}
        </Web5Context.Provider>
    );
};
