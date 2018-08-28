import * as React from 'react';
import { Link } from 'react-router-dom';
import { WebsitePaths } from 'ts/types';

export const DocsLogo = () => {
    return (
        <div style={{ paddingTop: 28 }}>
            <Link to={`${WebsitePaths.Home}`} className="text-decoration-none">
                <img src="/images/docs_logo.svg" height="30px" />
            </Link>
        </div>
    );
};
