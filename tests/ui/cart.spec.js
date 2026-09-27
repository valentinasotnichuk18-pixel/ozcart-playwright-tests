const { test, expect } = require('@playwright/test');
const { ProductPage } = require('../../pages/ProductPage');
const { CartPage } = require('../../pages/CartPage');
const { product, options } = require('../../test-data/product');

test.describe('Shopping cart', () => {
  test('UI-06 configured product is added to cart with correct options and price @smoke', async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.open(product.path);

    await productPage.setQuantity(2);
    await productPage.selectGiftWrap('No');
    await productPage.selectColour(options.colour);
    const priceWithoutSize = await productPage.getPrice();
    await productPage.selectSize(options.sizeInStock);
    // The live price is updated with a fade animation, so wait until the
    // Medium surcharge is included before reading the price.
    await expect.poll(() => productPage.getPrice()).toBeGreaterThan(priceWithoutSize);
    const priceOnProductPage = await productPage.getPrice();
    await productPage.addToCart();
    await expect(productPage.successMessage).toBeVisible();

    const cartPage = new CartPage(page);
    await cartPage.open();
    const row = cartPage.productRow(product.name, product.model);

    await expect(row).toBeVisible();
    await expect(row).toContainText('Gift Wrap: No');
    await expect(row).toContainText(`Colour: ${options.colour}`);
    await expect(row).toContainText(`Size: ${options.sizeInStock}`);
    await expect(cartPage.quantityInput(row)).toHaveValue('2');
    await expect(cartPage.stockWarning).toBeHidden();

    const unitPrice = await cartPage.getUnitPrice(row);
    const rowTotal = await cartPage.getRowTotal(row);
    expect(rowTotal).toBeCloseTo(unitPrice * 2, 2);
    // The total in the cart must match the price shown on the product page.
    expect(rowTotal).toBeCloseTo(priceOnProductPage, 2);
  });

  test('UI-07 changing quantity in cart recalculates the total', async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.open(product.path);
    await productPage.addConfiguredProductToCart({
      colour: options.colour,
      size: options.sizeInStock,
      quantity: 1,
    });

    const cartPage = new CartPage(page);
    await cartPage.open();
    const row = cartPage.productRow(product.name, product.model);
    const unitPrice = await cartPage.getUnitPrice(row);

    await cartPage.updateQuantity(row, 3);

    await expect.poll(() => cartPage.getRowTotal(row)).toBeCloseTo(unitPrice * 3, 2);
    await expect(cartPage.stockWarning).toBeHidden();
  });
});
