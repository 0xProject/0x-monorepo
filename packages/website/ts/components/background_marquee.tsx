import React from "react";
import styled, { keyframes } from "styled-components";

const scrollFactory = (height:number,imgRepeatCt:number) => keyframes`
    0% { transform: translate3d(0, -${height}px, 0) }
    100% { transform: translate3d(0, -${height*(imgRepeatCt-1)}px, 0) }
`;

const scrollMobileFactory = (height:number,imgRepeatCt:number) => keyframes`
    0% { transform: translate3d(0, -${height}px, 0) }
    100% { transform: translate3d(0, -${height*(imgRepeatCt-1)}px, 0) }
`;

interface MarqueeWrapProps {
    height?: string;
    imgHeightInPx: number;
    imgRepeatCt: number;
}

const MarqueeWrap = styled.div<MarqueeWrapProps>`
  width: 100%;
  height: ${props => props.height || "100%"};
  overflow: hidden;
  position: relative;

  &:after {
    content: "";
    position: absolute;
    width: 100%;
    height: ${props => props.height || "100%"};
    left: 0;
    top: 0;
    background: linear-gradient(180.18deg, #000000 11.09%, rgba(0, 0, 0, 0.8) 62.74%, rgba(0, 0, 0, 0) 103.8%);
  }

  @media (max-width: 768px) {
    overflow: hidden;
  }

  > div {
    height: auto;
    display: flex;
    flex-direction: column;
    will-change: transform;
    transform: translate3d(0, -715px, 0);
  }

  @media (min-width: 768px) {
    > div {
      height: ${props => props.imgHeightInPx*props.imgRepeatCt}px;
      animation: ${props => scrollFactory(props.imgHeightInPx,props.imgRepeatCt)} 140s linear infinite;
    }
  }

  @media (max-width: 768px) {
    > div {
        height: ${props => props.imgHeightInPx*props.imgRepeatCt}px;
        animation: ${props => scrollMobileFactory(props.imgHeightInPx,props.imgRepeatCt)} 140s linear infinite;
    }
  }
`;

interface CardProps {
    imgHeight:number
}

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
      height: ${props => props.imgHeight};
    }
  }

  @media (max-width: 768px) {
    img {
      width: 100%;
      height: ${props => props.imgHeight};
    }
  }
`;

const MarqueeImg = styled.img`
  object-fit: cover;
  opacity: 0.4;
`

export interface BackgroundMarqueeProps {
    height?: string;
    imgHeightInPx: number;
    imgSrcUrl: string;
}

export class BackgroundMarquee extends React.Component<BackgroundMarqueeProps> {
    state={
        imgRepeatCt:5
    }

    componentDidMount() {

    }

    onImageUpdate = () => {

    }

    public render(): React.ReactNode {
        return <MarqueeWrap height={this.props.height} imgHeightInPx={this.props.imgHeightInPx} imgRepeatCt={this.state.imgRepeatCt}>
            <div>
                {[...Array(this.state.imgRepeatCt)].map((item, index) => (
                    <Card imgHeight={this.props.imgHeightInPx} key={`card-${index}`}>
                        <MarqueeImg src={this.props.imgSrcUrl} alt="" />
                    </Card>
                ))}
            </div>
        </MarqueeWrap>
    }
}