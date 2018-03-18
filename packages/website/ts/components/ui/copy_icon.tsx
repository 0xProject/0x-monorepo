import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import * as ReactDOM from 'react-dom';
import ReactTooltip = require('react-tooltip');

interface CopyIconProps {
    data: string;
    callToAction?: string;
}

interface CopyIconState {
    isHovering: boolean;
}

export class CopyIcon extends React.Component<CopyIconProps, CopyIconState> {
    private _copyTooltipTimeoutId: number;
    private _copyable: HTMLInputElement;
    constructor(props: CopyIconProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public componentDidUpdate() {
        // Remove tooltip if hover away
        if (!this.state.isHovering && this._copyTooltipTimeoutId) {
            clearInterval(this._copyTooltipTimeoutId);
            this._hideTooltip();
        }
    }
    public render() {
        return (
            <div className="inline-block">
                <CopyToClipboard text={this.props.data} onCopy={this._onCopy.bind(this)}>
                    <div
                        className="inline flex"
                        style={{ cursor: 'pointer', color: colors.amber600 }}
                        ref={this._setRefToProperty.bind(this)}
                        data-tip={true}
                        data-for="copy"
                        data-event="click"
                        data-iscapture={true} // This let's the click event continue to propogate
                        onMouseOver={this._setHoverState.bind(this, true)}
                        onMouseOut={this._setHoverState.bind(this, false)}
                    >
                        <div>
                            <i style={{ fontSize: 15 }} className="zmdi zmdi-copy" />
                        </div>
                        {this.props.callToAction && <div className="pl1">{this.props.callToAction}</div>}
                    </div>
                </CopyToClipboard>
                <ReactTooltip id="copy">Copied!</ReactTooltip>
            </div>
        );
    }
    private _setRefToProperty(el: HTMLInputElement) {
        this._copyable = el;
    }
    private _setHoverState(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
    private _onCopy() {
        if (this._copyTooltipTimeoutId) {
            clearInterval(this._copyTooltipTimeoutId);
        }

        const tooltipLifespanMs = 1000;
        this._copyTooltipTimeoutId = window.setTimeout(() => {
            this._hideTooltip();
        }, tooltipLifespanMs);
    }
    private _hideTooltip() {
        ReactTooltip.hide(ReactDOM.findDOMNode(this._copyable));
    }
}
