import { Middleware } from 'redux';
import { State } from 'ts/redux/reducer';
import { ActionTypes } from 'ts/types';
import { analytics } from 'ts/utils/analytics';

export const analyticsMiddleware: Middleware = store => next => action => {
    const nextAction = next(action);
    const nextState = (store.getState() as any) as State;
    switch (action.type) {
        case ActionTypes.UpdateInjectedProviderName:
            analytics.addEventPropertiesAsync({
                injectedProviderName: nextState.injectedProviderName,
            });
            break;
        case ActionTypes.UpdateNetworkId:
            analytics.addEventPropertiesAsync({
                networkId: nextState.networkId,
            });
            break;
        case ActionTypes.UpdateUserAddress:
            analytics.addUserPropertiesAsync({
                ethAddress: nextState.userAddress,
            });
            break;
        case ActionTypes.UpdateUserEtherBalance:
            if (nextState.userEtherBalanceInWei) {
                analytics.addUserPropertiesAsync({
                    ethBalance: nextState.userEtherBalanceInWei.toString(),
                });
            }
            break;
        case ActionTypes.UpdatePortalOnboardingStep:
            analytics.trackAsync('Update Onboarding Step', {
                stepIndex: nextState.portalOnboardingStep,
            });
            break;
        default:
            break;
    }
    return nextAction;
};
