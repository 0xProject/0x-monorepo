import * as _ from 'lodash';
import * as React from 'react';

import { colors } from '../utils/colors';

export interface MarkdownParagraphBlockProps {}

export const MarkdownParagraphBlock: React.StatelessComponent<MarkdownParagraphBlockProps> = ({ children }) => {
    return <span style={{ color: colors.greyTheme, lineHeight: '26px' }}>{children}</span>;
};
