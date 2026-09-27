const { expect } = require('@playwright/test');
const { parsePrice } = require('../utils/price');

/**
 * Product page of the Ozcart demo store.
 *
 * Selector strategy (see AUTOMATION.md):
 * - Colour and Size have real <label for="..."> elements, so getByLabel is used.
 * - Quantity and Add to Cart have stable ids (#input-quantity, #button-cart).
 * - The price block has no accessible name or id, only theme classes.
 */
class ProductPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.giftWrapNo = page.getByRole('radio', { name: /^No/ });
    this.giftWrapYes = page.getByRole('radio', { name: /^Yes/ });
    this.colourSelect = page.getByLabel('Colour', { exact: true });
    this.sizeSelect = page.getByLabel('Size', { exact: true });
    this.quantityInput = page.locator('#input-quantity');
    this.addToCartButton = page.locator('#button-cart');
    this.price = page.locator('.price-new-live');
    this.oldPrice = page.locator('.price-old-live');
    this.youSaveLabel = page.locator('.product-label-custom-sale');
    this.successMessage = page.getByText(/Success: You have added/);
  }

  /** @param {string} path */
  async open(path) {
    await this.page.goto(path);
    await expect(this.addToCartButton).toBeVisible();
  }

  /**
   * Gift Wrap is a required option. In a new browser session no value is preselected.
   * @param {'No' | 'Yes'} value
   */
  async selectGiftWrap(value) {
    await (value === 'Yes' ? this.giftWrapYes : this.giftWrapNo).check();
  }

  /** @param {string} colour */
  async selectColour(colour) {
    await this.colourSelect.selectOption({ label: colour });
  }

  /**
   * Option texts contain stock info, e.g. "Medium (+$1.10) (4 left)",
   * so the option is found by the start of its text.
   * @param {string} size
   */
  async selectSize(size) {
    const option = this.sizeSelect.locator('option', { hasText: size });
    const value = await option.getAttribute('value');
    await this.sizeSelect.selectOption(value);
  }

  /** @param {number} quantity */
  async setQuantity(quantity) {
    await this.quantityInput.fill(String(quantity));
    // The live price is recalculated on the change event.
    await this.quantityInput.dispatchEvent('change');
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  /**
   * Adds a product and waits until the store confirms it (AJAX request).
   * @param {{ giftWrap?: 'No' | 'Yes', colour?: string, size: string, quantity?: number }} config
   */
  async addConfiguredProductToCart({ giftWrap = 'No', colour, size, quantity = 1 }) {
    await this.setQuantity(quantity);
    await this.selectGiftWrap(giftWrap);
    if (colour) await this.selectColour(colour);
    await this.selectSize(size);
    await this.addToCart();
    await expect(this.successMessage).toBeVisible();
  }

  async getPrice() {
    return parsePrice(await this.price.innerText());
  }
}

module.exports = { ProductPage };
