import * as React from 'react';
import {colors} from 'material-ui/styles';
import {Source} from 'ts/types';
import {constants} from 'ts/utils/constants';

interface SourceLinkProps {
    source: Source;
    version: string;
}

const SUB_PKG = '0x.js';

export function SourceLink(props: SourceLinkProps) {
    const src = props.source;
    const url = constants.GITHUB_0X_JS_URL;
    // https://github.com/0xProject/0x.js/blob/0x.js%400.26.1/packages/0x.js/src/contract_wrappers/exchange_wrapper.ts
    const sourceCodeUrl = `${url}/blob/${SUB_PKG}%40${props.version}/packages/${SUB_PKG}/${src.fileName}#L${src.line}`;
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
