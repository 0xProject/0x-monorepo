// Type definitions for react-popper 1.0.0-beta.6
// Project: https://github.com/gilbarbara/react-joyride

declare module 'react-popper' {
    import * as React from 'react';
    import * as PopperJS from 'popper.js';

    interface ManagerProps {
        children: React.ReactNode;
    }
    export class Manager extends React.Component<ManagerProps, {}> {}

    type RefHandler = (ref: HTMLElement | null) => void;

    export interface ReferenceChildrenProps {
        ref: RefHandler;
    }

    export interface ReferenceProps {
        children: (props: ReferenceChildrenProps) => React.ReactNode;
    }
    export class Reference extends React.Component<ReferenceProps, {}> {}

    export interface PopperArrowProps {
        ref: RefHandler;
        style: React.CSSProperties;
    }

    export type Placement = PopperJS.Placement;

    export interface PopperChildrenProps {
        arrowProps: PopperArrowProps;
        outOfBoundaries: boolean | null;
        placement: PopperJS.Placement;
        ref: RefHandler;
        scheduleUpdate: () => void;
        style: React.CSSProperties;
    }

    export interface PopperProps {
        children: (props: PopperChildrenProps) => React.ReactNode;
        eventsEnabled?: boolean;
        modifiers?: PopperJS.Modifiers;
        placement?: PopperJS.Placement;
        positionFixed?: boolean;
        referenceElement?: Element;
    }
    export class Popper extends React.Component<PopperProps, {}> {}
}
