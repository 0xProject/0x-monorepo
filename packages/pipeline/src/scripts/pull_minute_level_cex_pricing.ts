import { Connection, ConnectionOptions, createConnection, EntityManager, Timestamp } from 'typeorm';
import * as ormConfig from '../ormconfig';
import { ExchangeObservations } from '../entities/price_data';
import axios from 'axios';

const ONE_DAY_IN_MS = 3600 * 24 * 1000

interface Market {
    base: string
    quote: string
    exchange: string
}

interface CryptoCompareOHLCVData {
    time: number
    close: number
    high: number
    low: number
    open: number
    volumefrom: number
    volumeto: number
}

/**
 * Returns the current CryptoCompare URL required to fetch OHLCV data 
 * 
 * @param market a market instance that is compatible with CryptoCompare
 * @param limit a positive integer that represents hany results you want back 
 */
function getCryptoCompareURL(market: Market, limit: number = 2000): string {
    return `https://min-api.cryptocompare.com/data/histominute?fsym=${market.base}&tsym=${market.quote}&e=${market.exchange}&limit=${limit}`
}

/**
 * Other possible markets can be found at https://min-api.cryptocompare.com/documentation?key=Other&cat=allExchangesV2Endpoint
 */
const pairsToETL: Market[] = [
    {base: "ETH", quote: "USDC", exchange: "Binance"},
    {base: "ETH", quote: "USDT", exchange: "Binance"},
    {base: "BAT", quote: "ETH", exchange: "Binance"},
    {base: "ETH", quote: "USDC", exchange: "Poloniex"},
    {base: "ETH", quote: "USDT", exchange: "Poloniex"},
    {base: "BAT", quote: "ETH", exchange: "Poloniex"},
]

/**
 * Returns the first and last UNIX epoch of the previous day
 * 
 * Example, if the current unix epoch is 1555714553 (Friday, April 19, 2019 10:55:53 PM) then
 * this function will return, in order: [
 *     1555545600 (Thursday, April 18, 2019 12:00:00 AM),
 *     1555631999 (Thursday, April 18, 2019 11:59:59 )
 * ]
 */
function getYesterdayBounds(): [number, number] {
    const currentDay = new Date(new Date().toUTCString())
    const yesterday = new Date(currentDay.getTime() - ONE_DAY_IN_MS)
    const lowerBound = yesterday.setUTCHours(0, 0, 0, 0)
    const upperBound = yesterday.setUTCHours(23,59,59,999)
    return [lowerBound / 1000, upperBound / 1000]
}

/**
 * Returns a exchange observation that can be persisted to Postgres
 * 
 * @param market the market from where the `data` comes from
 * @param data a list of OHLCV data
 */
function makeExchangeObservations(market: Market, data: CryptoCompareOHLCVData[]): ExchangeObservations[] {
    return data.map(item => {
        let observation = new ExchangeObservations()
        observation.timestamp = new Date(item.time * 1000)
        observation.exchange = market.exchange
        observation.base = market.base
        observation.quote = market.quote
        observation.open = item.open
        observation.close = item.close
        observation.high = item.high
        observation.low = item.low
        observation.volumeFrom = item.volumefrom
        observation.volumeTo = item.volumeto
        return observation;
    })
}


async function main(connection: Connection): Promise<void> {

    let results: ExchangeObservations[] = []

    for (let i = 0; i < pairsToETL.length; i++) {
        let pair = pairsToETL[i]
        let url = getCryptoCompareURL(pair)
        let response = await axios.get(url)

        if (response.status != 200) {
            console.error(`API response for market ${JSON.stringify(pair)} returned status code ${response.status}`)
            return;
        }
        if (response.data.Response != 'Success') {
            console.error(`API response for market ${JSON.stringify(pair)} returned response ${response.data.Response}`)
            return;
        }

        // For any given day, we only want to only persist results that represent the last full day.
        let ohlcvData = response.data.Data as CryptoCompareOHLCVData[]
        const [lowerBound, upperBound] = getYesterdayBounds()
        ohlcvData.sort((first, second) => {
            return first.time < second.time ? -1: 1
        })
        const filteredOrderTimes = ohlcvData.filter((order) => {
            return (order.time >= lowerBound) && (order.time <= upperBound)
        })
        const observations = makeExchangeObservations(pair, filteredOrderTimes)
        results = results.concat(observations)
        console.info(`Fetched ${filteredOrderTimes.length} rows for market ${JSON.stringify(pair)}`)
    }
    
    // Persist all the results to Postgres
    const repository = connection.getRepository(ExchangeObservations);
    await repository.save(results)
}

(async () => {
    const connection = await createConnection(ormConfig as ConnectionOptions);
    try {
        await main(connection)
    } finally {
        await connection.close()
    }

})()