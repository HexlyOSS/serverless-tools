const util = require('util')

function scrub(target, config, result = {}) {
  if (target == null) {
    return null
  }

  const cfg = {
    previewLength: 4,
    visited: [],
    mask: false,
    ...config
  }

  Object.keys(target).forEach(k => {
    const obj = target[k]

    if (cfg.visited.indexOf(obj) >= 0) {
      result[k] = 'cycle'
    } else if (obj === null) {
      result[k] = 'null'
    } else if (obj === undefined) {
      result[k] = 'undefined'
    } else if (Array.isArray(obj)) {
      result[k] = []
      cfg.visited.push(obj)
      scrub(obj, cfg, result[k])
    } else if (typeof obj === 'object') {
      result[k] = {}
      cfg.visited.push(obj)
      scrub(obj, cfg, result[k])
    } else {
      result[k] = typeof obj
      let val = obj.toString()
      let stars = ''

      if (cfg.mask) {
        const len = Math.min(cfg.previewLength, val.length)
        stars = Array.from(Array(val.length - len), e => '*').join('')
        val = val.substr(0, len)
      }

      result[k] += ` (${val}${stars})`
    }
  })
  return result
}

const pretty = (obj, log = false, mask = true) => {
  const payload = mask ? scrub(obj, { mask }) : obj
  const output = util.inspect(payload, {
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
