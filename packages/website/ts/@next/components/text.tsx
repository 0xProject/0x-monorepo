import * as React from 'react';
import styled from 'styled-components';
import {getCSSPadding, PaddingInterface} from 'ts/@next/constants/utilities';

interface BaseTextInterface extends PaddingInterface {
    size?: 'default' | 'medium' | 'large' | 'small' | number;
    isCentered?: boolean;
}

interface HeadingProps extends BaseTextInterface {
    asElement?: 'h1'| 'h2'| 'h3'| 'h4';
    maxWidth?: string;
    isCentered?: boolean;
    isNoMargin?: boolean;
    isMuted?: boolean | number;
    marginBottom?: string;
    color?: string;
}

interface ParagraphProps extends BaseTextInterface {
    isNoMargin?: boolean;
    marginBottom?: string; // maybe we should remove isNoMargin
    isMuted?: boolean | number;
}

const StyledHeading = styled.h1<HeadingProps>`
    max-width: ${props => props.maxWidth};
    color: ${props => props.color || props.theme.textColor};
    font-size: ${props => isNaN(props.size) ? `var(--${props.size || 'default'}Heading)` : `${props.size}px`};
    line-height: ${props => `var(--${props.size || 'default'}HeadingHeight)`};
    text-align: ${props => props.isCentered && 'center'};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    margin-left: ${props => props.isCentered && 'auto'};
    margin-right: ${props => props.isCentered && 'auto'};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    opacity: ${props => typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted};
    font-weight: ${props => ['h4'].includes(props.asElement) ? 400 : 300};
`;

export const Heading: React.StatelessComponent<HeadingProps> = props => {
    const {
        asElement = 'h1',
        children,
        ...style
    } = props;
    const Component = StyledHeading.withComponent(asElement);

    return (
        <Component
            style={{...style}}
            {...props}
        >
            {children}
        </Component>
    );
};

// No need to declare it twice as Styled then rewrap as a stateless comp
// Note: this would be useful to be implemented the same way was "Heading"
// and be more generic. e.g. <Text /> with a props asElement so we can use it
// for literally anything =
export const Paragraph = styled.p<ParagraphProps>`
    font-size: ${props => `var(--${props.size || 'default'}Paragraph)`};
    margin-bottom: ${props => !props.isNoMargin && (props.marginBottom || '30px')};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    color: ${props => props.color || props.theme.paragraphColor};
    opacity: ${props => typeof props.isMuted === 'boolean' ? 0.75 : props.isMuted};
    text-align: ${props => props.isCentered && 'center'};
    line-height: 1.4;
`;

Paragraph.defaultProps = {
    isMuted: true,
};
