import { Dispatch } from 'redux';
import { DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocsInfoConfig, ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';

import { DocsInfo } from 'ts/utils/docs_info';

export interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
    screenWidth: ScreenWidths;
}

export interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

export const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const getMapStateToProps = (docsInfoConfig: DocsInfoConfig) => {
    const docsInfo = new DocsInfo(docsInfoConfig);
    const mapStateToProps = (state: State, _ownProps: DocPageProps): ConnectedState => ({
        docsVersion: state.docsVersion,
        availableDocVersions: state.availableDocVersions,
        translate: state.translate,
        docsInfo,
        screenWidth: state.screenWidth,
    });
    return mapStateToProps;
};
