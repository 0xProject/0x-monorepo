import { Connection, Repository } from 'typeorm';

import { OHLCVExternal } from '../entities';

export interface TradingPair {
  fromSymbol: string;
  toSymbol: string;
  latest: number;
}

interface StaticPair {
  fromSymbol: string;
  toSymbol: string;
}
/**
 * Get trading pairs with latest scraped time for OHLCV records
 * @param conn a typeorm Connection to postgres
 */
export async function getOHLCVTradingPairs(conn: Connection): Promise<TradingPair[]> {

  // @xianny todo replace with querying the db and joining with CC coin list
  const pairs = [
    {
      fromSymbol: 'ETH',
      toSymbol: 'USD',
    },
    {
      fromSymbol: 'ETH',
      toSymbol: 'EUR',
    },
    {
      fromSymbol: 'ETH',
      toSymbol: 'ZRX',
    },
  ];

  const repository = conn.getRepository(OHLCVExternal);
  const tradingPairsPromises = pairs.map(async pair => {
    const latest = await getLatestAsync(repository, pair);
    const tradingPair = {
      fromSymbol: pair.fromSymbol,
      toSymbol: pair.toSymbol,
      latest,
    };
    return tradingPair;
  });

  return Promise.all(tradingPairsPromises);
}

async function getLatestAsync(repository: Repository<OHLCVExternal>, pair: StaticPair): Promise<number> {
  // tslint:disable:custom-no-magic-numbers
  return new Date().getTime() - 6 * 24 * 60 * 60 * 1000; // < one week ago
  // const beginningOfTime = new Date('2010-09-01').getTime(); // the time when BTC/USD info starts appearing on Crypto Compare
  // const query = await repository.find({
  //   where: {
  //     fromSymbol: pair.fromSymbol,
  //     toSymbol: pair.toSymbol,
  //   },
  //   order: {
  //     endTime: 'DESC',
  //   },
  //   take: 1,
  // });
  // if (!query[0]) {
  //   return beginningOfTime;
  // }
  // return query[0].endTime;
}
