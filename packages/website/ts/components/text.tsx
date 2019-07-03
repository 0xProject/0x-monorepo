import * as React from 'react';
import styled from 'styled-components';
import { getCSSPadding, PaddingInterface } from 'ts/constants/utilities';

interface BaseTextInterface extends PaddingInterface {
    size?: 'default' | 'medium' | 'large' | 'small' | number;
    isCentered?: boolean;
    textAlign?: string;
}

interface HeadingProps extends BaseTextInterface {
    asElement?: 'h1' | 'h2' | 'h3' | 'h4';
    maxWidth?: string;
    fontWeight?: string;
    isCentered?: boolean;
    isFlex?: boolean;
    isNoMargin?: boolean;
    isMuted?: boolean | number;
    isInline?: boolean;
    marginBottom?: string;
    color?: string;
    children?: React.ReactNode | string;
}

interface ParagraphProps extends BaseTextInterface {
    isNoMargin?: boolean;
    marginBottom?: string; // maybe we should remove isNoMargin
    isMuted?: boolean | number;
    fontWeight?: string | number;
}

const StyledHeading = styled.h1<HeadingProps>`
    max-width: ${props => props.maxWidth};
    color: ${props => props.color || props.theme.textColor};
    display: ${props => (props.isFlex ? `inline-flex` : props.isInline ? 'inline' : undefined)};
    align-items: center;
    justify-content: ${props => props.isFlex && `space-between`};
    font-size: ${props =>
        typeof props.size === 'string' ? `var(--${props.size || 'default'}Heading)` : `${props.size}px`};
    line-height: ${props => `var(--${props.size || 'default'}HeadingHeight)`};
    text-align: ${props => props.isCentered && 'center'};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    margin-left: ${props => props.isCentered && 'auto'};
    margin-right: ${props => props.isCentered && 'auto'};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    opacity: ${props => (typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted)};
    font-weight: ${props => (props.fontWeight ? props.fontWeight : ['h4'].includes(props.asElement) ? 400 : 300)};
    width: ${props => props.isFlex && `100%`};
`;

export const Heading: React.StatelessComponent<HeadingProps> = props => {
    const { asElement = 'h1', children } = props;
    const Component = StyledHeading.withComponent(asElement);

    return <Component {...props}>{children}</Component>;
};

Heading.defaultProps = {
    size: 'default',
};

// No need to declare it twice as Styled then rewrap as a stateless comp
// Note: this would be useful to be implemented the same way was "Heading"
// and be more generic. e.g. <Text /> with a props asElement so we can use it
// for literally anything =
export const Paragraph = styled.p<ParagraphProps>`
    font-size: ${props => `var(--${props.size || 'default'}Paragraph)`};
    font-weight: ${props => props.fontWeight || 300};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    color: ${props => props.color || props.theme.paragraphColor};
    opacity: ${props => (typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted)};
    text-align: ${props => (props.textAlign ? props.textAlign : props.isCentered && 'center')};
    line-height: 1.4;
`;

Paragraph.defaultProps = {
    isMuted: true,
};
