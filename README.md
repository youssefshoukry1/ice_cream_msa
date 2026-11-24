This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Sanity setup

Use Node.js 22.20 or later for the Studio dependencies. The local storefront and standalone Studio default to
the project and catalog dataset in `studio/project.json`.

```bash
npm ci
npm run check:sanity
npm --prefix studio ci
npm --prefix studio run dev
```

Open [http://localhost:3333](http://localhost:3333) and sign in with the Sanity
account that has access to the project. Studio starts with an empty schema
until the product setup step.

If you need to override the catalog connection for Next.js, copy
`.env.example` to `.env.local` at the repository root. The catalog connection
works without a token when the dataset allows public reads. If the dataset
requires authentication, set a read-only `SANITY_READ_TOKEN` in `.env.local`.
Keep that file out of Git. The Studio uses the shared project settings and its
own Sanity sign-in.

Run `npm run build` for the storefront and `npm --prefix studio run build`
for the Studio. See the [commerce implementation plan](./COMMERCE-IMPLEMENTATION-PLAN.md)
for the approved scope and step status.

## Local Stripe Sandbox checkout

Set `STRIPE_SECRET_KEY` in the ignored root `.env.local` using the Sandbox
secret key from your Stripe account. The checkout accepts keys that start with
`sk_test_`. Restart the Next.js server after saving the key. Configure
`CHECKOUT_ORIGIN` only when testing on an origin other than
`http://localhost:3000`.

Add two Erdbeere cups, quote frozen delivery for postcode `10115`, and choose
**Weiter zu Stripe (Test)**. Use the same postcode at Stripe. For a success
test use Stripe's test card and sample address. The store verifies the session
and its delivery postcode on return. Sandbox checkout charges the quoted gross
amount. The illustrative tax breakdown is displayed in the cart only.

[Stripe Sandbox test cards](https://docs.stripe.com/testing)

## Local paid-order setup

Create a separate **private** dataset for orders in the configured Sanity project.
For the sandbox, use a name such as `orders-sandbox`. Confirm that the Sanity plan
supports private datasets for the full period the data must stay private. Give
staff access to the private dataset and use a separate server credential for order
reads and writes. The credential also needs to see the dataset's privacy setting.
Set `SANITY_ORDERS_DATASET` and `SANITY_ORDERS_TOKEN` in the root `.env.local`.
The order writer checks that the dataset is private before storing any order.

In `studio/.env.local`, set `SANITY_STUDIO_ORDERS_DATASET=orders-sandbox` (or your
chosen dataset name). Restart Studio, then use **Löffelwerk Orders** at
[http://localhost:3333/orders](http://localhost:3333/orders) to see Paid, Processing,
and Shipped orders. Studio uses staff sign-in and their Sanity permissions.

To forward Sandbox Stripe events while testing locally, run:

```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,invoice.paid --forward-to localhost:3000/api/stripe/webhook
```

Place the listener's signing secret in `STRIPE_WEBHOOK_SECRET` in the root
`.env.local` and restart Next.js. For a hosted webhook, use that endpoint's
signing secret. During final integration, verify that Stripe records a payment,
Studio shows exactly one order after a retry, and an unauthenticated request
cannot read it. Check any webhook result marked `review` in the Stripe Sandbox.

- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Private Sanity datasets](https://www.sanity.io/docs/content-lake/datasets)

## Stripe invoice verification

New test Checkout Sessions request a Stripe paid invoice and collect a billing
address. The Stripe invoice ID and invoice number appear on the order in the
private Studio workspace after the paid invoice and order totals are reconciled.

During final integration, enable **Successful payments** in Stripe's customer
email settings and confirm the business identity, invoice language, and tax
settings with the manager. Checkout uses German. Verify the invoice language on
the generated document using the account's email settings and a test buyer.
The cart's illustrative tax breakdown is separate from Stripe's invoice tax
configuration. Confirm the actual invoicing and tax treatment before launch.

Complete a two-cup Erdbeere test purchase, verify the €19.90 paid invoice in
Stripe, and match its ID, number, and amount against the order in Studio. Retry
the payment and invoice webhooks to confirm that the reference stays on one
order. Confirm email delivery with an authorized recipient when the environment
supports sending customer emails.

[Stripe paid invoice and email settings](https://docs.stripe.com/receipts)

## Sandbox catalog and staff workflow

- In the catalog workspace, edit the German name, description, image, pack
  size, and price in euro cents. Use **Available to add to cart** to manage
  availability for the sandbox. The storefront refreshes its published
  catalog on a 60-second revalidation interval. The server rechecks current
  prices and availability when it quotes or starts checkout.
- Mark ingredient and allergen information verified only after checking both
  fields against approved product information. The product panel publishes
  both fields together. Confirm launch prices, food information, and whether
  automated stock reservations are needed before going live. The sandbox uses
  staff-controlled availability.
- In the private Orders workspace, move paid orders to **Processing** when
  packing begins and **Shipped** at carrier handoff. Move a canceled order to
  **Canceled** and reconcile its payment in Stripe separately. When an
  authorized operator issues a refund in Stripe, staff can record its verified
  status and Stripe refund ID in Studio. The paid total and invoice reference
  remain the original payment record. Confirm staff ownership and the workflow
  during final integration.

## Vercel preview

Link the repository root to the approved Vercel project using the Next.js
preset and Node.js 22.x. The Git review branch must include the latest
storefront changes. If using the CLI to upload the local working tree, target
the Preview environment explicitly:

```bash
vercel link
vercel deploy --target=preview
```

The catalog reads from the public Sanity dataset by default. The hosting
configuration excludes local environment files, Studio build files, and
research. The shared Sanity project file and storefront assets are included.

Once account setup is approved, set the Stripe Sandbox key, webhook signing
secret, and private order settings on Vercel's **Preview** environment. Use the
stable branch preview URL for review and set `CHECKOUT_ORIGIN` if a separate
preview hostname is used. By default, checkout accepts Vercel's deployment
and branch preview origins when system environment variables are exposed.
If Vercel protects the preview, give the manager authorized access and verify
that the approved webhook path is reachable by Stripe.

For sign-off, review the product cards and photos, a mixed-cart quote, mobile
navigation, the delivery and FAQ text, and the order and invoice trail after a
Sandbox payment. Record the preview URL and the manager's response in the
[implementation plan](./COMMERCE-IMPLEMENTATION-PLAN.md).

- [Vercel preview deployments](https://vercel.com/docs/deployments/environments)
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
