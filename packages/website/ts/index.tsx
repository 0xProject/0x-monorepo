import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { MetaTags } from 'ts/components/meta_tags';
import { DocsHome } from 'ts/containers/docs_home';
import { NotFound } from 'ts/containers/not_found';
import { Wiki } from 'ts/containers/wiki';
import { createLazyComponent } from 'ts/lazy_component';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { DocsGuides } from 'ts/pages/docs/guides';
import { DocsPageTemplate } from 'ts/pages/docs/page_template';
import { DocsTools } from 'ts/pages/docs/tools';
import { DocsView } from 'ts/pages/docs/view';
import { store } from 'ts/redux/store';
import { WebsiteLegacyPaths, WebsitePaths } from 'ts/types';
import { muiTheme } from 'ts/utils/mui_theme';

// Next (new website) routes. We should rename them later
import { NextAboutJobs } from 'ts/pages/about/jobs';
import { NextAboutMission } from 'ts/pages/about/mission';
import { NextAboutPress } from 'ts/pages/about/press';
import { NextAboutTeam } from 'ts/pages/about/team';
import { Credits } from 'ts/pages/credits';
import { Explore } from 'ts/pages/explore';

import { CFL } from 'ts/pages/cfl';
import { NextEcosystem } from 'ts/pages/ecosystem';
import { Extensions } from 'ts/pages/extensions';
import { Governance } from 'ts/pages/governance/governance';
import { VoteIndex } from 'ts/pages/governance/vote_index';
import { Next0xInstant } from 'ts/pages/instant';
import { NextLanding } from 'ts/pages/landing';
import { NextLaunchKit } from 'ts/pages/launch_kit';
import { NextMarketMaker } from 'ts/pages/market_maker';
import { PrivacyPolicy } from 'ts/pages/privacy';
import { TermsOfService } from 'ts/pages/terms';
import { NextWhy } from 'ts/pages/why';

// Check if we've introduced an update that requires us to clear the tradeHistory local storage entries
tradeHistoryStorage.clearIfRequired();
trackedTokenStorage.clearIfRequired();

import 'less/all.less';
import 'sass/modal_video.scss';

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
const LazySolCoverageDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "solCoverageDocs" */ 'ts/containers/sol_coverage_documentation'),
);
const LazySolTraceDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "solTraceDocs" */ 'ts/containers/sol_trace_documentation'),
);
const LazySolProfilerDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "solProfilerDocs" */ 'ts/containers/sol_profiler_documentation'),
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
const LazyAssetSwapperDocumentation = createLazyComponent('Documentation', async () =>
    import(/* webpackChunkName: "assetSwapperDocs" */ 'ts/containers/asset_swapper_documentation'),
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
                                <Route exact={true} path="/" component={NextLanding as any} />
                                <Route exact={true} path={WebsitePaths.Why} component={NextWhy as any} />
                                <Route
                                    exact={true}
                                    path={WebsitePaths.MarketMaker}
                                    component={NextMarketMaker as any}
                                />
                                <Route exact={true} path={WebsitePaths.Explore} component={Explore as any} />
                                <Route exact={true} path={WebsitePaths.Credits} component={Credits as any} />
                                <Route exact={true} path={WebsitePaths.Instant} component={Next0xInstant as any} />
                                <Route exact={true} path={WebsitePaths.LaunchKit} component={NextLaunchKit as any} />
                                <Route exact={true} path={WebsitePaths.Ecosystem} component={NextEcosystem as any} />
                                <Route exact={true} path={`${WebsitePaths.Vote}/:zeip`} component={Governance as any} />
                                <Route exact={true} path={WebsitePaths.Vote} component={VoteIndex as any} />
                                <Route exact={true} path={WebsitePaths.Extensions} component={Extensions as any} />
                                <Route exact={true} path={WebsitePaths.AssetSwapperPage} component={CFL as any} />
                                <Route
                                    exact={true}
                                    path={WebsitePaths.PrivacyPolicy}
                                    component={PrivacyPolicy as any}
                                />
                                <Route
                                    exact={true}
                                    path={WebsitePaths.TermsOfService}
                                    component={TermsOfService as any}
                                />
                                <Route
                                    exact={true}
                                    path={WebsitePaths.AboutMission}
                                    component={NextAboutMission as any}
                                />
                                <Route exact={true} path={WebsitePaths.AboutTeam} component={NextAboutTeam as any} />
                                <Route exact={true} path={WebsitePaths.AboutPress} component={NextAboutPress as any} />
                                <Route exact={true} path={WebsitePaths.AboutJobs} component={NextAboutJobs as any} />
                                {/*
                                  Note(ez): We remove/replace all old routes with next routes
                                  once we're ready to put a ring on it. for now let's keep em there for reference
                                */}
                                <Redirect from="/otc" to={`${WebsitePaths.Portal}`} />
                                <Route path={WebsitePaths.Portal} component={LazyPortal} />
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
                                    path={`${WebsitePaths.Connect}/:version?`}
                                    component={LazyConnectDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SolCompiler}/:version?`}
                                    component={LazySolCompilerDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SolCoverage}/:version?`}
                                    component={LazySolCoverageDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SolTrace}/:version?`}
                                    component={LazySolTraceDocumentation}
                                />
                                <Route
                                    path={`${WebsitePaths.SolProfiler}/:version?`}
                                    component={LazySolProfilerDocumentation}
                                />
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
                                <Route
                                    path={`${WebsitePaths.AssetSwapperDocs}/:version?`}
                                    component={LazyAssetSwapperDocumentation}
                                />
                                <Route path={`${WebsitePaths.Docs}/template`} component={DocsPageTemplate as any} />
                                <Route
                                    exact={true}
                                    path={`${WebsitePaths.Docs}/guides`}
                                    component={DocsGuides as any}
                                />
                                <Route path={`${WebsitePaths.Docs}/guides/:page`} component={DocsView as any} />
                                <Route path={`${WebsitePaths.Docs}/tools`} component={DocsTools as any} />
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
                                <Redirect from={WebsiteLegacyPaths.Jobs} to={WebsitePaths.AboutJobs} />
                                <Redirect from={WebsitePaths.Careers} to={WebsitePaths.AboutJobs} />
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
