import * as React from 'react';
import styled from 'styled-components';
import { getCSSPadding, PaddingInterface } from 'ts/@next/constants/utilities';

interface BaseTextInterface extends PaddingInterface {
    size?: 'default' | 'medium' | 'large' | 'small';
    isCentered?: boolean;
}

interface HeadingProps extends BaseTextInterface {
    asElement?: 'h1'| 'h2'| 'h3'| 'h4';
    isCentered?: boolean;
    isNoMargin?: boolean;
    color?: string;
}

interface ParagraphProps extends BaseTextInterface {
    isNoMargin?: boolean;
    isMuted?: boolean | number;
}

interface ParagraphSizes {
    default: string;
    medium: string;
    large: string;
    [key: string]: string;
}

const PARAGRAPH_SIZES: ParagraphSizes = {
    default: '18px',
    small: '14px',
    medium: '22px',
    large: '28px',
};

const StyledHeading = styled.h1<HeadingProps>`
    color: ${props => props.color || props.theme.textColor};
    font-size: ${props => `var(--${props.size}Heading)`};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    line-height: ${props => `var(--${props.size}HeadingHeight)`};
    margin-bottom: ${props => !props.isNoMargin && '30px'};
    text-align: ${props => props.isCentered && 'center'};
    font-weight: 300;
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
// Note: this would be useful to be implemented the same way was "Heading"
// and be more generic. e.g. <Text /> with a props asElement so we can use it
// for literally anything =
export const Paragraph = styled.p<ParagraphProps>`
    font-size: ${props => PARAGRAPH_SIZES[props.size || 'default']};
    margin-bottom: ${props => !props.isNoMargin && '30px'};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    color: ${props => props.color || props.theme.textColor};
    opacity: ${props => typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted};
    text-align: ${props => props.isCentered && 'center'};
    line-height: 1.4;
`;
