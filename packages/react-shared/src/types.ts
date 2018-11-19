export interface Styles {
    [name: string]: React.CSSProperties;
}

export enum HeaderSizes {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
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

export enum LinkType {
    External = 'EXTERNAL',
    ReactScroll = 'REACT_SCROLL',
    ReactRoute = 'REACT_ROUTE',
}

export interface ALink {
    title: string;
    to: string;
    shouldOpenInNewTab?: boolean;
}
