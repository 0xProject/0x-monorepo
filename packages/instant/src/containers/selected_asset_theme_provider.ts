import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../redux/reducer';
import { Theme, theme as defaultTheme, ThemeProvider } from '../style/theme';
import { Asset } from '../types';

export interface SelectedAssetThemeProviderProps {}

interface ConnectedState {
    theme: Theme;
}

const getTheme = (asset?: Asset): Theme => {
    if (!_.isUndefined(asset) && !_.isUndefined(asset.metaData.primaryColor)) {
        return {
            ...defaultTheme,
            primaryColor: asset.metaData.primaryColor,
        };
    }
    return defaultTheme;
};

const mapStateToProps = (state: State, _ownProps: SelectedAssetThemeProviderProps): ConnectedState => {
    const theme = getTheme(state.selectedAsset);
    return { theme };
};

export const SelectedAssetThemeProvider: React.ComponentClass<SelectedAssetThemeProviderProps> = connect(
    mapStateToProps,
)(ThemeProvider);
