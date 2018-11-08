const { pretty } = require('../lib/util/debug')

test('should convert objects', () => {
  const types = {
    id: 1,
    undef: undefined,
    nul: null,
    name: 'Dave',
    sleep: 5.7,
    address: {
      street1: 'abc',
      postal: 84123,
      province: {
        region: 'West Coast',
        name: 'Utah',
        city: {
          name: 'SLC'
        }
      }
    }
  }
  pretty(types, true)
})
