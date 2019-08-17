import * as _ from 'lodash';
import * as React from 'react';

import { constants } from 'ts/utils/constants';
import { utils } from 'ts/utils/utils';

export interface MarkdownLinkBlockProps {
    href: string;
}

export interface MarkdownLinkBlockState {}

export class MarkdownLinkBlock extends React.Component<MarkdownLinkBlockProps, MarkdownLinkBlockState> {
    // Re-rendering a linkBlock causes it to remain unclickable.
    // We therefore noop re-renders on this component if it's props haven't changed.
    public shouldComponentUpdate(nextProps: MarkdownLinkBlockProps, _nextState: MarkdownLinkBlockState): boolean {
        return nextProps.href !== this.props.href;
    }
    public render(): React.ReactNode {
        const href = this.props.href;
        const isLinkToSection = _.startsWith(href, '#');
        // If protocol is http or https, we can open in a new tab, otherwise don't for security reasons
        if (_.startsWith(href, 'http') || _.startsWith(href, 'https')) {
            return (
                <a href={href} target="_blank" rel="nofollow noreferrer noopener">
                    {this.props.children}
                </a>
            );
        } else if (isLinkToSection) {
            return (
                <a
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={this._onHashUrlClick.bind(this, href)}
                >
                    {this.props.children}
                </a>
            );
        } else {
            return <a href={href}>{this.props.children}</a>;
        }
    }
    private _onHashUrlClick(href: string): void {
        const hash = href.split('#')[1];
        utils.scrollToHash(hash, constants.SCROLL_CONTAINER_ID);
        utils.setUrlHash(hash);
    }
}
