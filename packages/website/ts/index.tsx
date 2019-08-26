import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import { MetaTags } from 'ts/components/meta_tags';
import { NotFound } from 'ts/containers/not_found';
import { createLazyComponent } from 'ts/lazy_component';
import { trackedTokenStorage } from 'ts/local_storage/tracked_token_storage';
import { tradeHistoryStorage } from 'ts/local_storage/trade_history_storage';
import { DocsGuides } from 'ts/pages/docs/guides';
import { DocsHome } from 'ts/pages/docs/home';
import { DocsPage } from 'ts/pages/docs/page';
import { DocsTools } from 'ts/pages/docs/tools';
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
import { constants } from 'ts/utils/constants';

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
    <>
        <MetaTags title={DOCUMENT_TITLE} description={DOCUMENT_DESCRIPTION} />
        <Router>
            <MuiThemeProvider muiTheme={muiTheme}>
                <Provider store={store}>
                    <Switch>
                        {/* Next (new site) routes */}
                        <Route exact={true} path="/" component={NextLanding as any} />
                        <Route exact={true} path={WebsitePaths.Why} component={NextWhy as any} />
                        <Route exact={true} path={WebsitePaths.MarketMaker} component={NextMarketMaker as any} />
                        <Route exact={true} path={WebsitePaths.Explore} component={Explore as any} />
                        <Route exact={true} path={WebsitePaths.Credits} component={Credits as any} />
                        <Route exact={true} path={WebsitePaths.Instant} component={Next0xInstant as any} />
                        <Route exact={true} path={WebsitePaths.LaunchKit} component={NextLaunchKit as any} />
                        <Route exact={true} path={WebsitePaths.Ecosystem} component={NextEcosystem as any} />
                        <Route exact={true} path={`${WebsitePaths.Vote}/:zeip`} component={Governance as any} />
                        <Route exact={true} path={WebsitePaths.Vote} component={VoteIndex as any} />
                        <Route exact={true} path={WebsitePaths.Extensions} component={Extensions as any} />
                        <Route exact={true} path={WebsitePaths.AssetSwapperPage} component={CFL as any} />
                        <Route exact={true} path={WebsitePaths.PrivacyPolicy} component={PrivacyPolicy as any} />
                        <Route exact={true} path={WebsitePaths.TermsOfService} component={TermsOfService as any} />
                        <Route exact={true} path={WebsitePaths.AboutMission} component={NextAboutMission as any} />
                        <Route exact={true} path={WebsitePaths.AboutTeam} component={NextAboutTeam as any} />
                        <Route exact={true} path={WebsitePaths.AboutPress} component={NextAboutPress as any} />
                        <Route exact={true} path={WebsitePaths.AboutJobs} component={NextAboutJobs as any} />
                        {/*
                                  Note(ez): We remove/replace all old routes with next routes
                                  once we're ready to put a ring on it. for now let's keep em there for reference
                                */}
                        <Route path={WebsitePaths.Portal} component={LazyPortal} />
                        <Redirect from={`${WebsiteLegacyPaths.ZeroExJs}/:version?`} to={constants.URL_NPMJS_ZEROEXJS} />
                        <Redirect
                            from={`${WebsiteLegacyPaths.ContractWrappers}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/contract-wrappers/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.Migrations}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/migrations/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.Connect}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/connect/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.SolCompiler}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/sol-compiler/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.SolCoverage}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/sol-coverage/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.SolTrace}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/sol-trace/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.SolProfiler}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/sol-profiler/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.JSONSchemas}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/json-schemas/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.Subproviders}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/subproviders/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.OrderUtils}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/order-utils/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.Web3Wrapper}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/web3-wrapper/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.EthereumTypes}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/ethereum-types/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.AssetBuyer}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/asset-buyer/:version?`}
                        />
                        <Redirect
                            from={`${WebsiteLegacyPaths.AssetSwapperDocs}/:version?`}
                            to={`${WebsitePaths.Docs}/tools/asset-swapper/:version?`}
                        />
                        <Route
                            path={`${WebsitePaths.SmartContracts}/:version?`}
                            component={LazySmartContractsDocumentation}
                        />
                        <Route exact={true} path={WebsitePaths.Docs} component={DocsHome as any} />
                        <Route exact={true} path={WebsitePaths.DocsGuides} component={DocsGuides as any} />
                        <Route exact={true} path={WebsitePaths.DocsTools} component={DocsTools as any} />
                        <Route path={`${WebsitePaths.Docs}/:type/:page?/:version?`} component={DocsPage as any} />

                        {/* Legacy endpoints */}
                        <Redirect from={WebsitePaths.Wiki} to={WebsitePaths.DocsGuides} />
                        <Redirect from={WebsiteLegacyPaths.Jobs} to={WebsitePaths.AboutJobs} />
                        <Redirect from={WebsitePaths.Careers} to={WebsitePaths.AboutJobs} />
                        <Route component={NotFound as any} />
                    </Switch>
                </Provider>
            </MuiThemeProvider>
        </Router>
    </>,
    document.getElementById('app'),
);
