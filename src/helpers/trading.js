import getKC from '@src/library/kucoin-api/kucoin'
import { getUUID, toFixed } from "./helpers"
import { symbolDetails } from "../config/kucoin"

/**
 * @param {{
 *  token: string
 *  size?: number
 *  price?: number
 *  funds?: number
 *  isLimit?: boolean
 *  isSell?: boolean
 *  isKucoin?: boolean
 * }} params
 * @returns {Promise<{ok: boolean, orderId?: string, reason?: string}>}
 */
export async function trade(params) {
  try {
    const symbolDash = `${params.token}-USDT`

    let qty2use = params.size
    let price2use = params.price

    if (qty2use) {
      qty2use = +getPreciseQuanity({
        token: params.token,
        size: qty2use,
        isKucoin: params.isKucoin,
      })
    }

    if (price2use) {
      price2use = +getPrecisePrice({
        token: params.token,
        price: price2use,
        isKucoin: params.isKucoin,
      })
    }

    let response = null
    if (params.isKucoin) {
      const payload = {
        clientOid: getUUID(),
        side: params.isSell ? 'sell' : 'buy',
        symbol: symbolDash,
        type: params.isLimit ? 'limit' : 'market',
        ...(params.isLimit ? { price: price2use, size: qty2use } : params.funds ? { funds: params.funds } : { size: qty2use }),
      }
      // @ts-ignore
      response = await (await getKC()).placeOrder(payload).catch((res) => {
        console.error('Trade failed with this response:', res)
        return res
      })

      // @ts-ignore
      if (response?.data?.orderId) {
        return { ok: true, orderId: response?.data?.orderId }
      } else {
        // @ts-ignore
        return { ok: false, reason: response?.code && response?.msg ? `${response.code}: ${response.msg}` : 'Order placement failed' }
      }
    }
  } catch {
    return { ok: false, reason: `Order placement errored` }
  }
}

/**
 * @param {{
 *  token: string
 *  size: number
 *  isKucoin?: boolean
 * }} params
 * @returns {string}
 */
export function getPreciseQuanity(params) {
  const sd = symbolDetails[params.token]

  if (typeof sd?.sizePrecision === 'number') {
    return toFixed(params.size, sd.sizePrecision, true)
  } else {
    return String(params.size)
  }
}

/**
 * @param {{
 *  token: string
 *  price: number
 *  isKucoin?: boolean
 * }} params
 * @returns {string}
 */
export function getPrecisePrice(params) {
  const sd = symbolDetails[params.token]

  if (sd?.pricePrecision) {
    return toFixed(params.price, sd.pricePrecision, true)
  } else {
    return String(params.price)
  }
}