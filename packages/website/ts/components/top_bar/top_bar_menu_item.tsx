import { colors, Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { CallToAction } from 'ts/components/ui/button';

const DEFAULT_STYLE = {
    color: colors.darkestGrey,
};

interface TopBarMenuItemProps {
    title: string;
    path?: string;
    isPrimary?: boolean;
    shouldOpenInNewTab?: boolean;
    style?: React.CSSProperties;
    className?: string;
    isNightVersion?: boolean;
}

interface TopBarMenuItemState {}

export class TopBarMenuItem extends React.Component<TopBarMenuItemProps, TopBarMenuItemState> {
    public static defaultProps: Partial<TopBarMenuItemProps> = {
        isPrimary: false,
        style: DEFAULT_STYLE,
        className: '',
        shouldOpenInNewTab: false,
        isNightVersion: false,
    };
    public render(): React.ReactNode {
        const menuItemColor = this.props.isNightVersion ? 'white' : this.props.style.color;
        const linkColor = _.isUndefined(menuItemColor) ? colors.darkestGrey : menuItemColor;
        const itemContent = this.props.isPrimary ? (
            <CallToAction padding="0.8em 1.5em">{this.props.title}</CallToAction>
        ) : (
            this.props.title
        );
        return (
            <div className={`center ${this.props.className}`} style={{ ...this.props.style, color: menuItemColor }}>
                <Link to={this.props.path} shouldOpenInNewTab={this.props.shouldOpenInNewTab} fontColor={linkColor}>
                    {itemContent}
                </Link>
            </div>
        );
    }
}
