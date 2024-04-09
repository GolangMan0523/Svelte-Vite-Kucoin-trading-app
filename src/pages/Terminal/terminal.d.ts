type LastTrades_Entry = {
  price: number;
  size: number;
  isSell: boolean;
  timestamp: number;
}

type LastTrades_List = LastTrades_Entry[]

type ChartCandle = [
  number, // 0 Start time of the candle cycle
  number, // 1 open price
  number, // 2 close price
  number, // 3 high price
  number, // 4 low price
  number, // 5 Transaction volume
  number, // 6 Transaction amount
]

type OrderBook_Entry = [
  number, // price
  number, // size
]

type OrderBook_EntryTotal = [
  number, // price
  number, // size
  number, // total
]

type OrderBook_List = OrderBook_Entry[]
type OrderBook_ListTotal = OrderBook_EntryTotal[]

type Order = {
  id: string
  token: string
  isSell: boolean
  price: number
  size: number
  dealSize: number
  fee: number
  hidden: boolean
  createdAt: number
}

type Orders = Order[]

type Balance = {
  [token: string]: {
    total: number
    available: number
  }
}

type Balances = {
  spot: Balance
  funding: Balance
}

type TerminalState = {
  token: string|null;
  price: number;

  isKucoin: boolean;

  chart: {
    candles: ChartCandle[]
    candles_timeframe: candle_format
  },

  last_trades: {
    trades: LastTrades_List
  },

  orderbook: {
    ws_sequence: number
    loaded_sequence: number
    active_step: 0|1|2|3
    asks: OrderBook_List,
    bids: OrderBook_List,
  },

  form: {
    limit_type: boolean
    
    limit_buy_price?: number
    limit_buy_value?: number
    limit_buy_qty?: number

    limit_sell_price?: number
    limit_sell_qty?: number
    limit_sell_value?: number

    market_buy_qty?: number
    market_sell_qty?: number
  }
}