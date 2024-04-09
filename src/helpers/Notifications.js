import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'
import '@src/sass/tooltips/notyf.scss'

const notyf = new Notyf()

export default class Notificatoins {
  /**
   * @param {Object} options 
   * @param {String} options.text
   * @param {String} [options.type]
   * @param {Number} [options.removeAfter] remove it after N msgpack
   */
  static show(options) {
    notyf.open({
      type: options.type || 'info',
      message: options.text,
      duration: options.removeAfter || 4000,
      className: 'nou_ga_itai'
    })
  }
}