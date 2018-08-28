import * as React from 'react';
import { Placement } from 'react-popper';
import { Popover } from 'ts/components/ui/popover';

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
    placement?: Placement;
    style?: React.CSSProperties;
    zDepth?: number;
    activateEvent?: DropdownMouseEvent;
    closeEvent?: DropdownMouseEvent;
}

interface DropDownState {
    isDropDownOpen: boolean;
    isHovering: boolean;
    anchorEl?: HTMLInputElement;
}

export class DropDown extends React.Component<DropDownProps, DropDownState> {
    public static defaultProps: Partial<DropDownProps> = {
        style: DEFAULT_STYLE,
        zDepth: 1,
        activateEvent: DropdownMouseEvent.Hover,
        closeEvent: DropdownMouseEvent.Hover,
    };
    private _popoverCloseCheckIntervalId: number;
    public static getDerivedStateFromProps(props: DropDownProps, state: DropDownState): Partial<DropDownState> {
        switch (props.activateEvent) {
            case DropdownMouseEvent.Click:
                return { isDropDownOpen: state.isDropDownOpen };
            case DropdownMouseEvent.Hover:
                return { isDropDownOpen: state.isHovering };
            default:
                return {};
        }
    }
    constructor(props: DropDownProps) {
        super(props);
        this.state = {
            isHovering: false,
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
    public render(): React.ReactNode {
        return (
            <div
                style={{ ...this.props.style, width: 'fit-content', height: '100%' }}
                onMouseEnter={this._onHover.bind(this)}
                onMouseLeave={this._onHoverOff.bind(this)}
            >
                <div onClick={this._onActiveNodeClick.bind(this)}>{this.props.activeNode}</div>
                {this.state.isDropDownOpen &&
                    <Popover
                        anchorEl={this.state.anchorEl}
                        placement={this.props.placement}
                        onRequestClose={this._closePopover.bind(this)}
                        zIndex={this.props.zDepth}
                    >
                        <div
                            onClick={this._closePopover.bind(this)}
                        >
                            {this.props.popoverContent}
                        </div>
                    </Popover>
                }
            </div>
        );
    }
    private _onActiveNodeClick(event: React.FormEvent<HTMLInputElement>): void {
        if (this.props.activateEvent === DropdownMouseEvent.Click) {
            this.setState({
                isDropDownOpen: true,
                anchorEl: event.currentTarget,
            });
        }
    }
    private _onHover(event: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            isHovering: true,
            anchorEl: event.currentTarget,
        });
    }
    private _onHoverOff(): void {
        this.setState({ isHovering: false, anchorEl: undefined });
    }
    private _checkIfShouldClosePopover(): void {
        if (!this.state.isDropDownOpen) {
            return; // noop
        }
        if (this.props.closeEvent === DropdownMouseEvent.Hover && !this.state.isHovering) {
            this._closePopover();
        }
    }
    private _closePopover(): void {
        this.setState({
            isDropDownOpen: false,
        });
    }
}
