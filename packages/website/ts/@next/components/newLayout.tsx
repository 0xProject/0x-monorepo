import * as React from 'react';
import styled from 'styled-components';

interface WrapProps {
    isFullWidth?: boolean;
    isTextCentered?: boolean;
}

interface SectionProps {
    isPadded?: boolean;
    isFullWidth?: boolean;
    isFlex?: boolean;
    flexBreakpoint?: string;
    maxWidth?: string;
    bgColor?: 'dark' | 'light' | string;
}

interface FlexProps {
    padding?: string;
    isFlex?: boolean;
}

interface ColumnProps {
    padding?: string;
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

export const Column = styled.div`
    width: ${props => props.width};
    max-width: ${props => props.maxWidth};
    padding: ${props => props.padding};

    @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 60px;
    }
`;

export const FlexWrap = styled.div`
    padding: ${props => props.padding};

    @media (min-width: ${props => props.flexBreakpoint || '768px'}) {
        display: ${props => props.isFlex && 'flex'};
        justify-content: ${props => props.isFlex && 'space-between'};
    }
`;

export const WrapSticky = styled.div`
    position: sticky;
    top: ${props => props.offsetTop || '60px'};
`;

const SectionBase = styled.section`
    margin: 0 auto;
    padding: ${props => props.isPadded && '120px 0'};
    background-color: ${props => props.theme[`${props.bgColor}BgColor`] || props.bgColor};

    @media (max-width: 768px) {
        padding: ${props => props.isPadded && '40px 0'};
    }
`;

const Wrap = styled(FlexWrap)`
    width: ${props => !props.isFullWidth && 'calc(100% - 60px)'};
    max-width: ${props => !props.isFullWidth && (props.maxWidth || '895px')};
    margin: 0 auto;
    text-align: ${props => props.isTextCentered && 'center'};
`;

export const WrapGrid = styled(Wrap)`
    display: flex;
    flex-wrap: ${props => props.isWrapped && `wrap`};
    justify-content: ${props => props.isCentered ? `center` : 'space-between'};
`;

Section.defaultProps = {
    isPadded: true,
};

FlexWrap.defaultProps = {
    isFlex: true,
};

WrapGrid.defaultProps = {
    isCentered: true,
};

Wrap.defaultProps = {
    isFlex: false,
};
