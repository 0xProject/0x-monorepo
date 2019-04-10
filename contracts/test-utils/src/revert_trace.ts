import { devConstants } from '@0x/dev-utils';
import { RevertTraceSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-trace';

let revertTraceSubprovider: RevertTraceSubprovider;

export const revertTrace = {
    getRevertTraceSubproviderSingleton(): RevertTraceSubprovider {
        if (revertTraceSubprovider === undefined) {
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
