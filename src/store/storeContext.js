import { createContext, useContext } from 'react';

// Kept in its own module so StoreContext.jsx only exports a component
// (keeps React Fast Refresh happy and the lint clean).
export const StoreContext = createContext(null);

export const useStore = () => useContext(StoreContext);
