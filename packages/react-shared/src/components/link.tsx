import * as _ from 'lodash';
import * as React from 'react';
import { Link as ReactRounterLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';

import { LinkType } from '../types';
import { constants } from '../utils/constants';

export interface LinkProps {
    to: string;
    type?: LinkType;
    shouldOpenInNewTab?: boolean;
    style?: React.CSSProperties;
    className?: string;
    onMouseOver?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    containerId?: string;
}

/**
 * A generic link component which let's the developer render internal, external and scroll-to-hash links, and
 * their associated behaviors with a single link component. Many times we want a menu including a combination of
 * internal, external and scroll links and the abstraction of the differences of rendering each types of link
 * makes it much easier to do so.
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
    containerId,
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
            return (
                <ScrollLink
                    to={to}
                    offset={0}
                    hashSpy={true}
                    duration={constants.DOCS_SCROLL_DURATION_MS}
                    containerId={containerId}
                >
                    {children}
                </ScrollLink>
            );
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
    containerId: constants.DOCS_CONTAINER_ID,
};

Link.displayName = 'Link';
