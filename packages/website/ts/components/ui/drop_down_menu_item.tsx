import * as _ from 'lodash';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Popover from 'material-ui/Popover';
import * as React from 'react';
import {Link} from 'react-router-dom';
import {
    Link as ScrollLink,
} from 'react-scroll';
import {Styles, WebsitePaths} from 'ts/types';

const CHECK_CLOSE_POPOVER_INTERVAL_MS = 300;
const CUSTOM_LIGHT_GRAY = '#848484';
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
    private isHovering: boolean;
    private popoverCloseCheckIntervalId: number;
    constructor(props: DropDownMenuItemProps) {
        super(props);
        this.state = {
            isDropDownOpen: false,
        };
    }
    public componentDidMount() {
        this.popoverCloseCheckIntervalId = window.setInterval(() => {
            this.checkIfShouldClosePopover();
        }, CHECK_CLOSE_POPOVER_INTERVAL_MS);
    }
    public componentWillUnmount() {
        window.clearInterval(this.popoverCloseCheckIntervalId);
    }
    public render() {
        const colorStyle = this.props.isNightVersion ? 'white' : this.props.style.color;
        return (
            <div
                style={{...this.props.style, color: colorStyle}}
                onMouseEnter={this.onHover.bind(this)}
                onMouseLeave={this.onHoverOff.bind(this)}
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
                    onRequestClose={this.closePopover.bind(this)}
                    useLayerForClickAway={false}
                >
                    <div
                        onMouseEnter={this.onHover.bind(this)}
                        onMouseLeave={this.onHoverOff.bind(this)}
                    >
                        <Menu style={{color: CUSTOM_LIGHT_GRAY}}>
                            {this.props.subMenuItems}
                        </Menu>
                    </div>
                </Popover>
            </div>
        );
    }
    private onHover(event: React.FormEvent<HTMLInputElement>) {
        this.isHovering = true;
        this.checkIfShouldOpenPopover(event);
    }
    private checkIfShouldOpenPopover(event: React.FormEvent<HTMLInputElement>) {
        if (this.state.isDropDownOpen) {
            return; // noop
        }

        this.setState({
          isDropDownOpen: true,
          anchorEl: event.currentTarget,
        });
    }
    private onHoverOff(event: React.FormEvent<HTMLInputElement>) {
        this.isHovering = false;
    }
    private checkIfShouldClosePopover() {
        if (!this.state.isDropDownOpen || this.isHovering) {
            return; // noop
        }
        this.closePopover();
    }
    private closePopover() {
        this.setState({
            isDropDownOpen: false,
        });
    }
}
