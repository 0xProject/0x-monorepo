import * as React from 'react';

import { Link } from 'ts/components/documentation/shared/link';
import { docs } from 'ts/style/docs';

interface IInlineLinkProps {
    children: React.ReactNode;
    href: string;
}

export const InlineLink: React.FC<IInlineLinkProps> = ({ children, href }) => {
    const to = href.replace(/#/, ''); // Remove hash from internal links so that react-scroll can find the target

    return (
        <Link containerId="" offset={-docs.headerOffset} shouldOpenInNewTab={true} to={to} textDecoration="underline">
            {children}
        </Link>
    );
};
