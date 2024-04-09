import { getClient, Body } from "@tauri-apps/api/http"

const baseURL = 'https://api.kucoin.com'

export function topics(topic, symbols = [], endpoint = false, sign = false) {
    if ( endpoint ) return [topic, endpoint + ( symbols.length > 0 ? ':' : '' ) + symbols.join( ',' ), sign ? 'private' : 'public']
    if ( topic === 'ticker' ) {
        return [topic, "/market/ticker:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'allTicker' ) {
        return [topic, "/market/ticker:all", 'public']
    } else if ( topic === 'symbolSnapshot' ) {
        return [topic, "/market/snapshot:" + symbols[0], 'public']
    } else if ( topic === 'marketSnapshot' ) {
        return [topic, "/market/snapshot:" + symbols[0], 'public']
    } else if ( topic === 'orderbook' ) {
        return [topic, "/market/level2:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'match' ) {
        return [topic, "/market/match:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'fullMatch' ) {
        return [topic, "/spotMarket/level3:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'orders' ) {
        return [topic, "/spotMarket/tradeOrders", 'private']
    } else if ( topic === 'balances' ) {
        return [topic, "/account/balance", 'private']
    } else if ( topic === 'depth50' ) {
        return [topic, "/spotMarket/level2Depth50:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'depth5' ) {
        return [topic, "/spotMarket/level2Depth5:" + symbols.join( ',' ), 'public']
    } else if ( topic === 'advancedOrders' ) {
        return [topic, "/spotMarket/advancedOrders", 'private']
    } else if ( topic.startsWith('candles') ) { // candles_5min
      return [topic, `/market/candles:${symbols[0]}_${topic.split('_')[1]}`, 'public']
    }
}

async function getPublicWsToken() {
  const client = await getClient()
  let endpoint = '/api/v1/bullet-public'
  return (await client.post(baseURL + endpoint)).data
}

async function getPrivateWsToken(sign) {
  const client = await getClient()
  let endpoint = '/api/v1/bullet-private'
  return (await client.post(baseURL + endpoint, Body.json({}), sign)).data
}

export  async function getSocketEndpoint(isPrivate, sign) {
  if (isPrivate) {
    let r = await getPrivateWsToken(sign)
    let token = r.data.token
    let instanceServer = r.data.instanceServers[0]

    if (instanceServer) {
      return `${instanceServer.endpoint}?token=${token}&[connectId=${Date.now()}]`
    } else {
      throw Error("No Kucoin WS servers running")
    }
  } else {
    let r = await getPublicWsToken()
    let token = r.data.token
    let instanceServer = r.data.instanceServers[0]

    if (instanceServer) {
      return `${instanceServer.endpoint}?token=${token}&[connectId=${Date.now()}]`
    } else {
      throw Error("No Kucoin WS servers running")
    }
  }
}