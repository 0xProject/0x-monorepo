import styled from 'styled-components';
import {getCSSPadding, PADDING_SIZES, PaddingInterface} from 'ts/@next/constants/utilities';

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
    isNoPadding?: boolean;
    isPadLarge?: boolean;
    isNoMargin?: boolean;
    bgColor?: string;
    isFullWidth?: boolean;
    isRelative?: boolean;
}

interface WrapProps extends PaddingInterface {
    width?: 'default' | 'full' | 'medium' | 'narrow';
    bgColor?: string;
    isWrapped?: boolean;
    isCentered?: boolean;
    isReversed?: boolean;
}

interface ColumnProps {
    colWidth?: '1/4' | '1/3' | '1/2' | '2/3';
    isNoPadding?: boolean;
    isPadLarge?: boolean;
    bgColor?: string;
}

interface GetColWidthArgs {
    span?: number;
    columns: number;
}

const _getColumnWidth = (args: GetColWidthArgs): string => {
    const { span = 1, columns } = args;
    const percentWidth = (span / columns) * 100;
    const gutterDiff = (GUTTER * (columns - 1)) / columns;
    return `calc(${percentWidth}% - ${gutterDiff}px)`;
};

const GUTTER = 30 as number;
const MAX_WIDTH = 1500;
export const BREAKPOINTS = {
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
    width: calc(100% - 0);
    max-width: ${MAX_WIDTH}px;
    margin: 0 auto;

    @media (min-width: ${BREAKPOINTS.mobile}) {
        width: calc(100% - 60px);
    }
`;

// We can also turn Section into a stateless comp,
// passing a asElement (same patter nas Heading) so we dont have to
// make a const on every route to withComponent-size it.
// just <Section asElement?="div/section/footer/header/whatever" /> ?
export const Section = styled.section<SectionProps>`
    width: ${props => props.isFullWidth ? `calc(100% + ${GUTTER * 2}px)` : '100%'};
    padding: ${props => !props.isNoPadding && (props.isPadLarge ? `${PADDING_SIZES.large} ${PADDING_SIZES.default}` : PADDING_SIZES.default)};
    background-color: ${props => props.bgColor};
    position: ${props => props.isRelative && 'relative'};
    overflow: ${props => props.isRelative && 'hidden'};

    @media (min-width: 1560px) {
        width: ${props => props.isFullWidth && '100vw'};
        margin-bottom: ${props => !props.isNoMargin && `${GUTTER}px`};
        margin-left: ${props => props.isFullWidth && `calc(750px - 50vw)`};
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
        margin-bottom: ${props => !props.isNoMargin && `${GUTTER / 2}px`};
    }
`;

const WrapBase = styled.div<WrapProps>`
    max-width: ${props => WRAPPER_WIDTHS[props.width || 'default']};
    padding: ${props => props.padding && getCSSPadding(props.padding)};
    background-color: ${props => props.bgColor};
    margin: 0 auto;
`;

export const Wrap = styled(WrapBase)`
    @media (min-width: ${BREAKPOINTS.mobile}) {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        flex-direction: ${props => props.isReversed && 'row-reverse'};
    }
`;

export const WrapCentered = styled(WrapBase)`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

export const WrapGrid = styled(WrapBase)`
    display: flex;
    flex-wrap: ${props => props.isWrapped && `wrap`};
    justify-content: ${props => props.isCentered ? `center` : 'space-between'};
`;

export const Column = styled.div<ColumnProps>`
    background-color: ${props => props.bgColor};

    @media (min-width: ${BREAKPOINTS.mobile}) {
        padding: ${props => !props.isNoPadding && (props.isPadLarge ? `${PADDING_SIZES.large} ${PADDING_SIZES.default}` : PADDING_SIZES.default)};
        width: ${props => props.colWidth ? COLUMN_WIDTHS[props.colWidth] : '100%'};
    }

    @media (max-width: ${BREAKPOINTS.mobile}) {
        padding: ${props => !props.isNoPadding && (props.isPadLarge ? '40px 30px' : '15px')};
        text-align: center;
        margin-bottom: 20px;
    }
`;

WrapGrid.defaultProps = {
    isCentered: true,
};
