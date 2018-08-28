import * as React from 'react';
import { connect } from 'react-redux';
import { Home as HomeComponent, HomeProps } from 'ts/pages/documentation/home';
import { State } from 'ts/redux/reducer';
import { Translate } from 'ts/utils/translate';

interface ConnectedState {
    translate: Translate;
}

const mapStateToProps = (state: State, _ownProps: HomeProps): ConnectedState => ({
    translate: state.translate,
});

export const DocsHome: React.ComponentClass<HomeProps> = connect(mapStateToProps, undefined)(HomeComponent);
