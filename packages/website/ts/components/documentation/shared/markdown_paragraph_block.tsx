import * as _ from 'lodash';
import * as React from 'react';

import { colors } from 'ts/utils/colors';

export interface MarkdownParagraphBlockProps {}

export const MarkdownParagraphBlock: React.StatelessComponent<MarkdownParagraphBlockProps> = ({ children }) => {
    return (
        <span style={{ color: colors.greyTheme, lineHeight: '26px', display: 'block', paddingBottom: 15 }}>
            {children}
        </span>
    );
};
