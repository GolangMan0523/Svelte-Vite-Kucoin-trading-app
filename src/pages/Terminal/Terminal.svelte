<script>
  import { onDestroy, onMount, tick } from 'svelte'
  import Chart from './parts/Chart.svelte'
  import OrderList from './parts/OrderList.svelte'
  import OrderBook from './parts/OrderBook.svelte'
  import OrderForm from './parts/OrderForm.svelte'
  import PairSelect from './parts/PairSelect.svelte'
  import RecentTrades from './parts/RecentTrades.svelte'
  import { getDefaultTerminalState, loadCandles, loadOrderbook, loadRecentTrades, subscribeOrderbook, subscribeRecentTrades } from './terminal.fn';
  import { updateState } from '@src/state/tabs_state'
  import { runEveryMinute } from '@src/helpers/helpers'
  
  /** @type {TabsState_Tab} */
  export let tab
  /** @type {TerminalState} */
  export let state
  export let isActivePage = false

  let render = true
  let isOrderBookLoaded = false
  /** @type {function[]} */
  let onDestroyCallbacks = []

  const start = () => {
    if (!state.token) return

    loadCandles(state)
    loadOrderbook(state).then(() => {
      isOrderBookLoaded = true
    })
    loadRecentTrades(state)

    onDestroyCallbacks.push(runEveryMinute(() => {
      loadCandles(state)
    }))

    subscribeOrderbook(state, () => isActivePage, () => isOrderBookLoaded).then((destroy_cbs) => {
      destroy_cbs.forEach(cb => onDestroyCallbacks.push(cb))
    })

    subscribeRecentTrades(state).then((dcb) => {onDestroyCallbacks.push(dcb)})
  }

  const stop = () => {
    onDestroyCallbacks.forEach((fn) => fn())
    onDestroyCallbacks = []
  }

  onMount(() => { start() })
  onDestroy(() => { stop() })

  async function change_pair(payload = {}) {
    render = false
    stop()

    updateState(_state => {
      const t_state = _state.tabs.find((t_state) => t_state.componentState === state)
      t_state.title = `${payload.detail.token}-USDT`
      t_state.componentState = getDefaultTerminalState({token: payload.detail.token})
      return _state
    })

    state = tab.componentState

    start()

    await tick()
    render = true
    setTimeout(() => {
      render = true
    }, 500)
  }
</script>

{#if isActivePage}
<div class="grid">
  {#if render}
  <div class="top-left">
    <PairSelect {state} on:pairChanged={change_pair} />
    {#if state.token}
    <Chart {state} />
    {/if}
  </div>
  <div class="top-right">
    {#if state.token}
    <OrderBook {state} />
    <RecentTrades {state} />
    {/if}
  </div>
  <div class="bottom-left">
    {#if state.token}
    <OrderList {state} />
    {/if}
  </div>
  <div class="bottom-right">
    {#if state.token}
    <OrderForm {state} />
    {/if}
  </div>
  {/if}
</div>
{/if}

<style lang="scss">
  @import "../../sass/variables.scss";
  .grid {
    height: calc(100vh - 48px);
    max-width: 100%;
    padding: 1px;

    display: grid;
    grid-template-columns: 60% 1fr;
    grid-template-rows: 70% 1fr;
    background-color: #121212;
  }

  .top-left {
    display: flex;
    justify-content: end;
    align-items: end;
    position: relative;

    border: 1px solid $main_borders_color;
  }

  .top-right {
    display: flex;
    max-height: 100%;
    border: 1px solid $main_borders_color;
    border-left: none;
  }

  .bottom-left {
    border: 1px solid $main_borders_color;
    border-top: none;
  }

  .bottom-right {
    border: 1px solid $main_borders_color;
    border-top: none;
    border-left: none;
  }
</style>