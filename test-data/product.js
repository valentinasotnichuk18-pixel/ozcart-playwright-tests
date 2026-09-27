// Test data for the product used in all UI tests.
// Values were taken from the product page on 27.09.2026.
// Stock values can change on a shared demo store, see AUTOMATION.md.
module.exports = {
  product: {
    path: '14ct-gold-earrings',
    name: '14ct Gold Earrings',
    heading: '14ct Earrings - Gold',
    model: 'QQ3928',
    specialPrice: 19.25,
    oldPrice: 38.5,
  },
  options: {
    colour: 'Turquoise',
    sizeInStock: 'Medium', // 4 left
    sizeOutOfStock: 'Small', // 0 left
    sizeWithoutColour: 'Large', // Colour option is hidden for this size
  },
};
