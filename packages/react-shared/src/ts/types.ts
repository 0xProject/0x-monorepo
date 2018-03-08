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

export enum EtherscanLinkSuffixes {
    Address = 'address',
    Tx = 'tx',
}

export enum Networks {
    Mainnet = 'Mainnet',
    Kovan = 'Kovan',
    Ropsten = 'Ropsten',
    Rinkeby = 'Rinkeby',
}
