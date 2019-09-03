import * as React from 'react';
import * as validUrl from 'valid-url';

import { Link } from 'ts/components/documentation/shared/link';
import { docs } from 'ts/style/docs';

interface IInlineLinkProps {
    children: React.ReactNode;
    href: string;
}

export const InlineLink: React.FC<IInlineLinkProps> = ({ children, href }) => {
    const to = href.replace(/^#/, ''); // Remove initial hash from internal links so that react-scroll can find the target
    const shouldOpenInNewTab = validUrl.isWebUri(href) ? true : false;

    return (
        <Link
            containerId=""
            offset={-docs.headerOffset}
            shouldOpenInNewTab={shouldOpenInNewTab}
            to={to}
            textDecoration="underline"
        >
            {children}
        </Link>
    );
};
