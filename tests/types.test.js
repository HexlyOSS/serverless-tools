const { pretty } = require('../lib/util/debug')

test('should convert objects', () => {
  const province = {
    region: 'West Coast',
    name: 'Utah',
    city: {
      name: 'SLC'
    }
  }
  const address = {
    street1: 'abc',
    postal: 84123,
    province
  }
  province.address = address
  const types = {
    id: 1,
    undef: undefined,
    nul: null,
    name: 'Dave',
    sleep: 5.7,
    address
  }
  pretty(types, true, false)
})
