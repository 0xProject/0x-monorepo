import { createContext } from 'react';

interface ContextInterface {
    title?: string;
    name?: string;
    docLink?: string;
    subtitle?: string;
    tagline?: string;
    icon?: React.ReactNode;
    colors?: {
        main: string;
        secondary: string;
        secondary_alt: string;
        type: string;
        type_alt: string;
        dark: string;
    };
}

const ThemeContext = createContext({});

export { ThemeContext, ContextInterface };
