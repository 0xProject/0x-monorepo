import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Placement, Popper, PopperChildrenProps } from 'react-popper';

import { colors } from '@0xproject/react-shared';
import { Container } from 'ts/components/ui/container';
import { Overlay } from 'ts/components/ui/overlay';
import { styled } from 'ts/style/theme';

export interface PopoverProps {
    anchorEl: HTMLInputElement;
    placement?: Placement;
    onRequestClose?: () => void;
    zIndex?: number;
}

const PopoverContainer = styled.div`
    background-color: ${colors.white};
    max-height: 679px;
    overflow-y: auto;
    border-radius: 2px;
`;

const defaultPlacement: Placement = 'bottom';

export class Popover extends React.Component<PopoverProps> {
    public static defaultProps = {
        placement: defaultPlacement,
    };

    public render(): React.ReactNode {
        const { anchorEl, placement, zIndex, onRequestClose } = this.props;
        const overlayStyleOverrides = {
            zIndex,
            backgroundColor: 'transparent',
        };
        return (
            <div>
                <Overlay onClick={onRequestClose} style={overlayStyleOverrides}/>
                <Popper referenceElement={anchorEl} placement="bottom" eventsEnabled={true}>
                    {this._renderPopperChildren.bind(this)}
                </Popper>
            </div>
        );
    }
    private _renderPopperChildren(props: PopperChildrenProps): React.ReactNode {
        const popperContainerStyleOverrids = {
            zIndex: _.isUndefined(this.props.zIndex) ? undefined : this.props.zIndex + 1,
        };
        return (
            <div ref={props.ref} style={{...props.style, ...popperContainerStyleOverrids}}>
                <PopoverContainer>
                    {this.props.children}
                </PopoverContainer>
            </div>
        );
    }
}
