import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { CallToAction } from 'ts/components/ui/button';

const DEFAULT_STYLE = {
    color: colors.darkestGrey,
};

interface TopBarMenuItemProps {
    title: string;
    path?: string;
    isPrimary?: boolean;
    isExternal: boolean;
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
                {this.props.isExternal ? (
                    <a
                        className="text-decoration-none"
                        style={{ color: linkColor }}
                        target="_blank"
                        href={this.props.path}
                    >
                        {itemContent}
                    </a>
                ) : (
                    <Link to={this.props.path} className="text-decoration-none" style={{ color: linkColor }}>
                        {itemContent}
                    </Link>
                )}
            </div>
        );
    }
}
