import * as _ from 'lodash';
import * as React from 'react';
import {Link} from 'react-router-dom';

const CUSTOM_DARK_GRAY = '#231F20';
const DEFAULT_STYLE = {
    color: CUSTOM_DARK_GRAY,
};

interface TopBarMenuItemProps {
    title: string;
    path?: string;
    isPrimary?: boolean;
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
    public render() {
        const primaryStyles = this.props.isPrimary ? {
            borderRadius: 4,
            border: `1px solid ${this.props.isNightVersion ? '#979797' : 'rgb(230, 229, 229)'}`,
            marginTop: 15,
            paddingLeft: 9,
            paddingRight: 9,
            width: 77,
        } : {};
        const menuItemColor = this.props.isNightVersion ? 'white' : this.props.style.color;
        const linkColor = _.isUndefined(menuItemColor) ?
            CUSTOM_DARK_GRAY :
            menuItemColor;
        return (
            <div
                className={`center ${this.props.className}`}
                style={{...this.props.style, ...primaryStyles, color: menuItemColor}}
            >
                <Link to={this.props.path} className="text-decoration-none" style={{color: linkColor}}>
                    {this.props.title}
                </Link>
            </div>
        );
    }
}
