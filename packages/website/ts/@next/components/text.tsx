import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';


interface HeadingProps {
    asElement?: 'h1'| 'h2'| 'h3'| 'h4';
    size?: 'default' | 'medium' | 'large' | 'small';
    center?: boolean;
    children: Node | string;
    noMargin?: any;
}

interface ParagraphProps {
    noMargin?: any;
    size?: 'default' | 'small' | 'medium' | 'large';
    muted?: any;
    center?: any;
}

interface HeadingSizes {
    large: string;
    medium: string;
    default: string;
    small: string;
    [key: string]: string;
}

interface ParagraphSizes {
    default: string;
    medium: string;
    large: string;
    [key: string]: string;
}

const HEADING_SIZES: HeadingSizes = {
    large: '80px',
    medium: '50px',
    default: '28px',
    small: '20px',
};

const PARAGRAPH_SIZES: ParagraphSizes = {
    default: '18px',
    medium: '22px',
    large: '28px',
};

const StyledHeading = styled.h1<HeadingProps>`
    color: ${props => props.color || colors.white};
    font-size: ${props => HEADING_SIZES[props.size || 'default']};
    margin-bottom: ${props => !props.noMargin && '30px'};
    text-align: ${props => props.center && 'center'};
`;

export const Heading: React.StatelessComponent<HeadingProps> = props => {
    const {
    asElement = 'h1',
    children,
    } = props;
    const Component = StyledHeading.withComponent(asElement);

    return <Component {...props}>{children}</Component>;
};

// No need to declare it twice as Styled then rewrap as a stateless comp
export const Paragraph = styled.p<ParagraphProps>`
    font-size: ${props => PARAGRAPH_SIZES[props.size || 'default']};
    margin-bottom: ${props => !props.noMargin && '30px'};
    line-height: 1.4;
    color: ${props => `rgba(255, 255, 255, ${props.muted || 0.75})`};
    text-align: ${props => props.center && 'center'};
`;
