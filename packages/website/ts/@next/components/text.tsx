import * as React from 'react';
import styled from 'styled-components';
import {getCSSPadding, PaddingInterface} from 'ts/@next/constants/utilities';

interface BaseTextInterface extends PaddingInterface {
    size?: 'default' | 'medium' | 'large' | 'small';
    isCentered?: boolean;
}

interface HeadingProps extends BaseTextInterface {
    asElement?: 'h1'| 'h2'| 'h3'| 'h4';
    isCentered?: boolean;
    isNoMargin?: boolean;
    marginBottom?: string;
    color?: string;
}

interface ParagraphProps extends BaseTextInterface {
    isNoMargin?: boolean;
    marginBottom?: string; // maybe we should remove isNoMargin
    isMuted?: boolean | number;
}

const StyledHeading = styled.h1<HeadingProps>`
    color: ${props => props.color || props.theme.textColor};
    font-size: ${props => `var(--${props.size || 'default'}Heading)`};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    line-height: ${props => `var(--${props.size || 'default'}HeadingHeight)`};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    text-align: ${props => props.isCentered && 'center'};
    font-weight: 300;
    margin-left: ${props => props.isCentered && 'auto'};
    margin-right: ${props => props.isCentered && 'auto'};
`;

export const Heading: React.StatelessComponent<HeadingProps> = props => {
    const {
        asElement = 'h1',
        children,
        ...style,
    } = props;
    const Component = StyledHeading.withComponent(asElement);

    return (
        <Component
            style={{...style}}
            {...props}
        >
            {children}
        </Component>;
    )
}

// No need to declare it twice as Styled then rewrap as a stateless comp
// Note: this would be useful to be implemented the same way was "Heading"
// and be more generic. e.g. <Text /> with a props asElement so we can use it
// for literally anything =
export const Paragraph = styled.p<ParagraphProps>`
    font-size: ${props => `var(--${props.size || 'default'}Paragraph)`};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    color: ${props => props.color || props.theme.textColor};
    opacity: ${props => typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted};
    text-align: ${props => props.isCentered && 'center'};
    line-height: 1.4;
`;

Paragraph.defaultProps = {
    isMuted: true,
};
