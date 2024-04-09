import qs from 'qs'
import CryptoJS from 'crypto-js';
import WebSocket from "tauri-plugin-websocket-api"
import { getClient, Body } from "@tauri-apps/api/http"
import {topics, getSocketEndpoint} from './websockets'
import Notificatoins from '@src/helpers/Notifications';
import { settings_state } from '@src/state/settings_state';
import { get } from 'svelte/store';
import { sleep } from '@src/helpers/helpers';

let active_public_ws = /** @type {WebSocket|null} */ (null)
let active_private_ws = /** @type {WebSocket|null} */ (null)
let ws_connecting_in_process = false
let ws_connecting_promise = null

const Kucoin = {
  init: function(config) {
    let url = 'https://api.kucoin.com'
    this.environment = config.environment
    this.baseURL = url
    this.secretKey = config.secretKey
    this.apiKey = config.apiKey
    this.passphrase = config.passphrase
  },
  sign: function(endpoint, params, method) {
    let header = {
      headers: {}
    }
    let nonce = Date.now().toString()
    let strForSign = null
    if (method === 'GET' || method === 'DELETE') {
      strForSign = nonce + method + endpoint + this.formatQuery(params)
    } else {
      // these niggers just fucking sort the object WTF???? I lost 7 hours debugging it
      const I_FUCKING_HATE_TAURI = {}
      Object.keys(params).sort().forEach((key) => {
        I_FUCKING_HATE_TAURI[key] = params[key]
      })

      strForSign = nonce + method + endpoint + JSON.stringify(I_FUCKING_HATE_TAURI)
    }

    let signatureResult = CryptoJS.HmacSHA256(strForSign, this.secretKey).toString(CryptoJS.enc.Base64);
    // let passphraseResult = CryptoJS.HmacSHA256(this.passphrase, this.secretKey).toString(CryptoJS.enc.Base64);

    header.headers['Content-Type'] = 'application/json'
    header.headers['KC-API-KEY'] = this.apiKey
    header.headers['KC-API-SIGN'] = signatureResult
    header.headers['KC-API-PASSPHRASE'] = this.passphrase
    header.headers['KC-API-TIMESTAMP'] = nonce
    // header.headers['KC-API-KEY-VERSION'] = "2"

    return header
  },
  formatQuery: function(queryObj) {
    if (JSON.stringify(queryObj).length !== 2) {
      return '?' + qs.stringify(queryObj)
    } else {
      return ''
    }
  },

  // websockets - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  initSockets: async function() {
    try {
      if (ws_connecting_in_process) return await ws_connecting_promise
      
      console.log('[Kucion.initSockets] Establishing websockets')

      ws_connecting_in_process = true

      ws_connecting_promise = new Promise(async (res, rej) => {
        console.time('initSockets')

        const [pub_ws_url, prv_ws_url] = await Promise.all([
          getSocketEndpoint(),
          getSocketEndpoint(true, this.sign('/api/v1/bullet-private', {}, 'POST')),
        ])

        const [pub_ws, prv_ws] = await Promise.all([
          WebSocket.connect(pub_ws_url),
          WebSocket.connect(prv_ws_url),
        ])

        if (pub_ws) {
          setInterval(() => {
            pub_ws.send(
              JSON.stringify({
                id: Date.now(),
                type: "ping",
                response: false,
              })
            )
          }, 10000)
  
          active_public_ws = pub_ws
        }
  
        if (prv_ws) {
          setInterval(() => {
            prv_ws.send(
              JSON.stringify({
                id: Date.now(),
                type: "ping",
                response: false,
              })
            )
          }, 10000)
  
          active_private_ws = prv_ws
        }

        Notificatoins.show({ text: pub_ws && prv_ws ? '✅ Connection established' : '❌ Failed to connect' })

        console.timeEnd('initSockets')
        res(true)
      })
  
      return await ws_connecting_promise
    } catch (err) {
      console.error('[Kucion.initSockets] error:', err)
      Notificatoins.show({ text: '❌ Failed to connect' })
    }
  },

  /**
   * 
   * @param {{topic: string, symbols?: string[]}} params 
   * @param {(arg: import('tauri-plugin-websocket-api').Message) => void} cb
   * @return {Promise<Function>} unsubscribe cb
   */
  subscribe: async function(params, cb) {
    try {
      if (!active_public_ws || !active_private_ws) {
        await this.initSockets()
      }

      console.log(`[Kucion.subscribe] Subbing to topic "${params.topic}${params.symbols ? `[${params.symbols}]` : ''}"`)
  
      let [_, endpoint, type] = topics(params.topic, params.symbols, false, false)
      
      if (type === 'private') {
        active_private_ws.send(JSON.stringify({
          id: Date.now(),
          type: 'subscribe',
          topic: endpoint,
          privateChannel: true,
          response: true
        }))
        
        active_private_ws.addListener(cb)
      } else {
        active_public_ws.send(JSON.stringify({
          id: Date.now(),
          type: 'subscribe',
          topic: endpoint,
          response: true
        }))
  
        active_public_ws.addListener(cb)
      }

      return () => {
        console.log(`[Kucion.subscribe] Unsubbing from topic "${params.topic}${params.symbols ? `[${params.symbols}]` : ''}"`)
        // issue with this is that it is indeed unsubscribes from kucoin topic, BUT it seems that I can not unsubscribe after Websocket.addListener ...
        // I will add only one top-level addListener later i guess.
        if (type === 'private') {
          active_private_ws.send(JSON.stringify({
            id: Date.now(),
            type: 'unsubscribe',
            topic: endpoint,
            privateChannel: true,
            response: true
          }))
        } else {
          active_public_ws.send(JSON.stringify({
            id: Date.now(),
            type: 'unsubscribe',
            topic: endpoint,
            response: true
          }))
        }
      }
    } catch (_err) {
      console.error('this.subscribe_v2', _err)
    }
  },

  // PUBLIC ENDPOINTS - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * @param {string} symbol 
   * @returns {Promise<{code: string, data?: getTradeHistories_List}>}
   */
  getTradeHistories: async function(symbol) {
    let endpoint = `/api/v1/market/histories?symbol=${symbol}`
    return (await (await getClient()).get(this.baseURL + endpoint)).data
  },

  /**
   * @param {{
   *  symbol: string,
   *  startAt?: number,
   *  endAt?: number,
   *  type: candle_format
   * }} params
   * @returns {Promise<{code: string, data?: getKlines_List}>}
   */
  getKlines: async function(params) {
    let endpoint = '/api/v1/market/candles'
    let url = this.baseURL + endpoint + this.formatQuery(params)
    return (await (await getClient()).get(url)).data
  },

  /**
   * @param {{
   *  amount: 20|100,
   *  symbol: string,
   * }} params
   * @returns {Promise<{code: string, data?: {asks: getOrderBook_List, bids: getOrderBook_List, sequence: string, time: number}}>}
   */
  getPartOrderBook: async function(params) {
    let endpoint = `/api/v1/market/orderbook/level2_${params.amount}?symbol=${params.symbol}`
    return (await (await getClient()).get(this.baseURL + endpoint)).data
  },

  // PRIVATE ENDPOINTS - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  /**
   * @param {string} symbol 
   * @returns {Promise<{code: string, data?: {asks: getOrderBook_List, bids: getOrderBook_List, sequence: string, time: number}}>}
   */
  getFullOrderBook: async function(symbol) {
    let endpoint = `/api/v3/market/orderbook/level2?symbol=${symbol}`
    return (await (await getClient()).get(this.baseURL + endpoint, this.sign(endpoint, {}, 'GET'))).data
  },

  /**
   * @returns {Promise<{code: string, data?: any}>}
   */
  getAccounts: async function() {
    let endpoint = '/api/v1/accounts'
    return (await (await getClient()).get(this.baseURL + endpoint, this.sign(endpoint, {}, 'GET'))).data
  },

  /**
   * @param {{
   *  clientOid: string
   *  side: 'buy'|'sell'
   *  symbol: string
   *  type: 'limit'|'market'
   *  remark?: string
   *  stop?: string
   *  stopPrice?: string
   *  stp?: string
   *  price?: string,
   *  size?: string,
   *  funds?: string,
   *  timeInForce?: string
   *  cancelAfter?: number
   *  hidden?: boolean
   *  iceberg?: boolean
   *  visibleSize?: string
   * }} params
   * @returns {Promise<{code: string, data?: any}>}
   */
  placeOrder: async function(params) {
    let endpoint = `/api/v1/orders`
    const client = await getClient()
    return (await client.post(this.baseURL + endpoint, Body.json(params), this.sign(endpoint, params, 'POST'))).data
  },

  /**
    * @param {{
    *  status?: string
    *  symbol?: string
    *  type?: 'limit'|'limit_stop'|'market_stop'
    *  side?: 'buy'|'sell'
    *  startAt?: string
    *  stopPrice?: number
    *  endAt?: number
    * }} params
    * @returns {Promise<{code: string, data?: {currentPage: number, pageSize: number, totalNum: number, totalPage: number, items: {
    *   id: string
    *   symbol: string
    *   opType: string
    *   type: string
    *   side: string
    *   price: string
    *   size: string
    *   funds: string
    *   dealFunds: string
    *   dealSize: string
    *   fee: string
    *   feeCurrency: string
    *   stp: string
    *   stop: string
    *   stopTriggered: boolean
    *   stopPrice: string
    *   timeInForce: string
    *   postOnly: boolean
    *   hidden: boolean
    *   iceberg: boolean
    *   visibleSize: string
    *   cancelAfter: number
    *   channel: string
    *   clientOid: string
    *   remark: any
    *   tags: any
    *   isActive: boolean
    *   cancelExist: boolean
    *   createdAt: number
    *   tradeType: string
    * }[]}}>}
    */
  getOrders: async function (params = {}) {
    let endpoint = '/api/v1/orders'
    const client = await getClient()
    
    return (await client.get(this.baseURL + endpoint + this.formatQuery(params), this.sign(endpoint, params, 'GET'))).data
  },
  
  /**
   * @param {{ id: string }} params
   * @returns {Promise<{code: string, data?: any}>}
   */
  cancelOrder: async function(params) {
    let endpoint = '/api/v1/orders/' + params.id
    delete params.id
    const client = await getClient()
    return (await client.delete(this.baseURL + endpoint, this.sign(endpoint, params, 'DELETE'))).data
  }
}

/**
 * LEL this function is cringe
 * @returns 
 */
export default async function getKC() {
  const attempt = () => {
    const settings = get(settings_state)

    if (settings.kucoin.api_keys) {
      const [apiKey, secretKey, passphrase] = settings.kucoin.api_keys.split('|')

      Kucoin.init({
        apiKey,
        secretKey,
        passphrase,
        environment: 'live',
      })

      return Kucoin
    } else {
      return null
    }
  }

  let result = attempt()

  if (result) {
    return result
  } else {
    await sleep(100)
  }

  result = attempt()

  if (result) {
    return result
  } else {
    await sleep(100)
  }

  result = attempt()

  if (result) {
    return result
  }

  Kucoin.init({
    apiKey: '',
    secretKey: '',
    passphrase: '',
    environment: 'live',
  })

  return Kucoin
}