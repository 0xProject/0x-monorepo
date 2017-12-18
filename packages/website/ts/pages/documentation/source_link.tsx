import * as _ from 'lodash';
import {colors} from 'ts/utils/colors';
import * as React from 'react';
import {Source} from 'ts/types';

interface SourceLinkProps {
    source: Source;
    baseUrl: string;
    version: string;
    subPackageName: string;
}

const packagesWithNamespace = [
    'connect',
];

export function SourceLink(props: SourceLinkProps) {
    const src = props.source;
    const url = props.baseUrl;
    const pkg = props.subPackageName;
    let tagPrefix = pkg;
    if (_.includes(packagesWithNamespace, pkg)) {
        tagPrefix = `@0xproject/${pkg}`;
    }
    const sourceCodeUrl = `${url}/blob/${tagPrefix}%40${props.version}/packages/${pkg}/${src.fileName}#L${src.line}`;
    return (
        <div className="pt2" style={{fontSize: 14}}>
            <a
                href={sourceCodeUrl}
                target="_blank"
                className="underline"
                style={{color: colors.grey}}
            >
                Source
            </a>
        </div>
    );
}
