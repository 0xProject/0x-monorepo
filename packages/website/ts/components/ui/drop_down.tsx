import * as _ from 'lodash';
import Popover from 'material-ui/Popover';
import * as React from 'react';
import { MaterialUIPosition } from 'ts/types';

const CHECK_CLOSE_POPOVER_INTERVAL_MS = 300;
const DEFAULT_STYLE = {
    fontSize: 14,
};

export enum DropdownMouseEvent {
    Hover = 'hover',
    Click = 'click',
}

export interface DropDownProps {
    activeNode: React.ReactNode;
    popoverContent: React.ReactNode;
    anchorOrigin: MaterialUIPosition;
    targetOrigin: MaterialUIPosition;
    style?: React.CSSProperties;
    zDepth?: number;
    activateEvent?: DropdownMouseEvent;
    closeEvent?: DropdownMouseEvent;
    popoverStyle?: React.CSSProperties;
}

interface DropDownState {
    isDropDownOpen: boolean;
    anchorEl?: HTMLInputElement;
}

export class DropDown extends React.Component<DropDownProps, DropDownState> {
    public static defaultProps: Partial<DropDownProps> = {
        style: DEFAULT_STYLE,
        zDepth: 1,
        activateEvent: DropdownMouseEvent.Hover,
        closeEvent: DropdownMouseEvent.Hover,
        popoverStyle: {},
    };
    private _isHovering: boolean;
    private _popoverCloseCheckIntervalId: number;
    constructor(props: DropDownProps) {
        super(props);
        this.state = {
            isDropDownOpen: false,
        };
    }
    public componentDidMount(): void {
        this._popoverCloseCheckIntervalId = window.setInterval(() => {
            this._checkIfShouldClosePopover();
        }, CHECK_CLOSE_POPOVER_INTERVAL_MS);
    }
    public componentWillUnmount(): void {
        window.clearInterval(this._popoverCloseCheckIntervalId);
    }
    public componentWillReceiveProps(_nextProps: DropDownProps): void {
        // HACK: If the popoverContent is updated to a different dimension and the users
        // mouse is no longer above it, the dropdown can enter an inconsistent state where
        // it believes the user is still hovering over it. In order to remedy this, we
        // call hoverOff whenever the dropdown receives updated props. This is a hack
        // because it will effectively close the dropdown on any prop update, barring
        // dropdowns from having dynamic content.
        this._onHoverOff();
    }
    public render(): React.ReactNode {
        return (
            <div
                style={{ ...this.props.style, width: 'fit-content', height: '100%' }}
                onMouseEnter={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                <div onClick={this._onActiveNodeClick.bind(this)}>{this.props.activeNode}</div>
                <Popover
                    open={this.state.isDropDownOpen}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={this.props.anchorOrigin}
                    targetOrigin={this.props.targetOrigin}
                    onRequestClose={
                        this.props.closeEvent === DropdownMouseEvent.Click
                            ? this._closePopover.bind(this)
                            : _.noop.bind(_)
                    }
                    useLayerForClickAway={this.props.closeEvent === DropdownMouseEvent.Click}
                    animated={false}
                    zDepth={this.props.zDepth}
                    style={this.props.popoverStyle}
                >
                    <div
                        onMouseEnter={this._onHover.bind(this)}
                        onMouseLeave={this._onHoverOff.bind(this)}
                        onClick={this._closePopover.bind(this)}
                    >
                        {this.props.popoverContent}
                    </div>
                </Popover>
            </div>
        );
    }
    private _onActiveNodeClick(event: React.FormEvent<HTMLInputElement>): void {
        if (this.props.activateEvent === DropdownMouseEvent.Click) {
            this.setState({
                isDropDownOpen: !this.state.isDropDownOpen,
                anchorEl: event.currentTarget,
            });
        }
    }
    private _onHover(event: React.FormEvent<HTMLInputElement>): void {
        this._isHovering = true;
        if (this.props.activateEvent === DropdownMouseEvent.Hover) {
            this._checkIfShouldOpenPopover(event);
        }
    }
    private _onHoverOff(): void {
        this._isHovering = false;
    }
    private _checkIfShouldOpenPopover(event: React.FormEvent<HTMLInputElement>): void {
        if (this.state.isDropDownOpen) {
            return; // noop
        }
        this.setState({
            isDropDownOpen: true,
            anchorEl: event.currentTarget,
        });
    }
    private _checkIfShouldClosePopover(): void {
        if (!this.state.isDropDownOpen) {
            return; // noop
        }
        if (this.props.closeEvent === DropdownMouseEvent.Hover && !this._isHovering) {
            this._closePopover();
        }
    }
    private _closePopover(): void {
        this.setState({
            isDropDownOpen: false,
        });
    }
}
