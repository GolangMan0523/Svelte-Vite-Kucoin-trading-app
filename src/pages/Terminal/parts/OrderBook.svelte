<script>
  import { getPrecisePrice, getPreciseQuanity } from "@helpers/trading"
  import { abbreviateNumber } from "@src/helpers/helpers"
  import { updateState } from '@src/state/tabs_state'
  import { fix_form, getSteps } from '../terminal.fn'
  import Select from 'svelte-select'
  
  /** @type {TerminalState} */
  export let state
  
  let steps = getSteps(state.token)
  let select_items = steps.map(x=>String(x))
  let asks_node
  let bids_node
  let scrolled = false
  let processed_asks = /** @type {OrderBook_ListTotal} */ ([])
  let processed_bids = /** @type {OrderBook_ListTotal} */ ([])
  let price = /** @type {string|number} */ (0)

  $: {
    processed_asks = aggregateOrderBook([...state.orderbook.asks].reverse(), steps[state.orderbook.active_step], state.orderbook.active_step)
    processed_bids = aggregateOrderBook([...state.orderbook.bids], steps[state.orderbook.active_step], state.orderbook.active_step)

    if (state.orderbook.asks.length) {
      if (!scrolled && asks_node) {
        scrolled = true
        resetAsksPosition()
        setTimeout(() => {
          resetAsksPosition()
        }, 0)
      }
    }

    price = state.price
      ? getPrecisePrice({token: state.token, price: state.price})
      : state.orderbook.asks[0] && state.orderbook.bids[0]
        ? getPrecisePrice({token: state.token, price: (state.orderbook.asks[state.orderbook.asks.length - 1][0] + state.orderbook.bids[0][0]) / 2})
        : ''
  }

  /**
   * @param {OrderBook_List} orders
   * @param {number} step
   * @returns {OrderBook_ListTotal}
   */
  function aggregateOrderBook(orders, step, stepIndex) {
    const aggregatedMap = new Map()
    
    let i = 0
    let total_usdt = 0
    // we don't need a lot on low perc. and unlimited on higher perc.
    let total_amount = stepIndex < 2 ? 100 : stepIndex === 2 ? 200 : 9999

    orders.forEach((item) => {
      const size = item[1]
      if (!size) return;
      if (i > total_amount) return;
      
      const _price = item[0]
      // const price = isReversed ? Math.floor(_price / step) * step : Math.ceil(_price / step) * step // wtf, it causes incorrect prices, opps beeehh :P
      // this could be the reason of a incorrectness in order bug due to floating point shit 0.19691000000000003
      const price = Math.ceil(_price / step) * step

      total_usdt += size

      if (aggregatedMap.has(price)) {
        const [aggregatedSize] = aggregatedMap.get(price)
        aggregatedMap.set(price, [aggregatedSize + size, total_usdt])
      } else {
        i++
        aggregatedMap.set(price, [size, total_usdt])
      }
    })

    const aggregatedOrders = Array.from(aggregatedMap.entries()).map(([price, [size, totalSize]]) => [price, size, totalSize])
    aggregatedOrders.sort((a, b) => a[0] - b[0]).reverse()

    // @ts-ignore
    return aggregatedOrders;
  }

  function resetAsksPosition(params) {
    if (asks_node) {
      asks_node.scrollTop = asks_node.scrollHeight
    }
  }

  function selectPrice(e) {
    fix_form({state, sell_side: !!e.target.closest('[data-price]').hasAttribute('data-is-sell'), on_input: {
      value: e.target.closest('[data-price]').getAttribute('data-price'),
      type: 'price',
    }})
    updateState(_state => _state)
  }

  function select_changed(smth) {
    updateState(_state => {
      _state.tabs[_state.activeTab].componentState.orderbook.active_step = smth.detail.index      
      return _state
    })

    resetAsksPosition()
    setTimeout(() => {
      resetAsksPosition()
    }, 0)
  }
</script>

<div class="order-book">
  <div class="order-book-asks" bind:this={asks_node}>
    {#each processed_asks as ask}
    <div class="order-book-row" data-is-sell data-price={getPrecisePrice({token: state.token, price: ask[0]})} on:click={selectPrice} on:keydown={selectPrice}>
      <span class="order-book-row__price">{getPrecisePrice({token: state.token, price: ask[0]})}</span>
      <span class="order-book-row__size">{ask[1] > 1000 ? abbreviateNumber(ask[1]) : getPreciseQuanity({token: state.token, size: ask[1]})}</span>
      <span class="order-book-row__tsize">{ask[2] > 1000 ? abbreviateNumber(ask[2]) : getPreciseQuanity({token: state.token, size: ask[2]})}</span>
    </div>
    {/each}
  </div>
  <div class="order-book-middle">
    <div class="order-book-middle__price">{price}</div>
    <div class="this_fucking_select_wrap">
      <Select class="this_fucking_select" items={select_items} clearable={false} searchable={false} value={select_items[state.orderbook.active_step]} on:change={select_changed}></Select>
    </div>
  </div>
  <div class="order-book-bids" bind:this={bids_node}>
    {#each processed_bids as bid}
    <div class="order-book-row" data-price={getPrecisePrice({token: state.token, price: bid[0]})} on:click={selectPrice} on:keydown={selectPrice}>
      <span class="order-book-row__price">{getPrecisePrice({token: state.token, price: bid[0]})}</span>
      <span class="order-book-row__size">{bid[1] > 1000 ? abbreviateNumber(bid[1]) : getPreciseQuanity({token: state.token, size: bid[1]})}</span>
      <span class="order-book-row__tsize">{bid[2] > 1000 ? abbreviateNumber(bid[2]) : getPreciseQuanity({token: state.token, size: bid[2]})}</span>
    </div>
    {/each}
  </div>
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .order-book {
    width: calc(50% - 1px);
    min-width: calc(50% - 1px);
    max-width: calc(50% - 1px);
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    background-color: #121212;
    font-weight: 500;
    font-size: 14px;
    border-right: 1px solid $main_borders_color;
  }

  .order-book-asks, .order-book-bids {
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;
    padding: 0 10px;
  }

  .order-book-asks {
    padding-top: 10px;
    .order-book-row__price {
      color: $red;
    }

    .order-book-row:first-child {
      margin-top: auto;
    }
  }

  .order-book-middle {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 10px;

    &__price {
      font-size: 20px;
      font-weight: 700;
    }
  }

  .order-book-bids {
    padding-bottom: 10px;
    
    .order-book-row__price {
      color: $green;
    }
  }

  .order-book-row {
    display: flex;
    cursor: pointer;

    &__price {
      width: 30%;
    }
    
    &__size {
      width: 35%;
      text-align: right;
    }
    
    &__tsize {
      width: 35%;
      text-align: right;
    }

    &:hover {
      background-color: lighten($color: #121212, $amount: 4);
    }
  }

  // fucking select lol)))
  .this_fucking_select_wrap {
    margin-left: auto;
  }
</style>