import { colors, Link } from '@0x/react-shared';
import { Source } from '@0x/types';
import * as React from 'react';

export interface SourceLinkProps {
    source: Source;
    sourceUrl: string;
    version: string;
}

export const SourceLink = (props: SourceLinkProps) => {
    const src = props.source;
    const sourceCodeUrl = `${props.sourceUrl}/${src.fileName}#L${src.line}`;
    return (
        <div className="pt2" style={{ fontSize: 14 }}>
            <Link to={sourceCodeUrl} shouldOpenInNewTab={true} textDecoration="underline" fontColor={colors.grey}>
                {'Source'}
            </Link>
        </div>
    );
};
