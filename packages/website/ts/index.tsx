// Polyfills
import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import * as ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
import { createStore, Store as ReduxStore } from 'redux';
import { About } from 'ts/containers/about';
import { FAQ } from 'ts/containers/faq';
import { Landing } from 'ts/containers/landing';
import { NotFound } from 'ts/containers/not_found';
import { Wiki } from 'ts/containers/wiki';
import { createLazyComponent } from 'ts/lazy_component';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { reducer, State } from 'ts/redux/reducer';
import { WebsitePaths } from 'ts/types';
import { muiTheme } from 'ts/utils/mui_theme';
import 'whatwg-fetch';
injectTapEventPlugin();

// Check if we've introduced an update that requires us to clear the tradeHistory local storage entries
tradeHistoryStorage.clearIfRequired();
trackedTokenStorage.clearIfRequired();

import 'basscss/css/basscss.css';
import 'less/all.less';

// We pass modulePromise returning lambda instead of module promise,
// cause we only want to import the module when the user navigates to the page.
// At the same time webpack statically parses for System.import() to determine bundle chunk split points
// so each lazy import needs it's own `System.import()` declaration.
const LazyPortal = createLazyComponent('Portal', async () =>
    System.import<any>(/* webpackChunkName: "portal" */ 'ts/containers/portal'),
);
const LazyZeroExJSDocumentation = createLazyComponent('Documentation', async () =>
    System.import<any>(/* webpackChunkName: "zeroExDocs" */ 'ts/containers/zero_ex_js_documentation'),
);
const LazySmartContractsDocumentation = createLazyComponent('Documentation', async () =>
    System.import<any>(/* webpackChunkName: "smartContractDocs" */ 'ts/containers/smart_contracts_documentation'),
);
const LazyConnectDocumentation = createLazyComponent('Documentation', async () =>
    System.import<any>(/* webpackChunkName: "connectDocs" */ 'ts/containers/connect_documentation'),
);

ReactGA.initialize('UA-98720122-1');
const store: ReduxStore<State> = createStore(reducer);
render(
    <Router>
        <div>
            <MuiThemeProvider muiTheme={muiTheme}>
                <Provider store={store}>
                    <div>
                        <Switch>
                            <Route exact={true} path="/" component={Landing as any} />
                            <Redirect from="/otc" to={`${WebsitePaths.Portal}`} />
                            <Route path={`${WebsitePaths.Portal}`} component={LazyPortal} />
                            <Route path={`${WebsitePaths.FAQ}`} component={FAQ as any} />
                            <Route path={`${WebsitePaths.About}`} component={About as any} />
                            <Route path={`${WebsitePaths.Wiki}`} component={Wiki as any} />
                            <Route path={`${WebsitePaths.ZeroExJs}/:version?`} component={LazyZeroExJSDocumentation} />
                            <Route path={`${WebsitePaths.Connect}/:version?`} component={LazyConnectDocumentation} />
                            <Route
                                path={`${WebsitePaths.SmartContracts}/:version?`}
                                component={LazySmartContractsDocumentation}
                            />
                            <Route component={NotFound as any} />
                        </Switch>
                    </div>
                </Provider>
            </MuiThemeProvider>
        </div>
    </Router>,
    document.getElementById('app'),
);
