import * as React from 'react';
import { Link } from 'react-router-dom';
import { WebsitePaths } from 'ts/types';

export interface DocsLogoProps {
    height: number;
    containerStyle?: React.CSSProperties;
}

export const DocsLogo: React.StatelessComponent<DocsLogoProps> = props => {
    return (
        <div style={props.containerStyle}>
            <Link to={`${WebsitePaths.Home}`} className="text-decoration-none">
                <img src="/images/docs_logo.svg" height={props.height} />
            </Link>
        </div>
    );
};

DocsLogo.defaultProps = {
    containerStyle: {},
};
