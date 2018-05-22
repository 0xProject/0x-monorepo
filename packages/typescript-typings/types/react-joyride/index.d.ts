// Type definitions for react-joyride 2.0.0-11
// Project: https://github.com/gilbarbara/react-joyride

declare module 'react-joyride' {
    import * as React from 'react';
    export interface StyleOptions {
        arrowColor?: string,
        backgroundColor?: string,
        primaryColor?: string,
        textColor?: string,
        overlayColor?: string,
        spotlightShadow?: string,
        beaconSize?: number,
        zIndex?: number,
    }
    
    export interface Step {
        title?: string;
        content: React.ReactNode;
        target: string;
        placement?: "top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "right" | "left";
        type?: "click" | "hover";
        isFixed?: boolean;
        allowClicksThruHole?: boolean;
        disableBeacon?: boolean;
        style?: StyleOptions;
        [prop: string]: any;
    }
    
    export interface Props {
        steps?: Step[];
        beaconComponent?: React.ComponentClass;
        run?: boolean;
        stepIndex?: number;
        callback?: (options: any) => void;
        debug?: boolean;
        styles?: { options: StyleOptions };
    }
    
    export interface State {
        action: string,
        controlled: boolean,
        index: number,
        lifecycle: string,
        size: 0,
        status: string,
    }
    
    export default class Joyride extends React.Component<Props, State> {
        constructor(props: Props);
    
        static defaultProps: Props;
    }
}