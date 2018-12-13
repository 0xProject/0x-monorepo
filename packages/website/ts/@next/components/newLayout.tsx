import * as React from 'react';
import styled from 'styled-components';

interface WrapProps {
    offsetTop?: string;
    maxWidth?: string;
    wrapWidth?: string;
    isFullWidth?: boolean;
    isTextCentered?: boolean;
    isCentered?: boolean;
    isWrapped?: boolean;
}

interface WrapGridProps {
    isWrapped?: boolean;
    isCentered?: boolean;
}

export interface WrapStickyProps {
    offsetTop?: string;
}

interface SectionProps extends WrapProps {
    isPadded?: boolean;
    isFullWidth?: boolean;
    isFlex?: boolean;
    paddingMobile?: string;
    flexBreakpoint?: string;
    maxWidth?: string;
    bgColor?: 'dark' | 'light' | string;
}

interface FlexProps {
    padding?: string;
    isFlex?: boolean;
    flexBreakpoint?: string;
}

interface ColumnProps {
    padding?: string;
    width?: string;
    maxWidth?: string;
}

export const Section = (props: SectionProps) => {
    return (
        <SectionBase {...props}>
            <Wrap {...props}>
                {props.children}
            </Wrap>
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
    padding: ${props => props.padding};

    @media (min-width: ${props => props.flexBreakpoint || '768px'}) {
        display: ${props => props.isFlex && 'flex'};
        justify-content: ${props => props.isFlex && 'space-between'};
    }
`;

export const WrapSticky = styled.div<WrapProps>`
    position: sticky;
    top: ${props => props.offsetTop || '60px'};
`;

const SectionBase = styled.section<SectionProps>`
    width: ${props => !props.isFullWidth && 'calc(100% - 60px)'};
    max-width: 1500px;
    margin: 0 auto;
    padding: ${props => props.isPadded && '120px 0'};
    background-color: ${props => props.theme[`${props.bgColor}BgColor`] || props.bgColor};
    position: relative;
    overflow: ${props => !props.isFullWidth && 'hidden'};

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
`;

export const WrapGrid = styled(Wrap)<WrapProps>`
    display: flex;
    flex-wrap: ${props => props.isWrapped && `wrap`};
    justify-content: ${props => props.isCentered ? `center` : 'space-between'};

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
