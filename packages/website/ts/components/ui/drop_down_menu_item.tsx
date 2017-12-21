import * as _ from 'lodash';
import Menu from 'material-ui/Menu';
import Popover from 'material-ui/Popover';
import * as React from 'react';
import {colors} from 'ts/utils/colors';

const CHECK_CLOSE_POPOVER_INTERVAL_MS = 300;
const DEFAULT_STYLE = {
    fontSize: 14,
};

interface DropDownMenuItemProps {
    title: string;
    subMenuItems: React.ReactNode[];
    style?: React.CSSProperties;
    menuItemStyle?: React.CSSProperties;
    isNightVersion?: boolean;
}

interface DropDownMenuItemState {
    isDropDownOpen: boolean;
    anchorEl?: HTMLInputElement;
}

export class DropDownMenuItem extends React.Component<DropDownMenuItemProps, DropDownMenuItemState> {
    public static defaultProps: Partial<DropDownMenuItemProps> = {
        style: DEFAULT_STYLE,
        menuItemStyle: DEFAULT_STYLE,
        isNightVersion: false,
    };
    private _isHovering: boolean;
    private _popoverCloseCheckIntervalId: number;
    constructor(props: DropDownMenuItemProps) {
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
    public render() {
        const colorStyle = this.props.isNightVersion ? 'white' : this.props.style.color;
        return (
            <div
                style={{...this.props.style, color: colorStyle}}
                onMouseEnter={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                <div className="flex relative">
                    <div style={{paddingRight: 10}}>
                        {this.props.title}
                    </div>
                    <div className="absolute" style={{paddingLeft: 3, right: 3, top: -2}}>
                        <i className="zmdi zmdi-caret-right" style={{fontSize: 22}} />
                    </div>
                </div>
                <Popover
                    open={this.state.isDropDownOpen}
                    anchorEl={this.state.anchorEl}
                    anchorOrigin={{horizontal: 'middle', vertical: 'bottom'}}
                    targetOrigin={{horizontal: 'middle', vertical: 'top'}}
                    onRequestClose={this._closePopover.bind(this)}
                    useLayerForClickAway={false}
                >
                    <div
                        onMouseEnter={this._onHover.bind(this)}
                        onMouseLeave={this._onHoverOff.bind(this)}
                    >
                        <Menu style={{color: colors.grey}}>
                            {this.props.subMenuItems}
                        </Menu>
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
    private _onHoverOff(event: React.FormEvent<HTMLInputElement>) {
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
