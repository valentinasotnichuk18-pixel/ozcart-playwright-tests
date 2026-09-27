const { expect } = require('@playwright/test');
const { parsePrice } = require('../utils/price');

/**
 * Shopping cart page of the Ozcart demo store.
 * Cart content is stored in the browser session, so every test
 * (new browser context) starts with an empty cart.
 */
class CartPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.emptyCartMessage = page.getByText('Your shopping cart is empty');
    this.stockWarning = page.getByText(/not available in the desired quantity or are not in stock/);
  }

  async open() {
    await this.page.goto('cart');
  }

  /**
   * Cart row of a product. The row is found by product name and model,
   * so the totals table below the cart is not matched.
   * @param {string} productName
   * @param {string} model
   */
  productRow(productName, model) {
    return this.page.getByRole('row').filter({ hasText: productName }).filter({ hasText: model });
  }

  /** @param {import('@playwright/test').Locator} row */
  quantityInput(row) {
    return row.getByRole('textbox');
  }

  /** @param {import('@playwright/test').Locator} row */
  async getUnitPrice(row) {
    return parsePrice(await row.getByRole('cell').nth(-2).innerText());
  }

  /** @param {import('@playwright/test').Locator} row */
  async getRowTotal(row) {
    return parsePrice(await row.getByRole('cell').last().innerText());
  }

  /**
   * @param {import('@playwright/test').Locator} row
   * @param {number} quantity
   */
  async updateQuantity(row, quantity) {
    await this.quantityInput(row).fill(String(quantity));
    // The update button is an icon without an accessible name. Its tooltip text is
    // stored in data-original-title (Bootstrap), the most stable attribute available.
    await row.locator('button[data-original-title="Update"]').click();
    await expect(this.quantityInput(row)).toHaveValue(String(quantity));
  }
}

module.exports = { CartPage };
