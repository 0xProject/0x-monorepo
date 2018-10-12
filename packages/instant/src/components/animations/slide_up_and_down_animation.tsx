import * as React from 'react';

import { keyframes, styled } from '../../style/theme';

const slideKeyframeGenerator = (fromY: string, toY: string) => keyframes`
    from {
        position: relative;
        top: ${fromY}
    }

    to {
        position: relative;
        top: ${toY}
    }
`;

export interface SlideAnimationProps {
    keyframes: string;
    animationType: string;
    animationDirection?: string;
}
export const SlideAnimation =
    styled.div <
    SlideAnimationProps >
    `
    animation-name: ${props => props.keyframes};
    animation-duration: 0.3s;
    animation-timing-function: ${props => props.animationType};
    animation-delay: 0s;
    animation-iteration-count: 1;
    animation-fill-mode: ${props => props.animationDirection || 'none'};
    position: relative;
    z-index: -1;
`;

export const SlideUpAnimationComponent: React.StatelessComponent<{ downY: string }> = props => (
    <SlideAnimation animationType="ease-in" keyframes={slideKeyframeGenerator(props.downY, '0px')}>
        {props.children}
    </SlideAnimation>
);

export const SlideDownAnimationComponent: React.StatelessComponent<{ downY: string }> = props => (
    <SlideAnimation
        animationDirection="forwards"
        animationType="cubic-bezier(0.25, 0.1, 0.25, 1)"
        keyframes={slideKeyframeGenerator('0px', props.downY)}
    >
        {props.children}
    </SlideAnimation>
);

export interface SlideUpAndDownAnimationProps {
    delayMs: number;
    downY: string;
}

interface SlideUpAndDownState {
    slideState: 'up' | 'down';
}

export class SlideUpAndDownAnimationComponent extends React.Component<
    SlideUpAndDownAnimationProps,
    SlideUpAndDownState
> {
    private _timeoutNumber: number | undefined;

    constructor(props: SlideUpAndDownAnimationProps) {
        super(props);
        this._timeoutNumber = undefined;
        this.state = {
            slideState: 'up',
        };
    }

    public render(): JSX.Element {
        return this._renderSlide();
    }

    public componentDidMount(): void {
        this._timeoutNumber = window.setTimeout(() => {
            this.setState({
                slideState: 'down',
            });
        }, this.props.delayMs);

        return;
    }

    public componentWillUnmount(): void {
        if (this._timeoutNumber) {
            window.clearTimeout(this._timeoutNumber);
        }
    }

    private readonly _renderSlide = (): JSX.Element => {
        const SlideComponent = this.state.slideState === 'up' ? SlideUpAnimationComponent : SlideDownAnimationComponent;

        return <SlideComponent downY={this.props.downY}>{this.props.children}</SlideComponent>;
    };
}
