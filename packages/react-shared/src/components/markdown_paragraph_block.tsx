import * as _ from 'lodash';
import * as React from 'react';

import { colors } from '../utils/colors';

export interface MarkdownParagraphBlockProps {}

export interface MarkdownParagraphBlockState {}

export class MarkdownParagraphBlock extends React.Component<MarkdownParagraphBlockProps, MarkdownParagraphBlockState> {
    public render(): React.ReactNode {
        return <span style={{ color: colors.greyTheme, lineHeight: '26px' }}>{this.props.children}</span>;
    }
}
