import * as _ from 'lodash';
import Popover, { PopoverAnimationVertical } from 'material-ui/Popover';
import * as React from 'react';
import { MaterialUIPosition } from 'ts/types';

const CHECK_CLOSE_POPOVER_INTERVAL_MS = 300;
const DEFAULT_STYLE = {
    fontSize: 14,
};

interface DropDownProps {
    hoverActiveNode: React.ReactNode;
    popoverContent: React.ReactNode;
    anchorOrigin: MaterialUIPosition;
    targetOrigin: MaterialUIPosition;
    style?: React.CSSProperties;
    zDepth?: number;
}

interface DropDownState {
    isDropDownOpen: boolean;
    anchorEl?: HTMLInputElement;
}

export class DropDown extends React.Component<DropDownProps, DropDownState> {
    public static defaultProps: Partial<DropDownProps> = {
        style: DEFAULT_STYLE,
        zDepth: 1,
    };
    private _isHovering: boolean;
    private _popoverCloseCheckIntervalId: number;
    constructor(props: DropDownProps) {
        super(props);
        this.state = {
            isDropDownOpen: false,
        };
    }
    public componentDidMount() {
        this._popoverCloseCheckIntervalId = window.setInterval(() => {
            this._checkIfShouldClosePopover();
        }, CHECK_CLOSE_POPOVER_INTERVAL_MS);
    }
    public componentWillUnmount() {
        window.clearInterval(this._popoverCloseCheckIntervalId);
    }
    public componentWillReceiveProps(nextProps: DropDownProps) {
        // HACK: If the popoverContent is updated to a different dimension and the users
        // mouse is no longer above it, the dropdown can enter an inconsistent state where
        // it believes the user is still hovering over it. In order to remedy this, we
        // call hoverOff whenever the dropdown receives updated props. This is a hack
        // because it will effectively close the dropdown on any prop update, barring
        // dropdowns from having dynamic content.
        this._onHoverOff();
    }
    public render() {
        return (
            <div
                style={{ ...this.props.style, width: 'fit-content', height: '100%' }}
                onMouseEnter={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                {this.props.hoverActiveNode}
                <Popover
                    open={this.state.isDropDownOpen}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={this.props.anchorOrigin}
                    targetOrigin={this.props.targetOrigin}
                    onRequestClose={this._closePopover.bind(this)}
                    useLayerForClickAway={false}
                    animation={PopoverAnimationVertical}
                    zDepth={this.props.zDepth}
                >
                    <div onMouseEnter={this._onHover.bind(this)} onMouseLeave={this._onHoverOff.bind(this)}>
                        {this.props.popoverContent}
                    </div>
                </Popover>
            </div>
        );
    }
    private _onHover(event: React.FormEvent<HTMLInputElement>) {
        this._isHovering = true;
        this._checkIfShouldOpenPopover(event);
    }
    private _checkIfShouldOpenPopover(event: React.FormEvent<HTMLInputElement>) {
        if (this.state.isDropDownOpen) {
            return; // noop
        }

        this.setState({
            isDropDownOpen: true,
            anchorEl: event.currentTarget,
        });
    }
    private _onHoverOff() {
        this._isHovering = false;
    }
    private _checkIfShouldClosePopover() {
        if (!this.state.isDropDownOpen || this._isHovering) {
            return; // noop
        }
        this._closePopover();
    }
    private _closePopover() {
        this.setState({
            isDropDownOpen: false,
        });
    }
}
