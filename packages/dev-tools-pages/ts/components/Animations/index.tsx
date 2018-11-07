import * as React from 'react';
import Lottie from 'react-lottie';
import styled from 'styled-components';

import { media } from 'ts/variables';

interface AnimationProps {
    animationData: object;
    width: number;
    height: number;
}

interface AnimationState {
    width?: number;
    height?: number;
}

class Animation extends React.PureComponent<AnimationProps, AnimationState> {
    timeout = null as any;
    constructor(props: AnimationProps) {
        super(props);

        this.state = {
            height: undefined,
            width: undefined,
        };

        this.handleResize = this.handleResize.bind(this);
        this.updateAnimationSize = this.updateAnimationSize.bind(this);
    }

    componentDidMount() {
        this.updateAnimationSize();
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.updateAnimationSize, 50);
    }

    updateAnimationSize() {
        const windowWidth = window.innerWidth;
        let width = undefined;
        let height = undefined;
        if (windowWidth <= 1000) {
            const maxWidth = windowWidth + 250;
            const ratio = maxWidth / this.props.width;

            height = Math.round(this.props.height * ratio);
            width = Math.round(this.props.width * ratio);
        }

        this.setState({ width, height });
    }

    render() {
        let { animationData } = this.props;
        const height = this.state.height || this.props.height;
        const width = this.state.width || this.props.width;

        return (
            <Container height={height}>
                <InnerContainer>
                    <Lottie
                        width={width}
                        height={height}
                        options={{
                            loop: true,
                            autoplay: true,
                            animationData: animationData,
                        }}
                    />
                </InnerContainer>
            </Container>
        );
    }
}

const Container = styled.div`
    width: 100%;
    height: ${(props: { height: number }) => props.height}px;
    position: absolute;
    top: 40%;
    left: 0;
    z-index: -1;
    overflow: hidden;
    ${media.large`
        top: 100%;
        transform: translateY(-50%);
    `};
`;

const InnerContainer = styled.div`
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
`;

export default Animation;
