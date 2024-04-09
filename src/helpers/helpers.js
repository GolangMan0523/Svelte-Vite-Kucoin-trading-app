var SI_SYMBOL = ["", "k", "M", "B", "T"]
/**
 * Number to human format
 * @param {Number} number
 * @returns {String}
 */
export function abbreviateNumber(number) {
  var tier = Math.log10(Math.abs(number)) / 3 | 0
  if(tier == 0) return String(number.toFixed(0))
  var suffix = SI_SYMBOL[tier] || '?'
  var scale = Math.pow(10, tier * 3)
  var scaled = number / scale
  return scaled.toFixed(1) + suffix
}

/**
 * Returns fixed timestamp or null if input is bad
 * @param {number} timestamp 
 * @returns {number|null}
 */
export function toSecondsTimestamp(timestamp) {
  if (timestamp >= 1e10) {
    // Assuming it's in milliseconds, convert to seconds
    return Math.floor(timestamp / 1000);
  } else if (timestamp >= 1e9) {
    // Already in seconds
    return timestamp;
  } else {
    return null
  }
}

export function getPaddedLocalTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const paddedHours = hours < 10 ? '0' + hours : hours;
  const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;

  return `${paddedHours}:${paddedMinutes}`
}

export function getPaddedLocalDate(date) {
  const day = date.getDate();
  // Months are zero-based, so we add 1 to get the correct month
  const month = date.getMonth() + 1;

  // Pad single-digit day and month with leading zeros
  const paddedDay = day < 10 ? '0' + day : day;
  const paddedMonth = month < 10 ? '0' + month : month;

  return `${paddedDay}.${paddedMonth}`;
}

/**
 * @param {number} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 
 * @param {number} num 
 * @param {*} fixed 
 * @param {*} asString 
 * @returns {string}
 */
export function toFixed(num, fixed, asString = false) {
  let as_string = num.toString()

  // in case if number is exponent... because 0.000000003441 .toString() is 3.441e-9 lmao
  if (as_string.indexOf('e-') !== -1) {
    as_string =  (''+ +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
    function(a,b,c,d,e) {
      return e < 0
        // @ts-ignore
        ? b + '0.' + Array(1-e-c.length).join(0) + c + d
        // @ts-ignore
        : b + c + d + Array(e-d.length+1).join(0);
    })
  } 
  
  const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return as_string.match(re)[0]
}

/**
 * @returns {String}
 */
export function getUUID() {
  return 'shoqapp' + Math.ceil(Math.random() * 1000000000000)
}

/**
 * Will run every minute when a minute changes
 * @param {function} func
 * @returns {function} cancel_function
 */
export function runEveryMinute(func) {
  let intervalId = null;

  const currentTime = new Date();
  const millisecondsUntilNextMinute = (60 - currentTime.getSeconds()) * 1000;

  function cancel() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    } else {
      clearTimeout(clearTimeoutId);
    }
  }

  const clearTimeoutId = setTimeout(() => {
    func();

    intervalId = setInterval(func, 60000);
  }, millisecondsUntilNextMinute);

  return cancel;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}