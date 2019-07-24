import React from 'react';

import { Link } from '@0x/react-shared';

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
