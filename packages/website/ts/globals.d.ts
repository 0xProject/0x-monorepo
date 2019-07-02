declare module '@reach/dialog';
declare module '@reach/tabs';
declare module 'truffle-contract';
declare module 'whatwg-fetch';
declare module 'thenby';
declare module 'react-document-title';
declare module 'react-ga';
declare module 'reach__dialog';
declare module 'reach__tabs';
declare module 'react-flickity-component';
declare module 'algoliasearch';
declare module 'algoliasearch/lite';
declare module 'react-instantsearch-dom';
declare module 'react-autocomplete';
declare module 'react-autosuggest';
declare module 'react-anchor-link-smooth-scroll';
declare module 'react-responsive';
declare module 'react-scrollable-anchor';
declare module 'react-headroom';
declare module 'zeroExInstant';
declare module 'react-toggle-component';

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module '*.mdx' {
    let MDXComponent: (props) => JSX.Element;
    export default MDXComponent;
}

declare module '@mdx-js/react' {
    import { ComponentType, StyleHTMLAttributes } from 'react';

    interface MDXProps {
        children: React.ReactNode;
        components: { [key: string]: React.ReactNode };
    }
    export class MDXProvider extends React.Component<MDXProps> {}
}

declare module '*.svg' {
    import { PureComponent, SVGProps } from 'react';
    export default class extends PureComponent<SVGProps<SVGSVGElement>> {}
}

declare module 'web3-provider-engine/subproviders/filters';

// This will be defined by default in TS 2.4
// Source: https://github.com/Microsoft/TypeScript/issues/12364
interface System {
    import<T>(module: string): Promise<T>;
}
declare var System: System;
