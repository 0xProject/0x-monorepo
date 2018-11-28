import * as React from 'react';
import styled from 'styled-components';

interface WrapWidths {
  default: string,
  full: string,
  medium: string,
  narrow: string,
  [key: string]: string,
}

interface ColumnWidths {
  [key: string]: string,
}

interface SectionProps {
  noPadding?: any,
  bgColor?: string,
}

interface WrapProps {
  width?: 'default' | 'full' | 'medium' | 'narrow',
  bgColor?: string,
}

interface ColumnProps {
  colWidth?: '1/4' | '1/3' | '1/2' | '2/3',
}

const GUTTER = 30 as number;
const WRAPPER_WIDTHS: WrapWidths = {
  default: '1500px', // dunno
  full: '100%',
  medium: '1136px',
  narrow: '930px',
};
const COLUMN_WIDTHS: ColumnWidths = {
  '1/4': `calc(${(1 / 4) * 100}% - ${(GUTTER * 3) / 4}px)`,
  '1/3': `calc(${(1 / 3) * 100}% - ${(GUTTER * 2) / 3}px)`,
  '1/2': `calc(${(1 / 2) * 100}% - ${GUTTER / 2}px)`,
  '2/3': `calc(${(2 / 3) * 100}% - ${GUTTER / 2}px)`,
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
