import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'ts/components/documentation/shared/link';

interface CustomMenuItemProps {
    to: string;
    onClick?: () => void;
    className?: string;
}

interface CustomMenuItemState {
    isHovering: boolean;
}

export class CustomMenuItem extends React.Component<CustomMenuItemProps, CustomMenuItemState> {
    public static defaultProps: Partial<CustomMenuItemProps> = {
        onClick: _.noop.bind(_),
        className: '',
    };
    public constructor(props: CustomMenuItemProps) {
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
            <Link to={this.props.to}>
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
