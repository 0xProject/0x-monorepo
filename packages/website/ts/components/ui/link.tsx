import * as React from 'react';
import { Link as ReactRounterLink } from 'react-router-dom';
import { LinkType } from 'ts/types';

export interface LinkProps {
    to: string;
    type?: LinkType;
    shouldOpenInNewTab?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

/**
 * A generic link component which let's the developer render internal & external links, and their associated
 * behaviors with a single link component. Many times we want a menu including both internal & external links
 * and this abstracts away the differences of rendering both types of links.
 */
export const Link: React.StatelessComponent<LinkProps> = ({
    style,
    className,
    type,
    to,
    shouldOpenInNewTab,
    children,
}) => {
    const styleWithDefault = {
        textDecoration: 'none',
        ...style,
    };

    switch (type) {
        case LinkType.External:
            return (
                <a target={shouldOpenInNewTab && '_blank'} className={className} style={styleWithDefault} href={to}>
                    {children}
                </a>
            );
        case LinkType.ReactRoute:
            return (
                <ReactRounterLink to={to} className={className} style={styleWithDefault}>
                    {children}
                </ReactRounterLink>
            );
        case LinkType.ReactScroll:
            return <div>TODO</div>;
        default:
            throw new Error(`Unrecognized LinkType: ${type}`);
    }
};

Link.defaultProps = {
    type: LinkType.ReactRoute,
    shouldOpenInNewTab: true,
    style: {},
    className: '',
};

Link.displayName = 'Link';
