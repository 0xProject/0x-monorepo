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
  bgColor?: string;
}

interface WrapProps {
  width?: 'default' | 'full' | 'medium' | 'narrow';
  bgColor?: string;
}

interface ColumnProps {
  colWidth?: '1/4' | '1/3' | '1/2' | '2/3';
}

interface GetColWidthArgs {
  span?: number,
  columns: number,
}


const _getColumnWidth = (args: GetColWidthArgs) => {
  const { span = 1, columns } = args;
  const percentWidth = (span / columns) * 100;
  const gutterDiff = (GUTTER * (columns - 1)) / columns;
  return `calc(${percentWidth}% - ${gutterDiff}px)`;
};

const GUTTER = 30 as number;
const WRAPPER_WIDTHS: WrapWidths = {
  default: '1500px', // tbd
  full: '100%',
  medium: '1136px',
  narrow: '930px',
};
const COLUMN_WIDTHS: ColumnWidths = {
  '1/4': _getColumnWidth({ columns: 4 }),
  '1/3': _getColumnWidth({ columns: 3 }),
  '1/2': _getColumnWidth({ columns: 2 }),
  '2/3': _getColumnWidth({ span: 2, columns: 4 }),
};


export const Section = styled.section<SectionProps>`
  width: 100%;
  padding: ${props => !props.noPadding && '30px'};
  margin-bottom: 30px;
  background-color: ${props => props.bgColor};
  border: 1px solid blue;
`;

export const Wrap = styled.div<WrapProps>`
  max-width: ${props => WRAPPER_WIDTHS[props.width || 'default']};
  background-color: ${props => props.bgColor};
  margin: 0 auto;
  border: 1px solid green;
  display: flex;
  justify-content: space-between;
`;

export const Column = styled.div<ColumnProps>`
  width: ${props => props.colWidth ? COLUMN_WIDTHS[props.colWidth] : '100%'};
  padding: 30px;
  border: 1px solid yellow;
`;
