# Fair Loans

A small web app that helps you check whether the APR on a loan offer is fair.

Enter your credit score, monthly income, loan amount, loan term and the APR you were offered. The app estimates the APR you would typically expect for that profile and compares it with the offer:

- **High:** the offer is more than 5 percentage points above the estimate, so it is flagged and you are nudged to shop around.
- **In range:** the offer is within 5 points of the estimate. If it is above the estimate, it may be worth negotiating.
- **Good deal:** the offer is more than 5 points below the estimate.

Inputs are validated (credit score 300–850, loan amount $1,000–$30,000, APR 0–40%, monthly income up to $50,000).

> The estimate comes from a simple hand-tuned formula, not a trained model or real lender data. It runs entirely in your browser and nothing is sent anywhere. Treat the result as a rough sanity check, not financial advice.

## How the estimate works

The formula lives in `src/components/LoanChecker.tsx` (`predictAPROnly`). It starts from a 12% base rate and adjusts for:

- credit score relative to 700
- monthly income (log scale)
- loan amount relative to $10,000
- a surcharge for terms of 60 months or longer
- a penalty when loan amount is more than 3x monthly income
- a small monthly-payment term

The result is clamped to 0–40%.

## Tech stack

Vite, React, TypeScript, Tailwind CSS and shadcn/ui.

## Development

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev      # dev server at http://localhost:8080
npm run build    # production build into dist/
npm run lint
```

## Deployment

The site is hosted on GitHub Pages at https://sri-meduri.github.io/fair-loans/. Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the app and publishes it. In the repo settings, Pages → Source must be set to **GitHub Actions**.

Production builds use `/fair-loans/` as the base path (see `vite.config.ts`). If you move to a custom domain served from the root, change the base to `/`.
