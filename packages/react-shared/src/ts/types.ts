export interface Styles {
    [name: string]: React.CSSProperties;
}

export enum HeaderSizes {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
}

export interface MenuSubsectionsBySection {
    [section: string]: string[];
}
