import * as React from 'react';

import { keyframes, styled } from '../../style/theme';

const slideKeyframeGenerator = (fromY: string, toY: string) => keyframes`
    from {
        position: relative;
        top: ${fromY};
    }

    to {
        position: relative;
        top: ${toY};
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
`;

export interface SlideAnimationComponentProps {
    downY: string;
}

export const SlideUpAnimationComponent: React.StatelessComponent<SlideAnimationComponentProps> = props => (
    <SlideAnimation animationType="ease-in" keyframes={slideKeyframeGenerator(props.downY, '0px')}>
        {props.children}
    </SlideAnimation>
);

export const SlideDownAnimationComponent: React.StatelessComponent<SlideAnimationComponentProps> = props => (
    <SlideAnimation
        animationDirection="forwards"
        animationType="cubic-bezier(0.25, 0.1, 0.25, 1)"
        keyframes={slideKeyframeGenerator('0px', props.downY)}
    >
        {props.children}
    </SlideAnimation>
);

export interface SlideUpAndDownAnimationProps extends SlideAnimationComponentProps {
    delayMs: number;
}

enum SlideState {
    Up = 'up',
    Down = 'down',
}
interface SlideUpAndDownState {
    slideState: SlideState;
}

export class SlideUpAndDownAnimation extends React.Component<SlideUpAndDownAnimationProps, SlideUpAndDownState> {
    public state = {
        slideState: SlideState.Up,
    };

    private _timeoutId?: number;
    public render(): React.ReactNode {
        return this._renderSlide();
    }
    public componentDidMount(): void {
        this._timeoutId = window.setTimeout(() => {
            this.setState({
                slideState: SlideState.Down,
            });
        }, this.props.delayMs);

        return;
    }
    public componentWillUnmount(): void {
        if (this._timeoutId) {
            window.clearTimeout(this._timeoutId);
        }
    }
    private _renderSlide(): React.ReactNode {
        const SlideComponent = this.state.slideState === 'up' ? SlideUpAnimationComponent : SlideDownAnimationComponent;

        return <SlideComponent downY={this.props.downY}>{this.props.children}</SlideComponent>;
    }
}
