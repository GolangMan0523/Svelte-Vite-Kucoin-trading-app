type getTradeHistories_Entry = {
  sequence: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  time: number;
}
type getTradeHistories_List = getTradeHistories_Entry[]

type getKlines_Entry = [
  string, // 0 Start time of the candle cycle
  string, // 1 open price
  string, // 2 close price
  string, // 3 high price
  string, // 4 low price
  string, // 5 Transaction volume
  string, // 6 Transaction amount
]
type getKlines_List = getKlines_Entry[]

type kapi_OrderBook_Entry = [
  string, // 0 price
  string, // 1 size
]
type getOrderBook_List = kapi_OrderBook_Entry[]

type kapi_OrderBook_Change = {
  changes: {
    asks: getOrderBook_List
    bids: getOrderBook_List
  }
  sequenceEnd: number
  sequenceStart: number
  symbol: string
  time: number
}

type candle_format = '1min'|'3min'|'5min'|'15min'|'30min'|'1hour'|'2hour'|'4hour'|'6hour'|'8hour'|'12hour'|'1day'|'1week'

type wsOrderChange_open =  {
  symbol: string
  orderType: string
  side: string
  orderId: string
  type: string
  orderTime: number
  size: string
  filledSize: string
  price: string
  clientOid: string
  remainSize: string
  status: string
  ts: number
}

type wsOrderChange_match =  {
  clientOid: string
  filledSize: string
  funds: string
  liquidity: string
  matchPrice: string
  matchSize: string
  orderId: string
  orderTime: number
  orderType: string
  remainFunds: string
  side: string
  status: string
  symbol: string
  tradeId: string
  ts: number
  type: string
}