import * as _ from 'lodash';
import * as React from 'react';
import { Link as ReactRounterLink } from 'react-router-dom';
import { LinkType } from 'ts/types';

export interface LinkProps {
    to: string;
    type?: LinkType;
    shouldOpenInNewTab?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onMouseOver?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
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
    onMouseOver,
    onMouseLeave,
    onMouseEnter,
}) => {
    const styleWithDefault = {
        textDecoration: 'none',
        ...style,
    };

    switch (type) {
        case LinkType.External:
            return (
                <a
                    target={shouldOpenInNewTab ? '_blank' : ''}
                    className={className}
                    style={styleWithDefault}
                    href={to}
                    onMouseOver={onMouseOver}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    {children}
                </a>
            );
        case LinkType.ReactRoute:
            if (to === '/') {
                console.log('got here!');
            }
            return (
                <ReactRounterLink
                    to={to}
                    className={className}
                    style={styleWithDefault}
                    target={shouldOpenInNewTab ? '_blank' : ''}
                    onMouseOver={onMouseOver}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
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
    shouldOpenInNewTab: false,
    style: {},
    className: '',
    onMouseOver: _.noop.bind(_),
    onMouseLeave: _.noop.bind(_),
    onMouseEnter: _.noop.bind(_),
};

Link.displayName = 'Link';
