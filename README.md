# Ozcart Playwright Tests

UI test automation for the product selection and cart flow of the Ozcart demo store, plus a small bonus API suite for Swagger Petstore.

- Application under test: https://demo.ozcart.com/
- Product page: https://demo.ozcart.com/_v5/14ct-gold-earrings
- API under test (bonus): https://petstore.swagger.io/v2

Test selection, reasoning, known defects and limitations are described in [AUTOMATION.md](AUTOMATION.md).

## Tech stack

| Item | Value |
|---|---|
| Framework | Playwright Test |
| Language | JavaScript (CommonJS) |
| Node.js | 18 or newer (developed on Node.js 24) |
| Browser | Chromium (Desktop Chrome profile) |

## Project structure

```
ozcart-playwright-tests/
├── pages/
│   ├── ProductPage.js      # product page locators and actions
│   └── CartPage.js         # cart page locators and actions
├── test-data/
│   └── product.js          # product name, prices, option values
├── tests/
│   ├── ui/
│   │   ├── product-page.spec.js   # UI-01 ... UI-05
│   │   └── cart.spec.js           # UI-06, UI-07
│   └── api/
│       └── petstore.spec.js       # API-01 ... API-03 (bonus)
├── utils/
│   └── price.js            # price parsing and formatting
├── playwright.config.js
├── AUTOMATION.md
└── README.md
```

## Installation

```bash
git clone <repository-url>
cd ozcart-playwright-tests
npm install
npx playwright install chromium
```

## Running tests

| Command | What it runs |
|---|---|
| `npm test` | All tests (UI and API), headless |
| `npm run test:ui` | UI tests only, headless |
| `npm run test:api` | API tests only |
| `npm run test:smoke` | Smoke suite (tests tagged `@smoke`) |
| `npm run test:headed` | UI tests in a visible browser window |
| `npm run test:debug` | UI tests step by step in Playwright Inspector |
| `npm run report` | Opens the HTML report of the last run |

Headless mode is the default. To run a single test, add its ID:

```bash
npx playwright test -g "UI-06"
```

Interactive UI mode:

```bash
npx playwright test --ui
```

## Configuration

No environment variables are required. Optional overrides:

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://demo.ozcart.com/_v5/` | Store under test |
| `API_URL` | `https://petstore.swagger.io/v2/` | API under test |

Example (PowerShell): `$env:BASE_URL="https://demo.ozcart.com/_v5/"; npm run test:ui`

Main settings in `playwright.config.js`:

- `retries: 0`: failures are not hidden by retries.
- `workers: 2`: low load on a shared public demo environment.
- Trace, screenshot and video are kept only for failed tests (`test-results/`).

## Expected results

- UI-05 is marked with `test.fail()` because it demonstrates a real application defect (out-of-stock option can be added to the cart). It is reported as "expected to fail". If the defect is fixed, Playwright reports it as "unexpectedly passed", and the annotation should be removed.
- All other tests are expected to pass.

## Known limitations

- The store is a public shared demo. Stock values, prices and specials can be changed by other people or reset by the owner, which can break data-based assertions.
- No test creates orders: the checkout is not submitted, to avoid persistent data on a third-party system.
- Petstore is a public shared API. Tests use unique IDs and delete their data afterwards, but the server can still be slow or reset.

Details are in [AUTOMATION.md](AUTOMATION.md).
