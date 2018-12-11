import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Icon } from 'ts/@next/components/icon';
import { Paragraph, Heading } from 'ts/@next/components/text';

interface SliderProps {
}

interface SlideProps {
    icon: string;
    heading: string;
    text: string;
    href?: string;
}

export const Slide: React.StatelessComponent<SlideProps> = (props: SlideProps) => {
    const { heading, text, href, icon } = props;

    return (
        <StyledSlide>
            <SlideHead>
                <Icon name={icon} size="large" margin="auto" />
            </SlideHead>
            <SlideContent>
                <Heading asElement="h4" size="small" marginBottom="15px">{heading}</Heading>
                <Paragraph isMuted={true}>{text}</Paragraph>
            </SlideContent>
        </StyledSlide>
    );
};

export const Slider: React.StatelessComponent<SliderProps> = props => {
    return (
        <StyledSlider>
            <SliderInner>
                {props.children}
            </SliderInner>
        </StyledSlider>
    );
};

const StyledSlider = styled.div`
    overflow: hidden;
    width: 100%;
    height: 520px;
`;

const SliderInner = styled.div`
    position: absolute;
    display: flex;
    width: 100%;
`;

const StyledSlide = styled.div`
    background-color: ${colors.backgroundDark};
    width: 560px;
    height: 520px;
    flex: 0 0 auto;

    & + & {
        margin-left: 30px;
    }
`;

const SlideHead = styled.div`
    background-color: ${colors.brandDark};
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SlideContent = styled.div`
    padding: 30px;
`;
