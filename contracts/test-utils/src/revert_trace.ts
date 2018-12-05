import { devConstants } from '@0x/dev-utils';
import { RevertTraceSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-cov';
import * as _ from 'lodash';

let revertTraceSubprovider: RevertTraceSubprovider;

export const revertTrace = {
    getRevertTraceSubproviderSingleton(): RevertTraceSubprovider {
        if (_.isUndefined(revertTraceSubprovider)) {
            revertTraceSubprovider = revertTrace._getRevertTraceSubprovider();
        }
        return revertTraceSubprovider;
    },
    _getRevertTraceSubprovider(): RevertTraceSubprovider {
        const defaultFromAddress = devConstants.TESTRPC_FIRST_ADDRESS;
        const solCompilerArtifactAdapter = new SolCompilerArtifactAdapter();
        const isVerbose = true;
        const subprovider = new RevertTraceSubprovider(solCompilerArtifactAdapter, defaultFromAddress, isVerbose);
        return subprovider;
    },
};
