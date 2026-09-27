const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../../pages/ProductPage');
const { CartPage } = require('../../pages/CartPage');
const { product, options } = require('../../test-data/product');
const { formatPrice } = require('../../utils/price');

test.describe('Product page: 14ct Gold Earrings', () => {
  /** @type {ProductPage} */
  let productPage;

  test.beforeEach(async ({ page }) => {
    productPage = new ProductPage(page);
    await productPage.open(product.path);
  });

  test('UI-01 product page shows key product information @smoke', async () => {
    await expect(productPage.heading).toHaveText(product.heading);
    await expect(productPage.price).toHaveText(formatPrice(product.specialPrice));
    await expect(productPage.oldPrice).toHaveText(formatPrice(product.oldPrice));
    await expect(productPage.page.getByText(`Model number: ${product.model}`)).toBeVisible();
    await expect(productPage.colourSelect).toBeVisible();
    await expect(productPage.sizeSelect).toBeVisible();
    await expect(productPage.quantityInput).toHaveValue('1');
    await expect(productPage.addToCartButton).toBeEnabled();
  });

  test('UI-02 required options are validated before adding to cart @smoke', async ({ page }) => {
    await productPage.addToCart();

    // Gift Wrap and Size show a validation message. Colour is marked as required (*)
    // but shows no message, see AUTOMATION.md.
    await expect(page.getByText('Gift Wrap required')).toBeVisible();
    await expect(page.getByText('Size required')).toBeVisible();
    await expect(productPage.successMessage).toBeHidden();

    const cartPage = new CartPage(page);
    await cartPage.open();
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test('UI-03 price is recalculated when quantity changes', async () => {
    const unitPrice = await productPage.getPrice();

    await productPage.setQuantity(3);

    await expect(productPage.price).toHaveText(formatPrice(unitPrice * 3));
    await expect(productPage.oldPrice).toHaveText(formatPrice(product.oldPrice * 3));
  });

  test('UI-04 size Large hides Colour and increases the price', async ({ page }) => {
    await productPage.selectGiftWrap('No');
    const basePrice = await productPage.getPrice();

    await productPage.selectSize(options.sizeWithoutColour);

    // Dependent option: Large is not available in any colour.
    await expect(productPage.colourSelect).toBeHidden();
    // The Large surcharge is added to the live price.
    await expect.poll(() => productPage.getPrice()).toBeGreaterThan(basePrice);

    await productPage.addToCart();
    await expect(productPage.successMessage).toBeVisible();

    const cartPage = new CartPage(page);
    await cartPage.open();
    const row = cartPage.productRow(product.name, product.model);
    await expect(row).toContainText(`Size: ${options.sizeWithoutColour}`);
    await expect(row).not.toContainText('Colour:');
  });

  test('UI-05 option that is out of stock cannot be added to cart (known defect)', async ({ page }) => {
    // Known defect, see AUTOMATION.md "Known defects" (Bug 1 from Part 2).
    // test.fail() marks the expected failure: the report stays honest, and the test
    // will be reported as "unexpectedly passed" once the store is fixed.
    test.fail(true, 'Size Small (0 left) is added to the cart with a "Success" message');

    await productPage.selectGiftWrap('No');
    await productPage.selectColour(options.colour);
    await productPage.selectSize(options.sizeOutOfStock);

    const addRequest = page.waitForResponse((response) => response.url().includes('checkout/cart/add'));
    await productPage.addToCart();
    await addRequest;

    // All required options are filled, so the only possible reason to reject
    // the product is the stock. The defect makes this assertion fail.
    await expect(productPage.page.getByText('Gift Wrap required')).toBeHidden();
    await expect(productPage.successMessage).toBeHidden();

    const cartPage = new CartPage(page);
    await cartPage.open();
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });
});
