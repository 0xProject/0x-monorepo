import { createContext } from 'react';

interface ContextInterface {
    title?: string;
    name?: string;
    subtitle?: string;
    tagline?: string;
    icon?: React.ReactNode;
    colors?: any;
}

const ThemeContext = createContext({});

export { ThemeContext, ContextInterface };
