import * as React from 'react';
import styled from 'styled-components';

interface WrapWidths {
    default: string;
    full: string;
    medium: string;
    narrow: string;
    [key: string]: string;
}

interface ColumnWidths {
    [key: string]: string;
}

interface SectionProps {
    noPadding?: any;
    padLarge?: any;
    noMargin?: any;
    bgColor?: string;
    fullWidth?: any;
}

interface WrapProps {
    width?: 'default' | 'full' | 'medium' | 'narrow';
    bgColor?: string;
}

interface ColumnProps {
    colWidth?: '1/4' | '1/3' | '1/2' | '2/3';
    noPadding?: any;
    padLarge?: any;
    bgColor?: string;
}

interface GetColWidthArgs {
    span?: number;
    columns: number;
}


const _getColumnWidth = (args: GetColWidthArgs) => {
    const { span = 1, columns } = args;
    const percentWidth = (span / columns) * 100;
    const gutterDiff = (GUTTER * (columns - 1)) / columns;
    return `calc(${percentWidth}% - ${gutterDiff}px)`;
};

const GUTTER = 30 as number;
const MAX_WIDTH = 1500;
const BREAKPOINTS = {
    mobile: '768px',
};
const WRAPPER_WIDTHS: WrapWidths = {
    default: `${MAX_WIDTH}px`, // tbd
    full: '100%',
    medium: '1136px',
    narrow: '930px',
};
const COLUMN_WIDTHS: ColumnWidths = {
    '1/4': _getColumnWidth({ columns: 4 }),
    '1/3': _getColumnWidth({ columns: 3 }),
    '1/2': _getColumnWidth({ columns: 2 }),
    '2/3': _getColumnWidth({ span: 2, columns: 3 }),
};


export const Main = styled.main`
    border: 1px dotted rgba(0, 0, 255, 0.3);
    width: calc(100% - 60px);
    max-width: ${MAX_WIDTH}px;
    margin: 0 auto;
`;

export const Section = styled.section<SectionProps>`
    width: ${props => props.fullWidth ? `calc(100% + ${GUTTER * 2}px)` : '100%'};
    padding: ${props => !props.noPadding && (props.padLarge ? '60px 30px' : '30px')};
    margin-bottom: ${props => !props.noMargin && `${GUTTER}px`};
    margin-left: ${props => props.fullWidth && `-${GUTTER}px`};
    background-color: ${props => props.bgColor};
    border: 1px dotted rgba(0, 255, 0, 0.3);

    @media (min-width: 1560px) {
        width: ${props => props.fullWidth && '100vw'};
        margin-left: ${props => props.fullWidth && `calc(750px - 50vw)`};
    }
`;

const WrapBase = styled.div<WrapProps>`
    max-width: ${props => WRAPPER_WIDTHS[props.width || 'default']};
    background-color: ${props => props.bgColor};
    margin: 0 auto;
`;

export const Wrap = styled(WrapBase)`
    @media (min-width: ${BREAKPOINTS.mobile}) {
        display: flex;
        justify-content: space-between;
    }
`;

export const WrapCentered = styled(WrapBase)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

export const Column = styled.div<ColumnProps>`
    padding: ${props => !props.noPadding && (props.padLarge ? '60px 30px' : '30px')};
    border: 1px dotted rgba(255, 0, 0, 0.3);
    background-color: ${props => props.bgColor};

    @media (min-width: ${BREAKPOINTS.mobile}) {
        width: ${props => props.colWidth ? COLUMN_WIDTHS[props.colWidth] : '100%'};
    }
`;
