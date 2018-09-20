import { ExchangeFillEventArgs } from '@0xproject/contract-wrappers';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'reflect-metadata';
import { createConnection } from 'typeorm';

import { artifacts } from './artifacts';
import { Etherscan } from './data-sources/etherscan';
import { ExchangeFillEvent } from './entities/ExchangeFillEvent';
import { config } from './ormconfig';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);

(async () => {
    const connection = await createConnection(config);
    const repository = connection.getRepository(ExchangeFillEvent);
    console.log(`found ${await repository.count()} existing fill events`);
    const eventLogs = await etherscan.getContractEventsAsync(
        '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        artifacts.Exchange.compilerOutput.abi,
    );
    for (const eventLog of eventLogs) {
        if (eventLog.event !== 'Fill') {
            continue;
        }
        const fillEventLog = eventLog as LogWithDecodedArgs<ExchangeFillEventArgs>;
        const exchangeFillEvent = new ExchangeFillEvent();
        exchangeFillEvent.logIndex = fillEventLog.logIndex as number;
        exchangeFillEvent.address = fillEventLog.address as string;
        exchangeFillEvent.rawData = fillEventLog.data as string;
        exchangeFillEvent.blockNumber = fillEventLog.blockNumber as number;
        exchangeFillEvent.makerAddress = fillEventLog.args.makerAddress.toString();
        exchangeFillEvent.takerAddress = fillEventLog.args.takerAddress.toString();
        exchangeFillEvent.feeRecepientAddress = fillEventLog.args.feeRecipientAddress;
        exchangeFillEvent.senderAddress = fillEventLog.args.senderAddress;
        exchangeFillEvent.makerAssetFilledAmount = fillEventLog.args.makerAssetFilledAmount.toString();
        exchangeFillEvent.takerAssetFilledAmount = fillEventLog.args.takerAssetFilledAmount.toString();
        exchangeFillEvent.makerFeePaid = fillEventLog.args.makerFeePaid.toString();
        exchangeFillEvent.takerFeePaid = fillEventLog.args.takerFeePaid.toString();
        exchangeFillEvent.orderHash = fillEventLog.args.orderHash;
        exchangeFillEvent.makerAssetData = fillEventLog.args.makerAssetData;
        exchangeFillEvent.takerAssetData = fillEventLog.args.takerAssetData;
        await repository.save(exchangeFillEvent);
    }
    console.log(`now ${await repository.count()} total fill events`);
})();
