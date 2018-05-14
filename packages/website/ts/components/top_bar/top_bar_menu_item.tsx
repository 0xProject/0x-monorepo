import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';

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
        const primaryStyles = this.props.isPrimary
            ? {
                  borderRadius: 4,
                  border: `1px solid ${this.props.isNightVersion ? colors.grey : colors.greyishPink}`,
                  marginTop: 15,
                  paddingLeft: 9,
                  paddingRight: 9,
                  minWidth: 77,
              }
            : {};
        const menuItemColor = this.props.isNightVersion ? 'white' : this.props.style.color;
        const linkColor = _.isUndefined(menuItemColor) ? colors.darkestGrey : menuItemColor;
        return (
            <div
                className={`center ${this.props.className}`}
                style={{ ...this.props.style, ...primaryStyles, color: menuItemColor }}
            >
                {this.props.isExternal ? (
                    <a
                        className="text-decoration-none"
                        style={{ color: linkColor }}
                        target="_blank"
                        href={this.props.path}
                    >
                        {this.props.title}
                    </a>
                ) : (
                    <Link to={this.props.path} className="text-decoration-none" style={{ color: linkColor }}>
                        {this.props.title}
                    </Link>
                )}
            </div>
        );
    }
}
