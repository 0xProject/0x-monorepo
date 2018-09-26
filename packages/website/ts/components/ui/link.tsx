import * as React from 'react';
import { Link as ReactRounterLink } from 'react-router-dom';

export interface LinkProps {
    to: string;
    isExternal?: boolean;
    shouldOpenInNewTab?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

export const Link: React.StatelessComponent<LinkProps> = ({
    style,
    className,
    isExternal,
    to,
    shouldOpenInNewTab,
    children,
}) => {
    if (isExternal) {
        return (
            <a target={shouldOpenInNewTab && '_blank'} className={className} style={style} href={to}>
                {children}
            </a>
        );
    } else {
        return (
            <ReactRounterLink to={to} className={className} style={style}>
                {children}
            </ReactRounterLink>
        );
    }
};

Link.defaultProps = {
    isExternal: false,
    shouldOpenInNewTab: false,
    style: {},
    className: '',
};

Link.displayName = 'Link';
