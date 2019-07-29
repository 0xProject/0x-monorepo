import * as React from 'react';
import styled, { keyframes } from 'styled-components';

const scrollFactory = (height: number, imgRepeatCt: number) => keyframes`
    0% { transform: translate3d(0, -${height}px, 0) }
    100% { transform: translate3d(0, -${height * (imgRepeatCt - 1)}px, 0) }
`;

const scrollMobileFactory = (height: number, imgRepeatCt: number) => keyframes`
    0% { transform: translate3d(0, -${height}px, 0) }
    100% { transform: translate3d(0, -${height * (imgRepeatCt - 1)}px, 0) }
`;

interface MarqueeWrapProps {
    height?: string;
    imgHeightInPx: number;
    imgRepeatCt: number;
}

const MarqueeWrap = styled.div<MarqueeWrapProps>`
    width: 130%;
    margin-left: -15%;
    margin-right: -15%;
    height: ${props => props.height || '100%'};
    overflow: hidden;
    position: relative;

    &:after {
        content: '';
        position: absolute;
        width: 100%;
        height: ${props => props.height || '100%'};
        left: 0;
        top: 0;
        background: linear-gradient(180.18deg, #000000 11.09%, rgba(0, 0, 0, 0.8) 62.74%, rgba(0, 0, 0, 0) 103.8%);
    }

    &:before {
        content: '';
        position: absolute;
        height: 4rem;
        left: -2rem;
        right: -2rem;
        bottom: -2rem;
        filter: blur(1rem);
        z-index: 1;
        background: #000;
    }

    @media (max-width: 768px) {
        overflow: hidden;
    }

    > div {
        height: auto;
        display: flex;
        flex-direction: column;
        will-change: transform;
        transform: translate3d(0, -${props => props.imgHeightInPx}px, 0);
    }

    @media (min-width: 768px) {
        > div {
            height: ${props => props.imgHeightInPx * props.imgRepeatCt}px;
            animation: ${props => scrollFactory(props.imgHeightInPx, props.imgRepeatCt)} 140s linear infinite;
        }
    }

    @media (max-width: 768px) {
        > div {
            height: ${props => props.imgHeightInPx * props.imgRepeatCt}px;
            animation: ${props => scrollMobileFactory(props.imgHeightInPx, props.imgRepeatCt)} 140s linear infinite;
        }
    }
`;

interface CardProps {}

const Card = styled.div<CardProps>`
    opacity: 1;
    will-change: opacity, transform;

    & + & {
        margin-top: -0px;
    }

    img {
        height: auto;
    }

    @media (min-width: 768px) {
        img {
            width: 100%;
        }
    }

    @media (max-width: 768px) {
        img {
            width: 100%;
        }
    }
`;

const MarqueeImg = styled.img`
    object-fit: cover;
    opacity: 1;
`;

export interface BackgroundMarqueeProps {
    height?: string;
    imgSrcUrl: string;
}

export class BackgroundMarquee extends React.Component<BackgroundMarqueeProps> {
    public state = {
        imgRepeatCt: 3,
        imgHeightInPx: 2000,
    };

    private _imageRef: HTMLImageElement;

    public render(): React.ReactNode {
        return (
            <MarqueeWrap
                height={this.props.height}
                imgHeightInPx={this.state.imgHeightInPx}
                imgRepeatCt={this.state.imgRepeatCt}
            >
                <div>
                    {[...Array(this.state.imgRepeatCt)].map((item, index) => (
                        <Card key={`card-${index}`}>
                            <MarqueeImg
                                onLoad={index === 0 ? this._onImageUpdate : null}
                                ref={ref => (index === 0 ? (this._imageRef = ref) : null)}
                                src={this.props.imgSrcUrl}
                                alt=""
                            />
                        </Card>
                    ))}
                </div>
            </MarqueeWrap>
        );
    }

    private readonly _onImageUpdate = () => {
        if (!!this._imageRef) {
            this.setState({ imgHeightInPx: this._imageRef.clientHeight });
        }
    };
}
