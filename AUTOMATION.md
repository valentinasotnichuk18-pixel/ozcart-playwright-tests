# Automation Strategy

## 1. Selected scenarios

| ID | Scenario | Suite | Why automated |
|---|---|---|---|
| UI-01 | Product page shows key information (name, price, old price, model, options, quantity, Add to Cart) | Smoke | Fast check that the main sales page works at all |
| UI-02 | Required options (Gift Wrap, Size) are validated, nothing is added to the cart | Smoke | Main negative case; protects the cart from incomplete products |
| UI-03 | Live price is recalculated when quantity changes | Regression | Price logic is the highest business risk (Part 1, risk 1) |
| UI-04 | Size Large hides Colour, price increases, cart shows Size without Colour | Regression | Dependent options are custom logic and easy to break |
| UI-05 | Out-of-stock option (Size Small, 0 left) cannot be added | Regression | Stock risk (Part 1, risk 2). Currently fails: known defect |
| UI-06 | Configured product is added; cart shows correct options, quantity and total, equal to the product page price | Smoke | The core "add to cart" flow, checks data consistency between pages |
| UI-07 | Changing quantity in the cart recalculates the row total | Regression | Common user action that affects the order amount |
| API-01..03 | Petstore: create and get, update and verify, delete and verify 404 (bonus) | Regression | Same flow as Part 4, with automatic test data cleanup |

**Why these:** they cover the flow "open product, configure, validate, price, add to cart, change quantity" with the highest risk areas from Part 1 (price, stock, options, cart data). Each test is short, independent and checks the result of a user action, not only that an element exists.

## 2. What stays manual (from Part 3)

| Test case | Reason |
|---|---|
| TC-01 Guest checkout until the order is placed | Creates real orders on a third-party store; payment and emails depend on external services |
| TC-12 Checkout form validation | Needs checkout with personal data; valuable, but only on an environment we control |
| TC-06, TC-07, TC-08 Qty 0, negative, decimal, letters | Many input variations with unclear expected behavior (no requirements). First clarify the rules, then automate as one data-driven test |
| TC-04, TC-05 Qty equal to stock / stock + 1 | Stock on a shared demo changes, results are not reproducible |
| All DB checks | No database access |
| Visual checks, currency switching, rounding in different currencies | Need requirements about rates and rounding first |

## 3. What I would automate in a real project

- Full checkout for guest and registered user on a test environment, with order cleanup.
- Data-driven quantity validation (0, -1, 1.5, letters, max stock, stock + 1).
- Price calculation for all option combinations, discount on surcharges, tax and currencies.
- Stock checks with controlled data: seed stock through API or admin before the test.
- API tests for cart and order endpoints, DB checks for order, order_option and stock after an order.
- Cross-browser runs (Firefox, WebKit) and a mobile viewport for the product page.

## 4. Smoke and Regression

- **Smoke** (`npm run test:smoke`, tag `@smoke`): UI-01, UI-02, UI-06. Answers "can a user open the product, get validation and add it to the cart?" Short enough to run after every deployment.
- **Regression** (`npm test`): all UI tests plus API tests. Runs before a release.

## 5. Selector strategy and limitations

| Element | Selector | Comment |
|---|---|---|
| Gift Wrap | `getByRole('radio', { name: /^No/ })` | Radio buttons have accessible names from their labels |
| Colour, Size | `getByLabel('Colour')`, `getByLabel('Size')` | Real `<label for>` exists, best option |
| Product name | `getByRole('heading', { level: 1 })` | Semantic |
| Messages | `getByText('Size required')`, `getByText(/Success: You have added/)` | Visible text the user sees |
| Quantity | `#input-quantity` | Label "QTY:" is not linked to the input (`for` is missing), so the id is used |
| Add to Cart | `#button-cart` | The page has a second element with the same text (`input[name=button_cart]`), so a role/text selector is ambiguous; the id is stable |
| Price block | `.price-new-live`, `.price-old-live` | **Limitation:** no id, role or accessible name, only theme classes |
| Cart row | `getByRole('row')` filtered by product name and model | Two tables on the page (products and totals); filtering by model keeps it unique |
| Cart Update button | `button[data-original-title="Update"]` | **Limitation:** icon-only button without an accessible name; the Bootstrap tooltip attribute is the only stable identifier |

**Recommendations to developers (not implemented, third-party app):** add `data-testid` to the price block, cart rows and totals; link the "QTY:" label to its input with `for`; add `aria-label` to icon buttons in the cart; remove the duplicate "Add to Cart" input.

## 6. Synchronization

- No fixed delays (`waitForTimeout`) are used.
- Web-first assertions (`toHaveText`, `toBeVisible`, `toBeHidden`) wait automatically.
- `expect.poll` is used where a value is recalculated asynchronously (live price, cart total).
- UI-05 waits for the `checkout/cart/add` AJAX response before checking the result, so it does not pass too early just because the message has not appeared yet.
- Every test adds to the cart and then waits for the success message before opening the cart.

## 7. Independence

- Each test gets a new browser context (new session), so the cart is always empty at the start. Tests do not depend on each other and can run in parallel.
- API tests create a pet with a unique ID in `beforeEach` and delete it in `afterEach`.

## 8. Known defects found by the tests

| Test | Expected | Actual | Classification |
|---|---|---|---|
| UI-05 | Out-of-stock option is not added, an error is shown | "Success: You have added..." is shown and the item is added; the cart marks it with *** and blocks checkout | **Application defect** (Bug 1 in Part 2). Marked with `test.fail()` so the run stays readable and the defect stays visible |
| (not automated) | "You save" amount is recalculated with quantity | Price and old price change, "You save $19.25" stays the same | **Application defect** (Bug 2 in Part 2). Not automated as a separate test: it is a display issue with low value for a regression suite; it is covered by manual testing |

## 9. Observations from the first test run

- **Gift Wrap is required, but has no default in a new session.** In a manual browser session "No" looked preselected, but in a clean Playwright browser no radio button is checked and the store answers "Gift Wrap required". The tests now select Gift Wrap explicitly. Classification: test data / environment observation; worth clarifying with the product team (Part 1, business question about required options).
- **Colour is marked as required (*) but shows no validation message.** When Add to Cart is clicked with empty options, only "Gift Wrap required" and "Size required" appear. It may be related to the dependent option logic (Colour is hidden for Large). Classification: possible application defect, needs a manual check whether a product can be added without Colour.
- **Validation texts differ from standard OpenCart** ("Size required" without "!", "Your shopping cart is empty" without "!"). Assertions use the real texts.
- **Live price is updated with a fade animation.** The first version of UI-06 read the price during the animation and got the old value ($38.50 instead of $40.70). Classification: automation problem, not an application defect. Fixed with `expect.poll` that waits until the price includes the option surcharge, without fixed delays.
- **Lesson about `test.fail()`:** in the first run UI-05 was reported as "expected to fail", but it failed for the wrong reason (the empty cart text did not match). A test marked `test.fail()` passes for any failure, so UI-05 now first checks that all required options are accepted and only then checks the stock behavior. In a real project I would also review the failure message of every expected-to-fail test in the report.

## 10. Assumptions, risks and flaky areas

- **Shared data:** the demo store is public. Stock (Medium 4, Small 0), prices and the special price (-50% until 2080) can be changed by other users or reset. If Medium goes out of stock, UI-06 and UI-07 will fail because of test data, not because of an application defect. In a real project, test data would be prepared through API or admin before the run.
- **External content:** the page loads third-party widgets (YouTube, Twitter, Pinterest). If they are slow, `page.goto` can be slower. Tests wait for the Add to Cart button, not for all network requests.
- **No orders:** checkout is not submitted, so order creation and stock decrease are not covered by automation.
- **Theme classes:** price selectors depend on theme class names and can break after a theme update.
- **Texts in English:** validation and success messages are checked by text; a language change would break these assertions.
- **Petstore:** a public shared server, sometimes slow and periodically reset; it also accepts invalid data (see Part 4), so negative API tests only use behavior that is stable (404 after delete).
