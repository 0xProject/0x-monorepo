import * as _ from 'lodash';
import {Token, TrackedTokensByNetworkId} from 'ts/types';
import {localStorage} from 'ts/local_storage/local_storage';

const TRACKED_TOKENS_KEY = 'trackedTokens';

export const trackedTokenStorage = {
    addTrackedTokenToUser(userAddress: string, networkId: number, token: Token) {
        const trackedTokensByUserAddress = this.getTrackedTokensByUserAddress();
        let trackedTokensByNetworkId = trackedTokensByUserAddress[userAddress];
        if (_.isUndefined(trackedTokensByNetworkId)) {
            trackedTokensByNetworkId = {};
        }
        const trackedTokens = !_.isUndefined(trackedTokensByNetworkId[networkId]) ?
                                    trackedTokensByNetworkId[networkId] :
                                    [];
        trackedTokens.push(token);
        trackedTokensByNetworkId[networkId] = trackedTokens;
        trackedTokensByUserAddress[userAddress] = trackedTokensByNetworkId;
        const trackedTokensByUserAddressJSONString = JSON.stringify(trackedTokensByUserAddress);
        localStorage.setItem(TRACKED_TOKENS_KEY, trackedTokensByUserAddressJSONString);
    },
    getTrackedTokensByUserAddress(): TrackedTokensByNetworkId {
        const trackedTokensJSONString = localStorage.getItemIfExists(TRACKED_TOKENS_KEY);
        if (_.isEmpty(trackedTokensJSONString)) {
            return {};
        }
        const trackedTokensByUserAddress = JSON.parse(trackedTokensJSONString);
        return trackedTokensByUserAddress;
    },
    getTrackedTokensIfExists(userAddress: string, networkId: number): Token[] {
        const trackedTokensJSONString = localStorage.getItemIfExists(TRACKED_TOKENS_KEY);
        if (_.isEmpty(trackedTokensJSONString)) {
            return undefined;
        }
        const trackedTokensByUserAddress = JSON.parse(trackedTokensJSONString);
        const trackedTokensByNetworkId = trackedTokensByUserAddress[userAddress];
        if (_.isUndefined(trackedTokensByNetworkId)) {
            return undefined;
        }
        const trackedTokens = trackedTokensByNetworkId[networkId];
        return trackedTokens;
    },
    removeTrackedToken(userAddress: string, networkId: number, tokenAddress: string) {
        const trackedTokensByUserAddress = this.getTrackedTokensByUserAddress();
        const trackedTokensByNetworkId = trackedTokensByUserAddress[userAddress];
        const trackedTokens = trackedTokensByNetworkId[networkId];
        const remainingTrackedTokens = _.filter(trackedTokens, (token: Token) => {
            return token.address !== tokenAddress;
        });
        trackedTokensByNetworkId[networkId] = remainingTrackedTokens;
        trackedTokensByUserAddress[userAddress] = trackedTokensByNetworkId;
        const trackedTokensByUserAddressJSONString = JSON.stringify(trackedTokensByUserAddress);
        localStorage.setItem(TRACKED_TOKENS_KEY, trackedTokensByUserAddressJSONString);
    },
};
