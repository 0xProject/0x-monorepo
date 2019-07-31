declare module '@reach/dialog';
declare module 'truffle-contract';
declare module 'whatwg-fetch';
declare module 'thenby';
declare module 'react-document-title';
declare module 'react-ga';
declare module 'reach__dialog';
declare module 'react-flickity-component';
declare module 'react-anchor-link-smooth-scroll';
declare module 'react-responsive';
declare module 'react-scrollable-anchor';
declare module 'react-headroom';
declare module 'zeroExInstant';
declare module 'react-toggle-component';
declare module 'react-modal-video';

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
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
