import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { Container, ContainerProps } from '../components/ui/container';
import { OverlayContainer } from '../components/ui/overlay_container';
import { Action } from '../redux/actions';
import { State } from '../redux/reducer';
import { ScreenWidths } from '../style/media';
import { DisplayStatus } from '../types';
import { errorFlasher } from '../util/error_flasher';

interface LatestErrorOverlayComponentProps extends ContainerProps {
    showOverlay: boolean;
    onOverlayClick: () => void;
}
// TODO: move to dismissable overlay (? - better name) component
// or move this into one component, i.e. OverlayableComponent

export const LatestErrorOverlayComponent: React.StatelessComponent<LatestErrorOverlayComponentProps> = props => {
    const { showOverlay, onOverlayClick, ...containerProps } = props;
    if (showOverlay) {
        return <OverlayContainer {...containerProps} onClick={onOverlayClick} showMaxWidthEm={ScreenWidths.Sm} />;
    } else {
        return <Container {...containerProps} />;
    }
};

type ConnectedState = Pick<LatestErrorOverlayComponentProps, 'showOverlay'>;
export interface LatestErrorOverlayProps extends ContainerProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorOverlayProps): ConnectedState => ({
    showOverlay: state.latestErrorDisplayStatus === DisplayStatus.Present,
});

type ConnectedDispatch = Pick<LatestErrorOverlayComponentProps, 'onOverlayClick'>;
const mapDispatchToProps = (dispatch: Dispatch<Action>, _ownProps: LatestErrorOverlayProps): ConnectedDispatch => ({
    onOverlayClick: () => {
        // might need to use the error flasher here to make sure its cleared out
        console.log('dismissing bro');
        errorFlasher.clearError(dispatch);
    },
});
export const LatestErrorOverlay = connect(mapStateToProps, mapDispatchToProps)(LatestErrorOverlayComponent);
