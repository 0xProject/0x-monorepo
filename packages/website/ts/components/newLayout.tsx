import * as React from 'react';
import styled from 'styled-components';

import { opacify } from 'polished';

export interface WrapProps {
    bgColor?: string;
    id?: string;
    offsetTop?: string;
    maxWidth?: string;
    wrapWidth?: string;
    isFullWidth?: boolean;
    isTextCentered?: boolean;
    isCentered?: boolean;
    isWrapped?: boolean;
}

export interface WrapGridProps {
    isWrapped?: boolean;
    isCentered?: boolean;
}

export interface WrapStickyProps {
    offsetTop?: string;
}

export interface SectionProps extends WrapProps {
    isPadded?: boolean;
    isFullWidth?: boolean;
    isFlex?: boolean;
    overflow?: string;
    padding?: string;
    margin?: string;
    paddingMobile?: string;
    hasBorder?: boolean;
    hasHover?: boolean;
    flexBreakpoint?: string;
    maxWidth?: string;
    bgColor?: 'dark' | 'light' | string;
    children: any;
    alignItems?: string;
    omitWrapper?: boolean;
}

export interface FlexProps {
    padding?: string;
    isFlex?: boolean;
    flexBreakpoint?: string;
    alignItems?: string;
    justifyContent?: string;
}

export interface ColumnProps {
    padding?: string;
    width?: string;
    maxWidth?: string;
}

export const Section: React.FunctionComponent<SectionProps> = (props: SectionProps) => {
    if (props.omitWrapper) {
        return <SectionBase {...props} />;
    }
    return (
        <SectionBase {...props}>
            <Wrap {...props}>{props.children}</Wrap>
        </SectionBase>
    );
};

export const Column = styled.div<ColumnProps>`
    width: ${props => props.width};
    max-width: ${props => props.maxWidth};
    padding: ${props => props.padding};

    @media (max-width: 768px) {
        width: 100%;

        & + & {
            margin-top: 60px;
        }
    }
`;

export const FlexWrap = styled.div<FlexProps>`
    max-width: 1500px;
    margin: 0 auto;
    padding: ${props => props.padding};
    @media (min-width: ${props => props.flexBreakpoint || '768px'}) {
        display: ${props => props.isFlex && 'flex'};
        justify-content: ${props =>
            props.justifyContent ? props.justifyContent : props.isFlex ? 'space-between' : undefined};
        align-items: ${props => props.alignItems};
    }
`;

export const WrapSticky = styled.div<WrapProps>`
    position: sticky;
    top: ${props => props.offsetTop || '60px'};
`;

const SectionBase = styled.section<SectionProps>`
    width: ${props => !props.isFullWidth && 'calc(100% - 60px)'};
    max-width: 1500px;
    cursor: ${props => props.hasHover && 'pointer'};
    border: ${props => props.hasBorder && `1px solid ${props.theme.lightBgColor}`};
    margin: ${props => (props.margin ? props.margin : '0 auto')};
    padding: ${props => props.isPadded && (props.padding || '120px 0')};
    background-color: ${props => props.theme[`${props.bgColor}BgColor`] || props.bgColor};
    position: relative;
    overflow: ${props => !props.isFullWidth && (props.overflow || 'hidden')};

    &:hover {
        background-color: ${props => props.hasHover && opacify(0.2, props.theme[`lightBgColor`])};
    }

    @media (max-width: 768px) {
        padding: ${props => props.isPadded && (props.paddingMobile || '40px 0')};
    }
`;

const Wrap = styled(FlexWrap)<WrapProps>`
    width: ${props => props.wrapWidth || 'calc(100% - 60px)'};
    width: ${props => props.bgColor && 'calc(100% - 60px)'};
    max-width: ${props => !props.isFullWidth && (props.maxWidth || '895px')};
    text-align: ${props => props.isTextCentered && 'center'};
    margin: 0 auto;
    @media (max-width: 768px) {
        width: ${props => (!!props.bgColor ? 'calc(100% - 60px)' : '100%')};
    }
`;

export const WrapGrid = styled(Wrap)<WrapProps>`
    display: flex;
    flex-wrap: ${props => props.isWrapped && `wrap`};
    justify-content: ${props => (props.isCentered ? `center` : 'space-between')};

    @media (max-width: 768px) {
        width: 100%;
    }
`;

Section.defaultProps = {
    isPadded: true,
};

FlexWrap.defaultProps = {
    isFlex: true,
};

WrapGrid.defaultProps = {
    isCentered: true,
    isFullWidth: true,
};

Wrap.defaultProps = {
    isFlex: false,
};
