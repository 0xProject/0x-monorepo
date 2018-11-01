import { assert as sharedAssert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ObjectMap, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { AssetMetaData } from '../types';

export const assert = {
    ...sharedAssert,
    isValidOrderSource(variableName: string, orderSource: string | SignedOrder[]): void {
        if (_.isString(orderSource)) {
            sharedAssert.isUri(variableName, orderSource);
            return;
        }
        sharedAssert.doesConformToSchema(variableName, orderSource, schemas.signedOrdersSchema);
    },
    isValidAssetMetaDataMap(variableName: string, metaDataMap: ObjectMap<AssetMetaData>): void {
        _.forEach(metaDataMap, (metaData, assetData) => {
            assert.isHexString(`key ${assetData} of ${variableName}`, assetData);
            assert.isValidAssetMetaData(`${variableName}.${assetData}`, metaData);
            const assetDataProxyId = assetDataUtils.decodeAssetProxyId(assetData);
            assert.assert(
                metaData.assetProxyId === assetDataProxyId,
                `Expected meta data for assetData ${assetData} to have asset proxy id of ${assetDataProxyId}, but instead got ${
                    metaData.assetProxyId
                }`,
            );
        });
    },
    isValidAssetMetaData(variableName: string, metaData: AssetMetaData): void {
        assert.isHexString(`${variableName}.assetProxyId`, metaData.assetProxyId);
        if (!_.isUndefined(metaData.primaryColor)) {
            assert.isString(`${variableName}.primaryColor`, metaData.primaryColor);
        }
        if (metaData.assetProxyId === AssetProxyId.ERC20) {
            assert.isNumber(`${variableName}.decimals`, metaData.decimals);
            assert.isString(`${variableName}.symbol`, metaData.symbol);
        } else if (metaData.assetProxyId === AssetProxyId.ERC721) {
            assert.isString(`${variableName}.name`, metaData.name);
            assert.isUri(`${variableName}.imageUrl`, metaData.imageUrl);
        }
    },
};
