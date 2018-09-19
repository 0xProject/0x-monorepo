import { Etherscan } from './data-sources/etherscan';

import { artifacts } from './artifacts';

const etherscan = new Etherscan(process.env.ETHERSCAN_API_KEY as string);

(async () => {
    const events = await etherscan.getContractEventsAsync(
        '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        artifacts.Exchange.compilerOutput.abi,
    );
    console.log(events);
})();
