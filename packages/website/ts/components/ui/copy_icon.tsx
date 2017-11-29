import * as _ from 'lodash';
import {colors} from 'material-ui/styles';
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
    private copyTooltipTimeoutId: number;
    private copyable: HTMLInputElement;
    constructor(props: CopyIconProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public componentDidUpdate() {
        // Remove tooltip if hover away
        if (!this.state.isHovering && this.copyTooltipTimeoutId) {
            clearInterval(this.copyTooltipTimeoutId);
            this.hideTooltip();
        }
    }
    public render() {
        return (
            <div className="inline-block">
                    <CopyToClipboard text={this.props.data} onCopy={this.onCopy.bind(this)}>
                        <div
                            className="inline flex"
                            style={{cursor: 'pointer', color: colors.amber600}}
                            ref={this.setRefToProperty.bind(this)}
                            data-tip={true}
                            data-for="copy"
                            data-event="click"
                            data-iscapture={true} // This let's the click event continue to propogate
                            onMouseOver={this.setHoverState.bind(this, true)}
                            onMouseOut={this.setHoverState.bind(this, false)}
                        >
                            <div>
                                <i style={{fontSize: 15}} className="zmdi zmdi-copy" />
                            </div>
                            {this.props.callToAction &&
                                <div className="pl1">{this.props.callToAction}</div>
                            }
                        </div>
                    </CopyToClipboard>
                <ReactTooltip id="copy">Copied!</ReactTooltip>
            </div>
        );
    }
    private setRefToProperty(el: HTMLInputElement) {
        this.copyable = el;
    }
    private setHoverState(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
    private onCopy() {
        if (this.copyTooltipTimeoutId) {
            clearInterval(this.copyTooltipTimeoutId);
        }

        const tooltipLifespanMs = 1000;
        this.copyTooltipTimeoutId = window.setTimeout(() => {
            this.hideTooltip();
        }, tooltipLifespanMs);
    }
    private hideTooltip() {
        ReactTooltip.hide(ReactDOM.findDOMNode(this.copyable));
    }
}
