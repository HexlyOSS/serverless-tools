const util = require('util')

function scrub(target, result = {}, config) {
  const cfg = {
    previewLength: 4,
    visited: [],
    ...config
  }

  Object.keys(target).forEach(k => {
    const obj = target[k]

    if (cfg.visited.indexOf(obj) >= 0) {
      return
    }

    if (obj === null) {
      result[k] = 'null'
    } else if (obj === undefined) {
      result[k] = 'undefined'
    } else if (Array.isArray(obj)) {
      result[k] = []
      cfg.visited.push(obj)
      scrub(obj, result[k], cfg)
    } else if (typeof obj === 'object') {
      result[k] = {}
      cfg.visited.push(obj)
      scrub(obj, result[k], cfg)
    } else {
      result[k] = typeof obj
      let val = obj.toString()
      const len = Math.min(cfg.previewLength, val.length)
      const stars = Array.from(Array(val.length - len), e => '*').join('')
      val = val.substr(0, len)
      result[k] += ` (${val}${stars})`
    }
  })
  return result
}

const pretty = (obj, log = false, sensitive = true) => {
  const payload = sensitive ? scrub(obj) : obj
  const output = util.inspect(scrub(payload), {
    showHidden: false,
    depth: null
  })
  if (log) {
    console.log(output)
  }
  return output
}

module.exports = {
  scrub,
  pretty
}
