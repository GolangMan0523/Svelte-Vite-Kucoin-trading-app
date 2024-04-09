import { getPreciseQuanity } from '@src/helpers/trading'
import { updateState } from '@src/state/tabs_state'
import { global_state, updateGlobalState } from '@src/state/global_state'
import { get } from 'svelte/store'
import { toFixed } from '@src/helpers/helpers'
import { symbolDetails } from '@src/config/kucoin'
import Notificatoins from '@src/helpers/Notifications'
import getKC from '@src/library/kucoin-api/kucoin'

// getting --------------

/**
 * @param {TerminalState} state 
 */
export async function loadCandles(state) {
  try {
    const res = await (await getKC()).getKlines({symbol: `${state.token}-USDT`, type: state.chart.candles_timeframe, startAt: 1})

    if (res?.data?.length) {
      // @ts-ignore
      state.chart.candles = res.data.map(candle => candle.map(_ => parseFloat(_)))

      updateState(_state => {
        const t_state = _state.tabs.find((t_state) => t_state.componentState === state)

        if (t_state) {
          t_state.componentState.chart.candles = /** @type {ChartCandle[]} */ (res.data.map(candle => candle.map(_ => parseFloat(_))))
        }

        return _state
      }, true)
    }
  } catch (err) {
    console.error('loadCandles', err)
    Notificatoins.show({ text: `❌ Failed to load ${state.token} candles` })
  }
}

/**
 * @param {TerminalState} state 
 */
export async function loadOrderbook(state) {
  try {
    const res = await (await getKC()).getFullOrderBook(`${state.token}-USDT`)

    if (res?.data?.asks?.length || res?.data?.bids.length) {
      let new_asks = /** @type {OrderBook_List} */ ([])
      let new_bids = /** @type {OrderBook_List} */ ([])
      
      if (res.data.asks.length) {
        let best_price = +res.data.asks[0][0]

        new_asks = res.data.asks.map(entry => {
          const price = parseFloat(entry[0])
          if (price > best_price * 10) return; // custormer said no need more than 10x
          const size = parseFloat(entry[1])
          return [price, size]
        })
        new_asks = new_asks.filter(x => x).reverse()
      }

      if (res.data.bids.length) {
        new_bids = res.data.bids.map(entry => {
          return [parseFloat(entry[0]), parseFloat(entry[1])]
        })
      }

      updateState(_state => {
        const t_state = _state.tabs.find((t_state) => t_state.componentState === state)

        if (t_state) {
          t_state.componentState.orderbook.loaded_sequence = Number(res.data.sequence)
          t_state.componentState.orderbook.asks = new_asks
          t_state.componentState.orderbook.bids = new_bids
        }

        return _state
      }, true)
    }
  } catch (err) {
    console.error('loadOrderbook', err)
    Notificatoins.show({ text: `❌ Failed to load ${state.token} orderbook` })
  }
}

/**
 * @param {TerminalState} state 
 */
export async function loadRecentTrades(state) {
  try {
    const timer_name = 'getTradeHistories_' + state.token
    console.time(timer_name)
    const res = await (await getKC()).getTradeHistories(`${state.token}-USDT`)
    console.timeEnd(timer_name)

    if (res?.data?.length) {
      updateState(_state => {
        const t_state = _state.tabs.find((t_state) => t_state.componentState === state)

        if (t_state) {
          t_state.componentState.last_trades.trades = res.data.map(trade => ({
            price: parseFloat(trade.price),
            size: parseFloat(trade.size),
            isSell: trade.side === 'sell',
            timestamp: Number(String(trade.time).slice(0, 13)),
          })).reverse()
        }

        return _state
      }, true)
    }
  } catch (err) {
    console.error('loadRecentTrades', err)
    Notificatoins.show({ text: `❌ Failed to load ${state.token} recent trades` })
  }
}

export async function loadOrders() {
  try {
    console.time('getOrders')
    const res = await (await getKC()).getOrders({status: 'active', type: 'limit'})
    console.timeEnd('getOrders')

    /** @type {Orders} */
    let orders = []

    if (res?.data?.items?.length) {
      orders = res.data.items.map((order) => ({
        id: order.id,
        token: order.symbol.split('-')[0],
        isSell: order.side === 'sell',
        price: parseFloat(order.price),
        size: parseFloat(order.size),
        dealSize: parseFloat(order.dealSize),
        fee: parseFloat(order.fee),
        hidden: order.hidden,
        createdAt: order.createdAt,
      }))
    }

    updateGlobalState(_state => {
      _state.kucoin.activeOrders = orders
      return _state
    })
  } catch (err) {
    console.error('loadOrders', err)
    Notificatoins.show({ text: `❌ Failed to load open orders` })
  }
}

export async function loadBalance() {
  try {
    const res = await (await getKC()).getAccounts()
    /** @type {Balances} */
    const balance = {
      spot: {},
      funding: {}
    }

    res.data.forEach((item) => {
      // we don't need trade_hf or margin here
      const market_key = item.type === 'trade' ? 'spot' : item.type === 'main' ? 'funding' : ''

      if (market_key) {
        const total = parseFloat(item.balance)

        // kucoin sends empty available and balance equal to 0
        if (total) {
          balance[market_key][item.currency] = {
            total,
            available: parseFloat(item.available),
          }
        }
      }
    })
    
    updateGlobalState(_state => {
      _state.kucoin.balance = balance
      return _state
    })
  } catch (err) {
    console.error('loadBalance', err)
    Notificatoins.show({ text: `❌ Failed to load account balances` })
  }
}

// sbbing --------------

/**
 * @param {TerminalState} state
 * @return {Promise<Function>} unsubscribe cb
 */
export async function subscribeRecentTrades(state) {
  try {
    let last_order_id = ''
    let last_sequence = 0
    
    /** @type {LastTrades_Entry} */
    let last_order = {
      price: 0,
      size: 0,
      isSell: false,
      timestamp: 0
    }

    const symbol = `${state.token}-USDT`

    return (await getKC()).subscribe({topic: 'match', symbols: [symbol]}, (event) => {
      try {
        if (event?.data) {
          // @ts-ignore
          const data = JSON.parse(event.data)

          if (data.topic !== '/market/match:' + symbol || !data.data) return;

          const match = data.data
          const order_id = match.takerOrderId
          const sequence = parseFloat(match.sequence)

          if (sequence < last_sequence) return;

          const price = parseFloat(match.price)

          last_sequence = sequence

          if (last_order_id !== order_id) {
            last_order_id = order_id

            last_order = structuredClone({
              price,
              size: parseFloat(match.size),
              isSell: match.side === 'sell',
              timestamp: Number(String(match.time).slice(0, 13))
            })

            updateState(_state => {
              const t_state = _state.tabs.find((t_state) => t_state.componentState === state)

              if (t_state) {
                t_state.componentState.price = price
                t_state.componentState.last_trades.trades.unshift(last_order)

                if (t_state.componentState.last_trades.trades.length > 100) t_state.componentState.last_trades.trades.pop()
              }

              return _state
            }, true)
          } else {
            last_order.size = last_order.size + parseFloat(match.size)
            last_order.price = price
          }
        }
      } catch (err) {
        console.error('subscribeRecentTrades.match', err)
      }
    })
  } catch (err) {
    console.error('subscribeRecentTrades', err)
  }
}

/**
 * In here, I update the state only every 400ms because every smallest change in state triggers full redraw of the window :(
 * @param {TerminalState} state
 * @param {() => boolean} isActivePage
 * @param {() => boolean} isOrderBookLoaded
 * @return {Promise<Function[]>} unsubscribe cb
 */
export async function subscribeOrderbook(state, isActivePage, isOrderBookLoaded) {
  try {
    /**
     * @type {[number, getOrderBook_List, getOrderBook_List][]}
     */
    let cached_changes = []
    let fn_to_cancel = []

    const intervalId = setInterval(() => {
      if (!isActivePage() || !isOrderBookLoaded()) return;
      if (!cached_changes.length) return;

      let skipped_amount = 0
      cached_changes.forEach(([seq, asks, bids]) => {
        if (state.orderbook.loaded_sequence >= seq) {
          skipped_amount++
          return;
        }

        if (state.orderbook.ws_sequence > seq) return;

        state.orderbook.ws_sequence = seq

        asks.forEach((item) => {
          if (item[0] === '0') return;
          const size = parseFloat(item[1])
          const price = parseFloat(item[0])

          if (size) {
            addOrUpdate(state.orderbook.asks, price, size)
          }
          else {
            removeEntry(state.orderbook.asks, price)
          }
        })

        bids.forEach((item) => {
          if (item[0] === '0') return;
          const size = parseFloat(item[1])
          const price = parseFloat(item[0])

          if (size) {
            addOrUpdate(state.orderbook.bids, price, size)
          }
          else {
            removeEntry(state.orderbook.bids, price)
          }
        })
      })

      cached_changes = []

      updateState(_state => {
        return _state
      }, true)
    }, 400)

    fn_to_cancel.push(() => {
      cached_changes = []
      clearInterval(intervalId)
    })

    const symbol = `${state.token}-USDT`
    const subscribtion_cancel_cb = await (await getKC()).subscribe({topic: 'orderbook', symbols: [symbol]}, (event) => {
      try {
        if (event?.data) {
          // @ts-ignore
          const data = JSON.parse(event.data)

          if (data.topic !== '/market/level2:' + symbol || !data.data || !state) return;

          /** @type {kapi_OrderBook_Change} */
          const _data = data.data
          if (!_data?.changes) return;
          cached_changes.push([_data.sequenceEnd, _data.changes.asks, _data.changes.bids])
        }
      } catch (err) {
        console.error('OrderBook.orderbook', err)
      }
    })

    fn_to_cancel.push(subscribtion_cancel_cb)

    return fn_to_cancel
  } catch (err) {
    console.error('subscribeOrderbook', err)
  }

  /**
   * @param {OrderBook_List} orderBook 
   * @param {number} price 
   * @param {number} size 
   */
  function addOrUpdate(orderBook, price, size) {
    let index = binarySearch(orderBook, price);

    // If the price exists in the order book, update the size
    if (index !== -1) {
        orderBook[index][1] = size;
    } else {
        // If the price doesn't exist, find the index where the new entry should be inserted
        index = findInsertIndex(orderBook, price);
        // Insert the new entry at the appropriate index
        orderBook.splice(index, 0, [price, size]);
    }
  }

  /**
   * @param {OrderBook_List} orderBook 
   * @param {number} price
   */
  function removeEntry(orderBook, price) {
    // Find index of the entry with the specified price
    const index = binarySearch(orderBook, price);

    // If the price exists in the order book, remove the entry
    if (index !== -1) {
      orderBook.splice(index, 1)
    }
  }

  /**
   * @param {OrderBook_List} orderBook 
   * @param {number} price 
   */
  function findInsertIndex(orderBook, price) {
    let left = 0;
    let right = orderBook.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midPrice = orderBook[mid][0];

        if (midPrice === price) {
            // If the price exists, return the index where it should be inserted
            return mid;
        } else if (midPrice < price) {
            right = mid - 1; // Search in the left half
        } else {
            left = mid + 1; // Search in the right half
        }
    }

    // If the price doesn't exist, return the index where it should be inserted
    return left;
  }

  /**
   * @param {OrderBook_List} orderBook 
   * @param {number} price 
   */
  function binarySearch(orderBook, price) {
    let left = 0;
    let right = orderBook.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midPrice = orderBook[mid][0];

        if (midPrice === price) {
            return mid; // Found the price
        } else if (midPrice < price) {
            right = mid - 1; // Search in the left half
        } else {
            left = mid + 1; // Search in the right half
        }
    }

    return -1; // Price not found
  }
}

export async function subscribeOrders() {
  try {
    (await getKC()).subscribe({topic: 'orders'}, (event) => {
      try {
        if (event?.data) {
          // @ts-ignore
          const data = JSON.parse(event.data)

          if (data.subject !== 'orderChange' || !data.data) return;
          if (data.data.orderType !== 'limit') return;

          /** @type {wsOrderChange_open|wsOrderChange_match} */
          const change = data.data

          switch (change.type) {
            case 'open':
              /** @type {wsOrderChange_open} */
              // @ts-ignore
              const _change = change
              /** @type {Order} */
              const order = {
                id: _change.orderId,
                token: _change.symbol.split('-')[0],
                isSell: _change.side === 'sell',
                price: parseFloat(_change.price),
                size: parseFloat(_change.size),
                dealSize: 0,
                fee: 0,
                hidden: false,
                createdAt: _change.orderTime,
              }

              updateGlobalState(_state => {
                _state.kucoin.activeOrders.unshift(order)
                return _state
              })
              
              break;

            // todo: throttle the match case cuz there might be hundreds or match shit in one order :')
            case 'match':
              updateGlobalState(_state => {
                const order = _state.kucoin.activeOrders.find(order => order.id === change.orderId)

                if (order) { 
                  order.dealSize = parseFloat(change.filledSize)
                }

                return _state
              })
              break;

            case 'filled':
            case 'canceled':
              updateGlobalState(_state => {
                _state.kucoin.activeOrders = _state.kucoin.activeOrders.filter(order => order.id !== change.orderId)
                return _state
              })
              break;
          
            default:
              break;
          }
        }
      } catch (err) {
        console.error('subscribeOrders.depth50', err)
      }
    })
  } catch (err) {
    console.error('subscribeOrders', err)
  }
}

export async function subscribeBalance() {
  try {
    (await getKC()).subscribe({topic: 'balances'}, (event) => {
      try {
        if (event?.data) {
          // @ts-ignore
          const data = JSON.parse(event.data)

          if (data.subject !== 'account.balance' || !data.data) return;

          const change = data.data
          const token = change.currency
          const market_type = change.relationEvent.split('.')[0]

          if (market_type === 'main' || market_type === 'trade') {
            updateGlobalState(_state => {
              const local_name = market_type === 'main' ? 'funding' : 'spot'
              const stats = _state.kucoin.balance[local_name][token]

              if (stats) {
                stats.total = parseFloat(change.total)
                stats.available = parseFloat(change.available)
              } else {
                _state.kucoin.balance[local_name][token] = {
                  total: parseFloat(change.total),
                  available: parseFloat(change.available),
                }
              }

              return _state
            })
          }
        }
      } catch (err) {
        console.error('subscribeBalance.change', err)
      }
    })
  } catch (err) {
    console.error('subscribeBalance', err)
  }
}

/**
 * @param {{
 *  state: TerminalState
 *  sell_side: boolean
 *  on_percent?: number
 *  on_input?: {
 *    type: 'qty'|'price'|'value'
 *    value: number
 *  }
 * }} ops
 */
export function fix_form(ops) {
  const $global_state = get(global_state)

  const sell_side = ops.sell_side
  const buy_side = !sell_side
  const percent = ops.on_percent
  const limit_side = ops.state.form.limit_type
  const market_side = !limit_side

  const available_size = $global_state.kucoin.balance.spot[ops.state.token]?.available || 0
  const available_size_usdt = $global_state.kucoin.balance.spot.USDT?.available || 0

  if (percent) {
    if (limit_side) {
      // In order to have value fiels calculation, we will just fake on_input :D
      ops.on_input = { type: 'qty', value: 0 }

      if (sell_side && available_size) {
        ops.on_input.value = +getPreciseQuanity({token: ops.state.token, size: (percent === 100 ? available_size * 0.99 : available_size) * (percent / 100)})
      }

      if (buy_side && available_size_usdt && ops.state.form.limit_buy_price) {
        ops.on_input.value = +getPreciseQuanity({token: ops.state.token, size: ((percent === 100 ? available_size_usdt * 0.99 : available_size_usdt) * (percent / 100)) / ops.state.form.limit_buy_price})
      }

      // Forget about it
      if (!ops.on_input.value) delete ops.on_input
    }
    
    if (market_side) {
      if (sell_side && available_size) {
        const size = ((percent === 100 ? available_size * 0.99 : available_size) * (percent / 100))
        ops.state.form.market_sell_qty = +getPreciseQuanity({token: ops.state.token, size})
      }

      if (buy_side && available_size_usdt) {
        const size = ((percent === 100 ? available_size_usdt * 0.99 : available_size_usdt) * (percent / 100))
        ops.state.form.market_buy_qty = +getPreciseQuanity({token: ops.state.token, size: +size.toFixed(2)})
      }
    }
  }

  if (ops.on_input) {
    if (market_side) {
      if (ops.on_input.type === 'qty') {
        ops.state.form[sell_side ? 'market_sell_qty' : 'market_buy_qty'] = ops.on_input.value
      }
      return;
    }

    const price_key = sell_side ? 'limit_sell_price' : 'limit_buy_price'
    const qty_key = sell_side ? 'limit_sell_qty' : 'limit_buy_qty'
    const value_key = sell_side ? 'limit_sell_value' : 'limit_buy_value'
    const calc_qty = () => +getPreciseQuanity({token: ops.state.token, size: ops.state.form[value_key] / ops.state.form[price_key]}) || undefined
    const calc_value = () => +(toFixed(ops.state.form[qty_key] * ops.state.form[price_key], 2)) || undefined
    
    switch (ops.on_input.type) {
      case 'price':
        ops.state.form[price_key] = ops.on_input.value

        if (ops.state.form[qty_key]) {
          ops.state.form[value_key] = calc_value()
        }

        else if (ops.state.form[value_key]) {
          ops.state.form[qty_key] = calc_qty()
        }
      break;

      case 'qty':
        ops.state.form[qty_key] = ops.on_input.value

        if (ops.state.form[price_key]) {
          ops.state.form[value_key] = calc_value()
        }
        break;

      case 'value':
        ops.state.form[value_key] = ops.on_input.value

        if (ops.state.form[price_key]) {
          ops.state.form[qty_key] = calc_qty()
        }
        break;
    
      default:
        break;
    }
  }
}

/**
 * @param {Partial<TerminalState>} payload
 * @returns {TerminalState}
 */
export function getDefaultTerminalState(payload = {}) {
  /** @type {TerminalState} */
  const defaultState = {
    token: null,
    price: 0,

    isKucoin: true,
  
    chart: {
      candles: [],
      candles_timeframe: '15min'
    },

    last_trades: {
      trades: []
    },

    orderbook: {
      ws_sequence: 0,
      loaded_sequence: 0,
      active_step: 0,
      asks: [],
      bids: [],
    },

    form: {
      limit_type: true,
    },
  }

  /** @type {TerminalState} */
  const terminal_state = { ...defaultState, ...payload }
  return terminal_state
}

export function getSteps(token) {
  let precision = symbolDetails[token].pricePrecision
  let steps = 1;
  let i = 0;

  while (i < precision) {
      steps = steps / 10;
      i++;
  }

  return [steps, steps * 10, steps * 100, steps * 1000, steps * 10000].map(num => Number(num.toFixed(precision)))
}