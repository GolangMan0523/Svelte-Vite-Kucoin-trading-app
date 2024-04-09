<script>
  import debounce from 'lodash/debounce'
  import { onDestroy, onMount, tick } from 'svelte'
  import { Chart, CandlestickSeries, TimeScale, HistogramSeries } from 'svelte-lightweight-charts'
  import { fix_form, getSteps, loadCandles } from '../terminal.fn'
  import { symbolDetails } from '@src/config/kucoin'
  import { CrosshairMode } from 'lightweight-charts'
  import { updateState } from '@src/state/tabs_state'
  import { getPrecisePrice } from '@src/helpers/trading'

  /** @type {TerminalState} */
  export let state

  let root_div
  let formattedCandles = []
  let formatterVolumeCandles = []
  let onDestroyCallbacks = /** @type {function[]} */ ([])
  let /** @type {import('lightweight-charts').IChartApi} */ candles_chart_api
  let /** @type {import('lightweight-charts').IChartApi} */ volumes_chart_api
  let candles_series_api

  /** @type {candle_format[]} */
  const possible_candle_types = ['1min','3min','5min','15min','30min','1hour','2hour','4hour','6hour','8hour','12hour','1day','1week']

  const price_section_width = symbolDetails[state.token].pricePrecision * 12
  
  const options = {
    layout: {
      textColor: 'white',
      background: { color: '#121212' },
    },
    grid: {
      vertLines: {
        visible: true,
        color: '#1b1b1b',
      },
      horzLines: {
        visible: true,
        color: '#1b1b1b',
      },
    },
    crosshair: {
      mode: CrosshairMode.Normal
    },
    rightPriceScale: {
      minimumWidth: price_section_width < 80 ? 80 : price_section_width,
    },
    width: 0,
    height: 0,
  }
  const candles_options = {
    ...options,
    /** @type {Partial<import('lightweight-charts').HorzScaleOptions>} */
    timeScale: {
      visible: false
    },
  }
  const volumes_options = {
    ...options,
    grid: {
      vertLines: {
        visible: true,
        color: '#1b1b1b',
      },
      horzLines: {
        visible: false,
        color: '#1b1b1b',
      },
    },
  }
  const priceFormat = /** @type {import('lightweight-charts').PriceFormat} */ ({
    type: 'price',
    precision: symbolDetails[state.token].pricePrecision,
    minMove: getSteps(state.token)[0],
  })

  $: {
    formattedCandles = state.chart.candles.map((c) => ({time: c[0], open: c[1], high: c[3], low: c[4], close: c[2]})).reverse()
    
    if (state.price && formattedCandles.length) {
      formattedCandles[formattedCandles.length - 1].close = state.price
    }

    formatterVolumeCandles = state.chart.candles.map((c) => ({ time: c[0], value: c[6], color: c[2] > c[1] ? '#52a49a' : '#dd5f56' })).reverse()

    setChartsSize()
  }

  function sync_candl_chart({detail}) {
    if (candles_chart_api && detail) {
      candles_chart_api.timeScale().setVisibleLogicalRange(detail)
    }
  }

  function sync_vol_chart({detail}) {
    if (volumes_chart_api && detail) {
      volumes_chart_api.timeScale().setVisibleLogicalRange(detail)
    }
  }

  let onResizeFix = true

  const onResize = debounce(fixWorkingArea, 100)
  window.addEventListener("resize", onResize)
  onDestroyCallbacks.push(() => {
    window.removeEventListener("resize", onResize)
  })

  onMount(async () => {
    await tick()
    setChartsSize()
  })

  onDestroy(() => {
    onDestroyCallbacks.forEach((fn) => fn())
  })

  function fixWorkingArea() {
    onResizeFix = false

    setTimeout(() => {
      onResizeFix = true
      setChartsSize()
    })
  }

  /**
   * 
   * @param {CustomEvent<import('lightweight-charts').MouseEventParams<import('lightweight-charts').Time>> & { type: "click" }} event
   */
  function on_click(event) {
    if (event?.detail?.point?.y && candles_series_api?.coordinateToPrice(event.detail.point.y)) {
      const price = +getPrecisePrice({token: state.token, price: candles_series_api.coordinateToPrice(event.detail.point.y)})
      fix_form({state, sell_side: true, on_input: {
        value: price,
        type: 'price',
      }})
      fix_form({state, sell_side: false, on_input: {
        value: price,
        type: 'price',
      }})
      updateState(_state => _state, true)
      candles_series_api.coordinateToPrice(event.detail.point.y)
    }
  }

  async function setChartsSize() {
    if (root_div?.parentNode) {
      candles_options.width = root_div.parentNode.offsetWidth - 2
      candles_options.height = (root_div.parentNode.offsetHeight * 0.8) - 2

      volumes_options.width = root_div.parentNode.offsetWidth - 2
      volumes_options.height = (root_div.parentNode.offsetHeight * 0.2) - 2
    }
  }
  
  function setActiveCandleType(e) {
    if (state.chart.candles_timeframe === e.target.innerText) return;
    state.chart.candles_timeframe = e.target.innerText
    loadCandles(state)
  }
</script>


<div class="CandleChart" bind:this={root_div}>
  {#if onResizeFix}
  <div class="CandleChart-timeframes">
    {#each possible_candle_types as timeframe}
    <span class="CandleChart-timeframe" class:is-active={timeframe === state.chart.candles_timeframe} on:click={setActiveCandleType} on:keypress={setActiveCandleType}>{timeframe}</span>
    {/each}
  </div>
  
  <Chart {...candles_options} on:click={on_click} ref={(ref) => candles_chart_api = ref}>
    <CandlestickSeries {priceFormat} data={formattedCandles} reactive={true} ref={(ref) => candles_series_api = ref}></CandlestickSeries>
    <TimeScale timeVisible={true} on:visibleLogicalRangeChange={sync_vol_chart} />
  </Chart>

  <Chart {...volumes_options} ref={(ref) => volumes_chart_api = ref}>
    <TimeScale timeVisible={true} on:visibleLogicalRangeChange={sync_candl_chart} />

    <HistogramSeries
        reactive={true}
        data={formatterVolumeCandles}
        priceFormat={{type: 'volume', precision: 0}}
        />
  </Chart>
  {/if}
</div>

<style lang="scss">
  @import "../../../sass/variables.scss";

  .CandleChart {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .CandleChart-timeframes {
    position: absolute;
    top: 10px;
    left: 110px;
    z-index: 3;

    display: flex;

    .CandleChart-timeframe {
      padding: 0 5px;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;

      &.is-active {
        color: $green;
        cursor: default;
      }
    }
  }
</style>