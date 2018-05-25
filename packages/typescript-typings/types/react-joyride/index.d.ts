// Type definitions for react-joyride 2.0.0-11
// Project: https://github.com/gilbarbara/react-joyride

declare module 'react-joyride' {
    import * as React from 'react';
    export interface StyleOptions {
        arrowColor?: string;
        backgroundColor?: string;
        primaryColor?: string;
        textColor?: string;
        overlayColor?: string;
        spotlightShadow?: string;
        beaconSize?: number;
        zIndex?: number;
    }

    export type Placement =
        | 'top'
        | 'top-left'
        | 'top-right'
        | 'bottom'
        | 'bottom-left'
        | 'bottom-right'
        | 'right'
        | 'left';

    export interface Step {
        title?: string;
        content: React.ReactNode;
        target: string;
        placement?: Placement;
        type?: 'click' | 'hover';
        isFixed?: boolean;
        allowClicksThruHole?: boolean;
        disableBeacon?: boolean;
        style?: StyleOptions;
        [prop: string]: any;
    }

    export interface StyleOptionsProp {
        options: StyleOptions;
    }

    interface CallbackMetadata {
        type:
            | 'tour:start'
            | 'step:before'
            | 'beacon'
            | 'tooltip'
            | 'close'
            | 'step:after'
            | 'tour:end'
            | 'tour:status'
            | 'error:target_not_found'
            | 'error';
        step: number;
    }

    export type CallbackData = CallbackMetadata & State;

    export interface Props {
        steps?: Step[];
        beaconComponent?: React.ReactNode;
        disableOverlayClose?: boolean;
        continuous?: boolean;
        run?: boolean;
        stepIndex?: number;
        callback?: (data: CallbackData) => void;
        debug?: boolean;
        styles?: StyleOptionsProp;
    }

    export interface State {
        action: 'prev' | 'close' | 'next';
        controlled: boolean;
        index: number;
        lifecycle: string;
        size: 0;
        status: string;
    }

    export default class Joyride extends React.Component<Props, State> {
        constructor(props: Props);

        static defaultProps: Props;
    }
}
