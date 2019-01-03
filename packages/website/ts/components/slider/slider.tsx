import * as React from 'react';
import Flickity from 'react-flickity-component';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';

interface SliderProps {}

interface SlideProps {
    icon: string;
    heading: string;
    text: string;
    href?: string;
}

const flickityOptions = {
    initialIndex: 0,
    cellAlign: 'left',
    arrowShape:
        'M0 50.766L42.467 93.58l5.791-5.839-32.346-32.61H100V46.84H15.48L50.2 11.838 44.409 6 5.794 44.93l-.003-.003z',
    prevNextButtons: true,
};

export const Slide: React.StatelessComponent<SlideProps> = (props: SlideProps) => {
    const { heading, text, icon } = props;

    return (
        <StyledSlide>
            <SlideHead>
                <Icon name={icon} size="large" />
            </SlideHead>
            <SlideContent>
                <Heading asElement="h4" size="small" marginBottom="15px">
                    {heading}
                </Heading>
                <Paragraph isMuted={true}>{text}</Paragraph>
            </SlideContent>
        </StyledSlide>
    );
};

export const Slider: React.StatelessComponent<SliderProps> = props => {
    return (
        <StyledSlider>
            <Flickity
                className={'carousel'} // default ''
                elementType={'div'} // default 'div'
                options={flickityOptions} // takes flickity options {}
                disableImagesLoaded={false} // default false
            >
                {props.children}
            </Flickity>
        </StyledSlider>
    );
};

const StyledSlider = styled.div`
    //overflow: hidden;
    width: 100%;
    height: 520px;

    @media (max-width: 500px) {
        height: 450px;
    }

    .carousel {
        display: block;
        user-select: none;
        touch-action: pan-y;
        -webkit-tap-highlight-color: transparent;
        outline: none;

        @media (max-width: 500px) {
            overflow: hidden;
            margin-left: -20px;
            width: calc(100vw - 20px);
        }
    }

    .flickity-viewport {
        outline: none;
    }

    .flickity-button {
        cursor: pointer;
        position: absolute;
        width: 74px;
        height: 74px;
        background-color: #000;
        display: flex;
        outline: 0;
        top: calc(50% - 37px);
        border: 0;
        padding: 0;
        transition: background-color 0.4s ease-in-out, visibility 0.4s ease-in-out, opacity 0.4s ease-in-out;

        &:disabled {
            opacity: 0;
            visibility: hidden;
        }

        &:hover {
            background-color: hsla(0, 0%, 10%, 1);
        }

        &.previous {
            left: 0;
        }

        &.next {
            right: 0;
        }

        svg {
            margin: auto;
            width: 28px;
            height: auto;
        }

        path {
            fill: #fff;
        }
    }
`;

const StyledSlide = styled.div`
    background-color: ${colors.backgroundDark};
    width: 560px;
    height: 520px;
    flex: 0 0 auto;
    opacity: 0.3;
    transition: opacity 0.4s ease-in-out;

    & + & {
        margin-left: 30px;
    }

    @media (max-width: 1200px) {
        width: 100%;
    }

    @media (max-width: 500px) {
        width: calc(100vw - 10px - 30px);
        height: 450px;

        & + & {
            margin-left: 10px;
        }
    }

    &.is-selected {
        opacity: 1;
    }
`;

const SlideHead = styled.div`
    background-color: ${colors.brandDark};
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (max-width: 500px) {
        height: 240px;
    }
`;

const SlideContent = styled.div`
    padding: 30px;

    @media (max-width: 500px) {
        padding: 20px;
    }
`;
