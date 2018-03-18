import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

interface SwapIconProps {
    swapTokensFn: () => void;
}

interface SwapIconState {
    isHovering: boolean;
}

export class SwapIcon extends React.Component<SwapIconProps, SwapIconState> {
    public constructor(props: SwapIconProps) {
        super(props);
        this.state = {
            isHovering: false,
        };
    }
    public render() {
        const swapStyles = {
            color: this.state.isHovering ? colors.amber600 : colors.amber800,
            fontSize: 50,
        };
        return (
            <div
                className="mx-auto pt4"
                style={{ cursor: 'pointer', height: 50, width: 37.5 }}
                onClick={this.props.swapTokensFn}
                onMouseEnter={this._onToggleHover.bind(this, true)}
                onMouseLeave={this._onToggleHover.bind(this, false)}
            >
                <i style={swapStyles} className="zmdi zmdi-swap" />
            </div>
        );
    }
    private _onToggleHover(isHovering: boolean) {
        this.setState({
            isHovering,
        });
    }
}
