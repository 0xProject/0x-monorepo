import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { MetaTags } from 'ts/components/meta_tags';
import { About } from 'ts/containers/about';
import { DocsHome } from 'ts/containers/docs_home';
import { FAQ } from 'ts/containers/faq';
import { Instant } from 'ts/containers/instant';
import { Jobs } from 'ts/containers/jobs';
import { Landing } from 'ts/containers/landing'; // Note(ez): When we're done we omit all old site imports
import { LaunchKit } from 'ts/containers/launch_kit';
import { NotFound } from 'ts/containers/not_found';
import { Wiki } from 'ts/containers/wiki';
import { createLazyComponent } from 'ts/lazy_component';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { store } from 'ts/redux/store';
import { WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { muiTheme } from 'ts/utils/mui_theme';

// Next (new website) routes. We should rename them later
import { NextAboutJobs } from 'ts/@next/pages/about/jobs';
import { NextAboutMission } from 'ts/@next/pages/about/mission';
import { NextAboutPress } from 'ts/@next/pages/about/press';
import { NextAboutTeam } from 'ts/@next/pages/about/team';
import { NextCommunity } from 'ts/@next/pages/community';
import { NextEcosystem } from 'ts/@next/pages/ecosystem';
import { Next0xInstant } from 'ts/@next/pages/instant';
import { NextLanding } from 'ts/@next/pages/landing';
import { NextLaunchKit } from 'ts/@next/pages/launch_kit';
import { NextMarketMaker } from 'ts/@next/pages/market_maker';
import { NextWhy } from 'ts/@next/pages/why';

// Check if we've introduced an update that requires us to clear the tradeHistory local storage entries
tradeHistoryStorage.clearIfRequired();
trackedTokenStorage.clearIfRequired();

import 'basscss/css/basscss.css';
import 'less/all.less';

// We pass modulePromise returning lambda instead of module promise,
// cause we only want to import the module when the user navigates to the page.
// At the same time webpack statically parses for import() to determine bundle chunk split points
// so each lazy import needs it's own `import()` declaration.

const LazyPortal = createLazyComponent('Portal', async () =>
    import(/* webpackChunkName: "portal" */ 'ts/containers/portal'),
);
const LazyZeroExJSDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "zeroExDocs" */ 'ts/containers/zero_ex_js_documentation'),
);
const LazyContractWrappersDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "contractWrapperDocs" */ 'ts/containers/contract_wrappers_documentation'),
);
const LazyMigrationsDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "migrationsDocs" */ 'ts/containers/migrations_documentation'),
);
const LazyOrderWatcherDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "orderWatcherDocs" */ 'ts/containers/order_watcher_documentation'),
);
const LazySmartContractsDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "smartContractDocs" */ 'ts/containers/smart_contracts_documentation'),
);
const LazyConnectDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "connectDocs" */ 'ts/containers/connect_documentation'),
);
const LazyWeb3WrapperDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "web3WrapperDocs" */ 'ts/containers/web3_wrapper_documentation'),
);
const LazySolCompilerDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "solCompilerDocs" */ 'ts/containers/sol_compiler_documentation'),
);
const LazyJSONSchemasDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "jsonSchemasDocs" */ 'ts/containers/json_schemas_documentation'),
);
const LazySolCovDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "solCovDocs" */ 'ts/containers/sol_cov_documentation'),
);
const LazySubprovidersDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "subproviderDocs" */ 'ts/containers/subproviders_documentation'),
);
const LazyOrderUtilsDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "orderUtilsDocs" */ 'ts/containers/order_utils_documentation'),
);
const LazyEthereumTypesDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "ethereumTypesDocs" */ 'ts/containers/ethereum_types_documentation'),
);
const LazyAssetBuyerDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "assetBuyerDocs" */ 'ts/containers/asset_buyer_documentation'),
);

const DOCUMENT_TITLE = '0x: The Protocol for Trading Tokens';
const DOCUMENT_DESCRIPTION = 'An Open Protocol For Decentralized Exchange On The Ethereum Blockchain';

render(
    <div>
        <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
        <Router>
            <div>
                <MuiThemeProvider muiTheme={muiTheme}>
                    <Provider store={store}>
                        <div>
                            <Switch>
                                {/* Next (new site) routes */}
                                <Route exact path="/" component={NextLanding as any} />
                                <Route exact path={WebsitePaths.Why} component={NextWhy as any} />
                                <Route exact path={WebsitePaths.Instant} component={Next0xInstant as any} />
                                <Route exact path={WebsitePaths.LaunchKit} component={NextLaunchKit as any} />
                                <Route exact path={WebsitePaths.Ecosystem} component={NextEcosystem as any} />
                                <Route exact path={WebsitePaths.Community} component={NextCommunity as any} />
                                <Route exact path={WebsitePaths.MarketMaker} component={NextMarketMaker as any} />
                                <Route exact path={WebsitePaths.AboutMission} component={NextAboutMission as any} />
                                <Route exact path={WebsitePaths.AboutTeam} component={NextAboutTeam as any} />
                                <Route exact path={WebsitePaths.AboutPress} component={NextAboutPress as any} />
                                <Route exact path={WebsitePaths.AboutJobs} component={NextAboutJobs as any} />
                                {/*
                                  Note(ez): We remove/replace all old routes with next routes
                                  once we're ready to put a ring on it. for now let's keep em there for reference
                                */}
                                <Redirect from="/otc" to={`${WebsitePaths.Portal}`} />
                                <Route path={WebsitePaths.Portal} component={LazyPortal} />
                                <Route path={WebsitePaths.FAQ} component={FAQ as any} />
                                <Route path={WebsitePaths.Wiki} component={Wiki as any} />

                                <Route
                                    path={`${WebsitePaths.ZeroExJs}/:version?`}
                                    component={LazyZeroExJSDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.ContractWrappers}/:version?`}
                                    component={LazyContractWrappersDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.Migrations}/:version?`}
                                    component={LazyMigrationsDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.OrderWatcher}/:version?`}
                                    component={LazyOrderWatcherDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.Connect}/:version?`}
                                    component={LazyConnectDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SolCompiler}/:version?`}
                                    component={LazySolCompilerDocumentation}
                                />
                                <Route path={`${WebsitePaths.SolCov}/:version?`} component={LazySolCovDocumentation} />
                                <Route
                                    path={`${WebsitePaths.JSONSchemas}/:version?`}
                                    component={LazyJSONSchemasDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.Subproviders}/:version?`}
                                    component={LazySubprovidersDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.OrderUtils}/:version?`}
                                    component={LazyOrderUtilsDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.Web3Wrapper}/:version?`}
                                    component={LazyWeb3WrapperDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SmartContracts}/:version?`}
                                    component={LazySmartContractsDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.EthereumTypes}/:version?`}
                                    component={LazyEthereumTypesDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.AssetBuyer}/:version?`}
                                    component={LazyAssetBuyerDocumentation}
                                />
                                <Route path={WebsitePaths.Docs} component={DocsHome as any} />
                                {/* Legacy endpoints */}
                                <Route
                                    path={`${WebsiteLegacyPaths.ZeroExJs}/:version?`}
                                    component={LazyZeroExJSDocumentation}
                                />
                                <Route
                                    path={`${WebsiteLegacyPaths.Web3Wrapper}/:version?`}
                                    component={LazyWeb3WrapperDocumentation}
                                />
                                <Route
                                    path={`${WebsiteLegacyPaths.Deployer}/:version?`}
                                    component={LazySolCompilerDocumentation}
                                />
                                <Route path={WebsiteLegacyPaths.Jobs} component={Jobs as any} />
                                <Route component={NotFound as any} />
                            </Switch>
                        </div>
                    </Provider>
                </MuiThemeProvider>
            </div>
        </Router>
    </div>,
    document.getElementById('app'),
);
