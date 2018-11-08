import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { OverlayContainer, OverlayContainerProps } from '../components/ui/overlay_container';

import { Action } from '../redux/actions';
import { State } from '../redux/reducer';
import { ScreenWidths } from '../style/media';
import { DisplayStatus } from '../types';
import { errorFlasher } from '../util/error_flasher';

type ConnectedState = Pick<OverlayContainerProps, 'showOverlay' | 'showMaxWidth'>;
export interface LatestErrorOverlayProps {}
const mapStateToProps = (state: State, _ownProps: LatestErrorOverlayProps): ConnectedState => ({
    showOverlay: state.latestErrorDisplayStatus === DisplayStatus.Present,
    showMaxWidth: ScreenWidths.Sm,
});

type ConnectedDispatch = Pick<OverlayContainerProps, 'onOverlayClick'>;
const mapDispatchToProps = (dispatch: Dispatch<Action>, _ownProps: LatestErrorOverlayProps): ConnectedDispatch => ({
    onOverlayClick: () => {
        errorFlasher.clearError(dispatch);
    },
});
export const LatestErrorOverlay = connect(mapStateToProps, mapDispatchToProps)(OverlayContainer);
