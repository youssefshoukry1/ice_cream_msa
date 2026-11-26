# Löffelwerk Commerce Implementation Plan

## Goal

Turn the existing German Next.js storefront into a working ice cream store. Customers can browse products, manage their cart, pay through Stripe Checkout, and receive an invoice. Staff can maintain the catalog and see paid orders in Sanity Studio. Vercel hosts the storefront and its API.

The manager approved Next.js, Sanity CMS and Sanity Cloud, Stripe Checkout and Invoicing, and Vercel. Development starts with your personal Sanity project and Stripe Sandbox. The launch plan assumes company-owned accounts for live orders and payments, subject to approval at the release checkpoint.

## Approval process

- Every numbered step requires your explicit approval before it starts. The plan itself does not grant implementation approval.
- After each step, I will report what changed, how it was tested, any decisions still open, and what the next step will do. I will then wait for your approval. For example, `Approve Step 02` authorizes Step 02 only.
- If a step needs a business decision, account access, or a secret entered locally, I will identify exactly what is needed at that step. Live payments and public release require separate approvals.
- **Current status:** Steps 01 through 04 verified. Steps 05 through 07 are implemented and verified locally. Step 08 catalog and mixed carts are verified. Step 09 is deployed to Vercel Preview and awaiting signed-in review, connected Sandbox verification, and manager sign-off. The Step 10 release checklist and Step 11 handover are ready. Production setup, launch approval, deployment, and live verification are pending.

## Starting point

- The existing app has a German storefront, product cards, a cart saved in `localStorage`, and shipping and FAQ pages. Product prices are currently in source code and checkout is a preview.
- You created the Sanity project `msa_ice_cream`, confirmed the dataset named `production`, and opened your Stripe Sandbox. The Sanity dataset name identifies the current development dataset and does not make it the live store.
- Our first end-to-end test will use Erdbeere, in EUR, with synthetic customer details. The remaining catalog follows after this order passes.

## Steps and acceptance checks

### 01. Prepare the existing project and connect Sanity

Confirm the app builds, check environment variable handling, and document the local setup. Add a standalone Sanity Studio configuration and connect the existing Next.js app to the confirmed project and dataset. Add a sample environment file with placeholders. Configure server-side credentials only where the dataset permissions require them.

**Done when** the existing storefront still builds and Studio can open the project. Verify catalog access and that secrets stay out of Git and browser bundles.

**Verification:** Both builds passed. The server-side catalog check reached `ybya68i2/production` and returned zero published products. Local Studio reached its sign-in screen. The project owner will sign in with their Sanity account to access the editor.

### 02. Publish Erdbeere and read it in the storefront

Define the product fields needed for launch, including a stable identifier, German product copy, image reference, pack size, price in euro cents, and availability. Publish one Erdbeere record and map it to the existing card and product panel. Preserve storefront styling, hover effects, and animations.

**Done when** changing the price or availability in Studio is reflected in the storefront after the expected revalidation interval. Check the image, price per litre where shown, and unavailable state.

**Verification:** Published Erdbeere in Sanity at €6.50 for 500 ml using the existing product photo. The production build displayed €13.00 per litre and loaded the Sanity image. I switched availability off in Studio, verified that the catalog card and product panel stopped offering Add to cart after revalidation, and restored availability. Both builds passed. The homepage uses a 60-second revalidation interval that is triggered by requests.

### 03. Make the cart ready for checkout

Keep the current cart interface and use storage for product IDs and quantities. Reconcile saved carts from the current version against current catalog data. Support adding, removing, and changing quantities, and give customers clear feedback for unavailable products or price changes. Keep all money calculations in integer cents.

**Done when** cart contents survive refresh, quantity changes and removal update the totals, and an old or unavailable item is handled clearly. Verify the flow on desktop and mobile.

**Verification:** The production build passed. Browser checks at 320, 390, and 1440 px covered legacy cart migration, quantity updates, item removal, refresh, and price-change acknowledgement. Cart logic checks covered the quantity cap, malformed entries, and blocking increases for unavailable products. The cart keeps an unavailable item visible for removal and excludes it from the subtotal. It saves the last acknowledged unit price for comparison and calculates the subtotal using current catalog prices.

### 04. Implement pricing and frozen-delivery rules

Get the approved delivery countries or postcodes, frozen-shipping rates, minimum order, shipment days or cutoff rules, and tax settings from you or the manager. Document any temporary sandbox values. Enforce the approved rules on the server and verify that the final address Stripe records satisfies the same rules. If checkout allows the customer to change the address, verify the supported eligibility check before accepting live orders.

**Done when** an eligible basket gets the expected product, delivery, and tax totals and ineligible orders are blocked according to the approved rules. Cover the minimum-order boundary and at least one eligible and one ineligible address.

**Approved test settings:** The sandbox accepts German postcodes `10115` and `10117`, charges €6.90 for frozen delivery, and requires a €13.00 merchandise subtotal. Product and delivery prices include a synthetic 10% test tax. No dispatch calendar or cutoff applies to the test quote. The only published test product is Erdbeere. Confirm the business's real delivery area, rates, dispatch rules, and tax treatment before live orders.

The Next.js quote endpoint reads current Sanity prices and availability. It rejects invalid or unavailable items, addresses outside the configured area, and orders below the minimum. The cart displays the server quote as a test preview.

**Verification:** The production build passed. API and browser checks confirmed two Erdbeere cups at €13.00 plus €6.90 frozen shipping, for a €19.90 total including €1.81 test tax. One cup was below the minimum, postcode `80331` was excluded, and a client-supplied unit price could not override Sanity. The cart preview passed at 390 and 1440 px.

**Stripe handoff:** Recalculate the quote when creating the Checkout Session. If the payment page allows changing the delivery address, the integration must prevent an ineligible address before accepting live payment. Reuse the destination validator on the final address before fulfillment. Compare the validated address against the address used to fulfill the order. [Stripe shipping options guidance](https://docs.stripe.com/payments/checkout/custom-shipping-options)

### 05. Connect Stripe Sandbox Checkout

Create Checkout Sessions from the Next.js API using EUR totals validated on the server against Sanity and the delivery rules. Accept product identifiers and quantities from the browser, then resolve current prices and availability before creating the session. Add return and cancellation handling, clear error states, and protection against repeated checkout submissions.

**Done when** Erdbeere opens a Stripe-hosted checkout with the correct amount, cancellation preserves the cart, and changed or invalid cart inputs are handled safely.

**Account setup deferred by request:** Enter the Stripe Sandbox secret in the ignored `.env.local` during the final integration setup. At that point, verify Stripe-hosted checkout, a completed test-card payment, cancellation, and a mismatch between the postcode used for the quote and the one entered at Stripe. The return page verifies the paid amount and matching postcode but has no order fulfillment role. The cart's synthetic test tax is a breakdown of the gross price, and Stripe receives the gross amounts without separate tax reporting in this step.

**Local verification:** The production build passed. A Stripe SDK fixture verified the €19.90 Checkout request, one idempotency key per attempt, and amount, currency, and postcode checks on return. The local API rejected stale quotes, ineligible addresses, and invalid requests. Browser tests at 390 and 1440 px verified the missing-key message, duplicate-click protection, and cart preservation after a simulated cancellation.

### 06. Record paid orders in private Sanity storage

Confirm a separate private order dataset, supported Sanity plan, staff access, and a server-only write credential. Define order records with purchased items and prices, payment reference, delivery information required for fulfillment, and order status. Verify Stripe webhook signatures and confirm payment status before marking an order paid. Use the Stripe Checkout Session ID to make retries safe and update the storefront confirmation from verified payment state. Give staff a Studio view for paid, processing, and shipped orders.

**Done when** one sandbox payment creates one visible order, replaying the webhook creates no duplicate, failed or pending payments stay out of the fulfillment queue, and unauthenticated requests cannot read order data. Keep customer data out of the catalog, application logs, and public assets. Confirm a production plan that maintains dataset privacy beyond the trial.

**Local verification:** Both builds passed, including the Studio build with the Orders workspace enabled. A signed-event fixture recorded one €19.90 Erdbeere order. An unavailable store was treated as retryable, concurrent retries produced one document, and a replay preserved the staff's updated status. Tests covered pending payments, wrong totals, a changed postcode, a public dataset, a missing webhook signature, and an altered request body. The order writer checks the dataset's privacy setting before access. Orders use a deterministic, hashed Sanity ID under a private subpath. [Sanity document ID access rules](https://www.sanity.io/docs/content-lake/ids)

**Account verification deferred:** During the final integration setup, connect the webhook signing secret, Stripe Sandbox key, separate private Sanity dataset and server token, and staff Studio access. Verify a real Sandbox webhook delivery, one visible order after replay, and an unauthenticated read attempt against that dataset. The local setup instructions are in the [README](./README.md#local-paid-order-setup).

### 07. Configure Stripe invoices and test the complete flow

Enable paid invoice generation for one-time Checkout purchases. Confirm business details, invoice language, and tax details with the manager. Record the invoice reference on the order and check automatic email configuration. Test the invoice artifact in Sandbox and verify actual email delivery with an authorized recipient during release validation if Sandbox does not send it.

**Done when** an Erdbeere order passes from cart through payment and appears in Studio with its invoice reference. Verify that the invoice amounts match the order and review the failure, cancellation, and webhook retry cases.

**Local verification:** The storefront and Studio builds passed. Stripe Checkout requests a paid invoice and billing address. Local fixtures used the €19.90 Erdbeere quote, reconciled a paid invoice with its Checkout Session, and linked its ID and number to the private Sanity order. The order accepted payment and invoice events in either order. Duplicate events preserved the single order and its fulfillment status. An invoice with a mismatched total stayed unlinked. An unpaid Checkout Session resulted in no order.

**Account verification deferred:** Generate the real invoice artifact in Stripe Sandbox during final integration and compare it with the Studio order. Confirm business identity, invoice language, and tax treatment with the manager. Enable successful-payment emails in Stripe and verify delivery to an authorized test recipient when the environment supports sending. [Stripe invoice and email documentation](https://docs.stripe.com/receipts)

**Connected Sandbox invoice check:** Stripe invoice `1AG1QB4U-0001` matches the private Sanity order. The PDF itemizes two Erdbeere cups at €6.50 each and €6.90 frozen delivery for a €19.90 total. Stripe marks the invoice paid with €0.00 remaining, and a payment receipt is available. The PDF uses English labels, including “Amount due.” Stripe recorded €0.00 tax on this invoice. The cart's €1.81 is illustrative test tax. Confirm the legal business details, invoice language, and actual VAT settings before validating the production invoice.

**Email setting:** Enabled **Successful payments** in Stripe Sandbox Customer emails. Checkout already requests an itemized paid invoice. The live Stripe account needs the same setting during release setup. Stripe documents that automatic receipt emails are sent for live payments. Actual customer email delivery remains unverified. [Stripe paid invoice and receipt settings](https://docs.stripe.com/receipts#automatically-send-paid-invoices-with-checkout)

### 08. Add the full catalog and verify store operations

Publish the remaining launch products and confirm product details, prices, allergens, availability, and images. Confirm whether inventory is managed by staff or needs automated reservation and stock updates. If stock limits are required for launch, test simultaneous orders and stock release on expired checkout. Agree on how staff mark orders shipped, cancel orders, and reconcile refunds issued in Stripe.

**Done when** all launch products are purchasable according to their availability, mixed carts total correctly, and staff can follow an order from payment to shipment or refund using the agreed workflow.

**Sandbox verification:** Pistazie, Erdbeere, Vanille, and Schokolade are published in Sanity using the existing photos, 500 ml pack sizes, and preview prices. Both builds passed. Browser checks at 390 and 1440 px confirmed the four product cards, hover artwork, and mixed-cart quote. Pistazie plus Vanille totaled €20.30 with one frozen-delivery fee. The server rejected a mixed quote containing an unavailable product.

**Operations and launch decisions:** The sandbox uses staff-controlled availability. Studio includes a Canceled view and fields for recording verified Stripe refund statuses and IDs. Confirm stock, cancellation and refund ownership, launch prices, and ingredient and allergen statements during final integration. The storefront displays ingredient and allergen details only after both fields are marked verified in Sanity. The connected shipment and refund workflow test is deferred with the account setup. See the [staff workflow](./README.md#sandbox-catalog-and-staff-workflow).

### 09. Deploy a Vercel preview and collect manager sign-off

Connect the repository to an authorized Vercel project, configure preview-only variables and the Stripe Sandbox webhook, and deploy a shareable preview. Test the storefront, cart, checkout, order record, and invoice from the hosted preview. Check desktop and mobile layouts, keyboard access, checkout feedback, and the current shipping and FAQ copy.

**Done when** the manager has a working preview link and a short summary of what was tested, with any launch issues recorded.

**Vercel deployment:** Linked the working folder to `ice_cream_msa` and deployed the current local source to Preview. Vercel reports the build as Ready. Deployment Protection redirects anonymous visitors to Vercel sign-in. [Preview](https://icecream-n6xid9mvs-youssefs-projects-9cc82c0b.vercel.app/) · [Vercel build and deployment](https://vercel.com/youssefs-projects-9cc82c0b/ice_cream_msa/7MZF81YP6fcAitVA3t98s51MqgeU)

The manager needs authorized Vercel access to review the preview. Connect the Stripe Sandbox webhook and private order settings during the agreed account setup. See the [Vercel preview runbook](./README.md#vercel-preview).

**Ready for manager review after deployment:** The clean preview source installed and built locally with the storefront artwork and Sanity catalog configuration. Local environment files and Studio build files stayed out of the upload set. Desktop and mobile checks covered all four product cards, navigation, keyboard access, the shipping page and FAQ, and a €20.30 mixed-cart quote. Stripe checkout, order recording, and invoices still require the connected Sandbox test. Checkout accepts only the configured local or approved Preview origins and refuses Stripe Sandbox access when the Vercel environment is Production.

### 10. Prepare production and obtain release approval

Set up the agreed live accounts and permissions. Confirm Stripe business verification, payout setup, production secrets and webhook signing secret, Sanity dataset privacy and staff roles, Vercel production variables, and the domain. Get the manager's sign-off on shipping coverage, taxes, invoice details, German checkout and policy text, and support contacts. Define how to pause checkout and reconcile orders if a release problem occurs.

**Done when** the production checklist has an owner for each item and the manager has authorized the live deployment. Keep preview and production credentials and datasets separate.

#### Release checklist

Roles below are proposed owners. Account owners and the manager confirm who will handle each item before release.

| Owner | Action | Status |
| --- | --- | --- |
| Developer and project owner | Complete the connected Stripe Sandbox test in Preview. Verify payment, cancellation, a rejected address, one private order after webhook replay, and the paid invoice. | Pending Sandbox keys and private dataset access. [Stripe Sandbox testing](https://docs.stripe.com/testing) |
| Manager | Review the protected preview and approve the storefront and customer flow. | Pending. [Vercel preview](https://icecream-n6xid9mvs-youssefs-projects-9cc82c0b.vercel.app/) |
| Manager and fulfillment lead | Approve delivery countries or postcodes, zones and rates, minimum order, dispatch days and cutoffs, stock policy, fulfillment ownership, and refunds. Confirm the actual products, prices, pack sizes, images, ingredients, and allergens. | Pending. The current catalog and delivery policy use preview values. |
| Business or finance owner | Confirm the Stripe account that will receive payments, business verification, payout setup, tax treatment, invoice identity and language, and customer email settings. | Pending. [Stripe account setup](https://docs.stripe.com/get-started/account/set-up) · [Stripe email settings](https://dashboard.stripe.com/settings/emails) |
| Manager and support owner | Approve German checkout, delivery, contact, and policy copy, including the business and support details. | Pending. The storefront still includes preview copy and policy placeholders. |
| Sanity project owner | Select the live catalog project and a separate private orders dataset. Assign staff access and a server credential, confirm the plan keeps data private, and verify anonymous reads are blocked. | Pending. The current Sanity project hosts the preview catalog. [Sanity project management](https://www.sanity.io/manage) · [Private datasets](https://www.sanity.io/docs/content-lake/datasets) |
| Developer and Stripe account owner | Implement live Checkout and webhook handling using the approved policies. Confirm the final delivery address is eligible before payment, reconcile the Stripe tax and invoice totals, and configure the live webhook endpoint and secrets. | Pending. The current payment implementation accepts Sandbox keys and uses test rules. [Stripe webhook setup](https://docs.stripe.com/webhooks) |
| Vercel project owner | Confirm the launch domain and Vercel Production settings. Add production credentials directly to the correct environment and verify the deployed domain. | Pending. Vercel reports zero project-defined Production variables. The existing Vercel production alias serves the demo. [Project settings](https://vercel.com/youssefs-projects-9cc82c0b/ice_cream_msa/settings/environment-variables) · [Vercel domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) |
| Manager | Approve live deployment after the checks above are complete. | Pending. |

#### Checkout pause and reconciliation

1. Set `CHECKOUT_PAUSED=true` in the affected Vercel environment and redeploy the approved build. Confirm the checkout API returns the pause message and the cart and quote remain accessible. Vercel environment changes apply to subsequent deployments. [Vercel environment variables](https://vercel.com/docs/environment-variables)
2. Keep webhook processing available for payments already completed. If checkout needs to stop immediately for buyers with open sessions, have an authorized Stripe operator expire those sessions. [Stripe session expiration](https://docs.stripe.com/api/checkout/sessions/expire)
3. Match payments captured during the incident to their Sanity orders by Checkout Session or PaymentIntent ID. Inspect failed webhook deliveries, replay after fixing the issue, and verify one order per paid session before fulfillment. Have the finance or support owner handle any refund in Stripe and record its status in Studio. [Stripe webhook delivery and retries](https://docs.stripe.com/webhooks)
4. After the release owner approves reopening, restore the setting and redeploy. Verify the quote, Checkout creation, and webhook processing before resuming fulfillment.

**Local verification:** The production build passed. A mobile browser test with `CHECKOUT_PAUSED=true` returned the pause message, blocked creation of a Stripe session, and preserved the two-item cart and its €19.90 test delivery quote. The release checklist and pause control are ready for review.

### 11. Launch, verify, and hand over

After explicit launch approval, deploy the approved release and verify the production storefront and checkout configuration. Run a controlled live order only if separately authorized, then verify the order, invoice delivery, fulfillment details, and any agreed refund. Hand over how to edit products and prices, manage availability, process orders and refunds, monitor payment or webhook failures, and pause checkout.

**Done when** the production release passes the agreed checks, the manager has the storefront and admin links, and responsibility for ongoing store operations is clear.

#### Manager handover

| Open | What to review |
| --- | --- |
| [Vercel storefront preview](https://icecream-n6xid9mvs-youssefs-projects-9cc82c0b.vercel.app/) | Sign in with project access. Review the four-flavor catalog, mobile layout, product panels, cart, and frozen-delivery quote. Use two cups and test postcode `10115` to review the test flow. |
| [Public demo](https://icecreammsa-murex.vercel.app/) | The existing public design demo. The production store URL will be recorded after launch authorization. |
| [Sanity project manager](https://www.sanity.io/manage) | Staff use Sanity Studio to update products, prices, and availability. The authenticated Orders workspace will use the private dataset once it is configured. [Staff instructions](./README.md#sandbox-catalog-and-staff-workflow) |
| [Vercel deployment dashboard](https://vercel.com/youssefs-projects-9cc82c0b/ice_cream_msa/7MZF81YP6fcAitVA3t98s51MqgeU) | Verify the preview build, the target environment, and the release source. |
| [Stripe Dashboard](https://dashboard.stripe.com/) | Finance uses the appropriate environment to review payment, invoice, and refund activity. The developer uses the webhook delivery history to reconcile failed events. |

**Manager decision:** Approve the preview, final catalog and food details, delivery and stock policy, tax and invoice settings, support copy, and launch domain. Confirm the staff owners in the Step 10 checklist.

**Before release:** Complete the connected Sandbox purchase and cancellation. Confirm the amount, final address, one private order after webhook replay, and the invoice. Complete the live checkout implementation and production account setup using the approved policies. Record the release approval, source revision, and intended production domain in the deployment record.

**After release:** Check the production domain, catalog, cart, eligible and ineligible delivery addresses, and webhook health. If a controlled live purchase is separately authorized, reconcile its payment amount, private Sanity order, and invoice. Record the release as verified once the checks pass.

**Production status check:** Vercel reports the protected Preview deployment as Ready. The public demo returned HTTP 200. Vercel reports no project-defined Production variables. The connected Sandbox and live release checks remain open.

**Local Sandbox account setup:** Verified the application key belongs to the authorized Stripe Sandbox. Created `orders-sandbox` as a private dataset and verified an authenticated write and read while an anonymous request could not read the same record. Configured Sanity Studio and Stripe CLI forwarding locally. The app created a €19.90 test Checkout Session with invoicing enabled, returned the same Stripe session for a repeated attempt, and rejected a postcode outside the test area. Updated the Checkout card restriction for the current Stripe API. The completed test payment, recorded order, and paid invoice will be checked after the hosted checkout is submitted. [Stripe Checkout API change](https://docs.stripe.com/changelog/endive/2026-09-30/remove-payment-method-types-checkout-sessions)

## Platform references

- [Sanity dataset access and visibility](https://www.sanity.io/docs/content-lake/datasets)
- [Stripe API key handling](https://docs.stripe.com/keys)
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Vercel preview and production environments](https://vercel.com/docs/deployments/environments)
