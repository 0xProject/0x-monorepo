import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { Source } from '../types';

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
            <a href={sourceCodeUrl} target="_blank" className="underline" style={{ color: colors.grey }}>
                Source
            </a>
        </div>
    );
};
