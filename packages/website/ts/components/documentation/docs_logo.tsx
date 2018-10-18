import { Link } from '@0x/react-shared';
import * as React from 'react';
import { WebsitePaths } from 'ts/types';

export interface DocsLogoProps {
    height: number;
    containerStyle?: React.CSSProperties;
}

export const DocsLogo: React.StatelessComponent<DocsLogoProps> = props => {
    return (
        <Link to={WebsitePaths.Docs}>
            <img src="/images/docs_logo.svg" height={props.height} />
        </Link>
    );
};

DocsLogo.defaultProps = {
    containerStyle: {},
};
