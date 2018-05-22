import { colors, Styles } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

export interface IconButtonProps {
    iconName: string;
    labelText?: string;
    onClick: () => void;
    color?: string;
}
interface IconButtonState {
    isHovering: boolean;
}
export class IconButton extends React.Component<IconButtonProps, IconButtonState> {
    public static defaultProps: Partial<IconButtonProps> = {
        onClick: _.noop,
        labelText: '',
        color: colors.mediumBlue,
    };
    public constructor(props: IconButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render(): React.ReactNode {
        const styles: Styles = {
            root: {
                cursor: 'pointer',
                opacity: this.state.isHovering ? 0.5 : 1,
            },
            icon: {
                color: this.props.color,
                fontSize: 20,
            },
            label: {
                color: this.props.color,
                fontSize: 10,
            },
        };
        return (
            <div
                className="flex items-center py2"
                onClick={this.props.onClick}
                onMouseEnter={this._onToggleHover.bind(this, true)}
                onMouseLeave={this._onToggleHover.bind(this, false)}
                style={styles.root}
            >
                <i style={styles.icon} className={`zmdi ${this.props.iconName}`} />
                {!_.isEmpty(this.props.labelText) && (
                    <div className="pl1" style={styles.label}>
                        {this.props.labelText}
                    </div>
                )}
            </div>
        );
    }
    private _onToggleHover(isHovering: boolean): void {
        this.setState({
            isHovering,
        });
    }
}
