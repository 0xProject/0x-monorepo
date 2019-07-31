import * as React from 'react';

import { Link } from 'ts/components/documentation/shared/link';


interface IInlineLinkProps {
    children: React.ReactNode;
    href: string;
}

export const InlineLink: React.FC<IInlineLinkProps> = ({ children, href }) => {
    return (
        <Link to={href} textDecoration="underline">
            {children}
        </Link>
    );
};
