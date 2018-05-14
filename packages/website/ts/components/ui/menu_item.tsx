import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';

interface MenuItemProps {
    to: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    className?: string;
}

interface MenuItemState {
    isHovering: boolean;
}

export class MenuItem extends React.Component<MenuItemProps, MenuItemState> {
    public static defaultProps: Partial<MenuItemProps> = {
        onClick: _.noop,
        className: '',
    };
    public constructor(props: MenuItemProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render(): React.ReactNode {
        const menuItemStyles = {
            cursor: 'pointer',
            opacity: this.state.isHovering ? 0.5 : 1,
        };
        return (
            <Link to={this.props.to} style={{ textDecoration: 'none', ...this.props.style }}>
                <div
                    onClick={this.props.onClick.bind(this)}
                    className={`mx-auto ${this.props.className}`}
                    style={menuItemStyles}
                    onMouseEnter={this._onToggleHover.bind(this, true)}
                    onMouseLeave={this._onToggleHover.bind(this, false)}
                >
                    {this.props.children}
                </div>
            </Link>
        );
    }
    private _onToggleHover(isHovering: boolean): void {
        this.setState({
            isHovering,
        });
    }
}
