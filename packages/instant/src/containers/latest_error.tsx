import * as React from 'react';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { SlidingError } from '../components/sliding_error';
import { Overlay } from '../components/ui/overlay';
import { Action } from '../redux/actions';
import { State } from '../redux/reducer';
import { ScreenWidths } from '../style/media';
import { generateOverlayBlack } from '../style/theme';
import { zIndex } from '../style/z_index';
import { Asset, DisplayStatus, Omit, SlideAnimationState } from '../types';
import { errorFlasher } from '../util/error_flasher';

export interface LatestErrorComponentProps {
    asset?: Asset;
    latestErrorMessage?: string;
    animationState: SlideAnimationState;
    shouldRenderOverlay: boolean;
    onOverlayClick: () => void;
}

export const LatestErrorComponent: React.StatelessComponent<LatestErrorComponentProps> = props => {
    if (!props.latestErrorMessage) {
        return <div />;
    }
    return (
        <React.Fragment>
            <SlidingError animationState={props.animationState} icon="😢" message={props.latestErrorMessage} />
            {props.shouldRenderOverlay && (
                <Overlay
                    onClick={props.onOverlayClick}
                    zIndex={zIndex.containerOverlay}
                    showMaxWidth={ScreenWidths.Sm}
                    backgroundColor={generateOverlayBlack(0.4)}
                />
            )}
        </React.Fragment>
    );
};

export interface LatestErrorProps {}
interface ConnectedState extends Omit<LatestErrorComponentProps, 'onOverlayClick'> {}
const mapStateToProps = (state: State, _ownProps: LatestErrorProps): ConnectedState => ({
    asset: state.selectedAsset,
    latestErrorMessage: state.latestErrorMessage,
    animationState: state.latestErrorDisplayStatus === DisplayStatus.Present ? 'slidIn' : 'slidOut',
    shouldRenderOverlay: state.latestErrorDisplayStatus === DisplayStatus.Present,
});

type ConnectedDispatch = Pick<LatestErrorComponentProps, 'onOverlayClick'>;
const mapDispatchToProps = (dispatch: Dispatch<Action>, _ownProps: LatestErrorProps): ConnectedDispatch => ({
    onOverlayClick: () => {
        errorFlasher.clearError(dispatch);
    },
});

export const LatestError = connect(mapStateToProps, mapDispatchToProps)(LatestErrorComponent);
