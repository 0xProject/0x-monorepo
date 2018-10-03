import { Link } from '@0xproject/react-shared';
import * as React from 'react';
import { WebsitePaths } from 'ts/types';

export interface DocsLogoProps {
    height: number;
    containerStyle?: React.CSSProperties;
}

export const DocsLogo: React.StatelessComponent<DocsLogoProps> = props => {
    return (
        <div style={props.containerStyle}>
            <Link to={WebsitePaths.Docs}>
                <img src="/images/docs_logo.svg" height={props.height} />
            </Link>
        </div>
    );
};

DocsLogo.defaultProps = {
    containerStyle: {},
};
