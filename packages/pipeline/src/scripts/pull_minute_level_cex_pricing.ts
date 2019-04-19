import { Connection, ConnectionOptions, createConnection, EntityManager, Timestamp } from 'typeorm';
import * as ormConfig from '../ormconfig';
import { ExchangeObservations } from '../entities/price_data';
import axios from 'axios';
import { ExchangeEventsSource } from '../data_sources/contract-wrappers/exchange_events';


const CRYPTOCOMPARE_API_KEY = process.env[0]
const ONE_DAY_IN_MS = 3600 * 24 * 1000
function getCryptoCompareURL(market: Market, limit: number = 2000): string {
    return `https://min-api.cryptocompare.com/data/histominute?fsym=${market.base}&tsym=${market.quote}&e=${market.exchange}&limit=${limit}&api_key=${CRYPTOCOMPARE_API_KEY}`
}

interface Market {
    base: string
    quote: string
    exchange: string
}

interface PriceObservations {
    timestamp: Date
    exchange: string
    base: string
    quote: string
    open?: number
    close?: number
    high?: number
    low?: number
    volumeFrom?: number
    volumeTo?: number
    highestBig?: number
    lowerAsk?: number
    other?: object
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

const pairsToETL: Market[] = [
    {base: "ETH", quote: "USDC", exchange: "Binance"},
    {base: "ETH", quote: "USDT", exchange: "Binance"},
    {base: "BAT", quote: "ETH", exchange: "Binance"},
    {base: "ETH", quote: "USDC", exchange: "Poloniex"},
    {base: "ETH", quote: "USDT", exchange: "Poloniex"},
    {base: "BAT", quote: "ETH", exchange: "Poloniex"},
]


function getYesterdayBounds(): [number, number] {
    const currentDay = new Date(new Date().toUTCString())
    const yesterday = new Date(currentDay.getTime() - ONE_DAY_IN_MS)
    const lowerBound = yesterday.setUTCHours(0, 0, 0, 0)
    const upperBound = yesterday.setUTCHours(23,59,59,999)
    return [lowerBound / 1000, upperBound / 1000]
}

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

    let loadFailed = false;
    let results: ExchangeObservations[] = []

    for (let i = 0; i < pairsToETL.length; i++) {
        let pair = pairsToETL[i]
        let url = getCryptoCompareURL(pair)
        let response = await axios.get(url)
        if (response.status != 200) {
            console.error(`API response for market ${JSON.stringify(pair)} returned status code ${response.status}`)
            loadFailed = true
        }
        if (response.data.Response != 'Success') {
            console.error(`API response for market ${JSON.stringify(pair)} returned response ${response.data.Response}`)
            loadFailed = true
        }
        if (loadFailed) {
            break
        }

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

    if (loadFailed) {
        console.error("One or more loads failed. Exiting")
        return
    }
    
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