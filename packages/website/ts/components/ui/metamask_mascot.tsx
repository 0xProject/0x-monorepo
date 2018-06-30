import * as debounce from 'debounce';
import * as metamaskLogo from 'metamask-logo';
import * as React from 'react';

export interface MetaMaskMascotProps {
    width: string;
    height: string;
    animationEventEmitter: any;
}
interface MetaMaskMascotState {}

export class MetaMaskMascot extends React.Component<MetaMaskMascotProps, MetaMaskMascotState> {
    private _logo: any;
    private _refollowMouse: any;
    private _unfollowMouse: any;
    private _animations: any;
    public constructor(props: MetaMaskMascotProps) {
        super(props);
        this._logo = metamaskLogo({
            followMouse: true,
            pxNotRatio: true,
            width: props.width,
            height: props.height,
        });
        this._refollowMouse = debounce(this._logo.setFollowMouse.bind(this._logo, true), 1000);
        this._unfollowMouse = this._logo.setFollowMouse.bind(this._logo, false);
    }
    public componentDidMount(): void {
        const targetDivId = 'metamask-mascot-container';
        const container = document.getElementById(targetDivId);
        container.appendChild(this._logo.container);
    }
    public componentWillAmount(): void {
        this._animations = this.props.animationEventEmitter;
        this._animations.removeAllListeners();
        this._logo.container.remove();
        this._logo.stopAnimation();
    }
    public render(): React.ReactNode {
        // this is a bit hacky
        // the event emitter is on `this.props`
        // and we dont get that until render
        this._handleAnimationEvents();

        return <div id="metamask-mascot-container" style={{ zIndex: 0 }} />;
    }
    private _handleAnimationEvents(): void {
        // only setup listeners once
        if (this._animations) {
            return;
        }
        this._animations = this.props.animationEventEmitter;
        this._animations.on('point', this._lookAt.bind(this));
        this._animations.on('setFollowMouse', this._logo.setFollowMouse.bind(this._logo));
    }
    private _lookAt(target: any): void {
        this._unfollowMouse();
        this._logo.lookAt(target);
        this._refollowMouse();
    }
}
