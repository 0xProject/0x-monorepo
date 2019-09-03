import * as _ from 'lodash';
import * as React from 'react';
import { NavLink as ReactRounterLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import * as validUrl from 'valid-url';

import { LinkType } from 'ts/types';
import { constants } from 'ts/utils/constants';

export interface BaseLinkProps {
    to: string;
    shouldOpenInNewTab?: boolean;
    className?: string;
    onMouseOver?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    textDecoration?: string;
    fontColor?: string;
}

export interface ScrollLinkProps extends BaseLinkProps {
    activeClass?: string;
    containerId?: string;
    duration?: number;
    offset?: number;
    onActivityChanged?: (isActive: boolean) => void;
}

export interface ReactLinkProps extends BaseLinkProps {
    activeStyle?: React.CSSProperties;
}

export type LinkProps = ReactLinkProps & ScrollLinkProps;

export interface LinkState {}

/**
 * A generic link component which let's the developer render internal, external and scroll-to-hash links, and
 * their associated behaviors with a single link component. Many times we want a menu including a combination of
 * internal, external and scroll links and the abstraction of the differences of rendering each types of link
 * makes it much easier to do so.
 */
export class Link extends React.Component<LinkProps, LinkState> {
    public static defaultProps: Partial<LinkProps> = {
        activeClass: 'active',
        className: '',
        containerId: constants.SCROLL_CONTAINER_ID,
        duration: constants.DOCS_SCROLL_DURATION_MS,
        fontColor: 'inherit',
        offset: 0,
        onMouseEnter: _.noop.bind(_),
        onMouseLeave: _.noop.bind(_),
        onMouseOver: _.noop.bind(_),
        shouldOpenInNewTab: false,
        textDecoration: 'none',
    };
    private _outerReactScrollSpan: HTMLSpanElement | null;
    constructor(props: LinkProps) {
        super(props);
        this._outerReactScrollSpan = null;
    }
    public render(): React.ReactNode {
        let type: LinkType;
        const isReactRoute = _.startsWith(this.props.to, '/');
        const isExternal = validUrl.isWebUri(this.props.to) || _.startsWith(this.props.to, 'mailto:');
        if (isReactRoute) {
            type = LinkType.ReactRoute;
        } else if (isExternal) {
            type = LinkType.External;
        } else {
            type = LinkType.ReactScroll;
        }

        const styleWithDefault = {
            textDecoration: this.props.textDecoration,
            cursor: 'pointer',
            color: this.props.fontColor,
        };

        switch (type) {
            case LinkType.External:
                return (
                    <a
                        target={this.props.shouldOpenInNewTab ? '_blank' : ''}
                        className={this.props.className}
                        style={styleWithDefault}
                        href={this.props.to}
                        onMouseOver={this.props.onMouseOver}
                        onMouseEnter={this.props.onMouseEnter}
                        onMouseLeave={this.props.onMouseLeave}
                    >
                        {this.props.children}
                    </a>
                );
            case LinkType.ReactRoute:
                return (
                    <ReactRounterLink
                        to={this.props.to}
                        className={this.props.className}
                        style={styleWithDefault}
                        target={this.props.shouldOpenInNewTab ? '_blank' : ''}
                        onMouseOver={this.props.onMouseOver}
                        onMouseEnter={this.props.onMouseEnter}
                        onMouseLeave={this.props.onMouseLeave}
                        activeStyle={this.props.activeStyle}
                    >
                        {this.props.children}
                    </ReactRounterLink>
                );
            case LinkType.ReactScroll:
                return (
                    <span
                        ref={input => (this._outerReactScrollSpan = input)}
                        onMouseOver={this.props.onMouseOver}
                        onMouseEnter={this.props.onMouseEnter}
                        onMouseLeave={this.props.onMouseLeave}
                    >
                        <ScrollLink
                            activeClass={this.props.activeClass}
                            to={this.props.to}
                            offset={this.props.offset}
                            spy={true}
                            hashSpy={true}
                            duration={this.props.duration}
                            smooth={this.props.duration > 0}
                            containerId={this.props.containerId}
                            className={this.props.className}
                            style={styleWithDefault}
                            onSetActive={this._onActivityChanged.bind(this, true)}
                            onSetInactive={this._onActivityChanged.bind(this, false)}
                        >
                            <span onClick={this._onClickPropagateClickEventAroundScrollLink.bind(this)}>
                                {this.props.children}
                            </span>
                        </ScrollLink>
                    </span>
                );
            default:
                throw new Error(`Unrecognized LinkType: ${type}`);
        }
    }
    private _onActivityChanged(isActive: boolean): void {
        if (this.props.onActivityChanged) {
            this.props.onActivityChanged(isActive);
        }
    }
    // HACK(fabio): For some reason, the react-scroll link decided to stop the propagation of click events.
    // We do however rely on these events being propagated in certain scenarios (e.g when the link
    // is within a dropdown we want to close upon being clicked). Because of this, we register the
    // click event of an inner span, and pass it around the react-scroll link to an outer span.
    private _onClickPropagateClickEventAroundScrollLink(): void {
        if (this._outerReactScrollSpan !== null) {
            this._outerReactScrollSpan.click();
        }
    }
}
