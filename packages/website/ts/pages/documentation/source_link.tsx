import * as React from 'react';
import {colors} from 'material-ui/styles';
import {Source} from 'ts/types';
import {constants} from 'ts/utils/constants';

interface SourceLinkProps {
    source: Source;
    version: string;
}

export function SourceLink(props: SourceLinkProps) {
    const source = props.source;
    const githubUrl = constants.GITHUB_0X_JS_URL;
    const sourceCodeUrl = `${githubUrl}/blob/v${props.version}/${source.fileName}#L${source.line}`;
    return (
        <div className="pt2" style={{fontSize: 14}}>
            <a
                href={sourceCodeUrl}
                target="_blank"
                className="underline"
                style={{color: colors.grey500}}
            >
                Source
            </a>
        </div>
    );
}
