# Eis-Taxi · Public test demo handover

**Released November 25, 2026.** [Open the manager demo](https://icecreammsa-murex.vercel.app/menue). The public homepage opens the menu. Checkout accepts Stripe test payments and the demo delivery postcode **22846**.

## What was verified on Vercel

Published six Sanity collections and 67 menu records. The public demo reads published catalog content. Checked all 67 hosted detail pages against the reviewed copy, approved image files, collection memberships and 110 portion prices.

A mobile purchase of MATCHA TIME with Haferdrink and a portion of Sauerkirschen reached Stripe test checkout. The €14.00 merchandise total plus €2.00 delivery produced a €16.00 paid test invoice and one matching private order with the selected options. The Stripe test account now has a webhook pointing directly to the Vercel demo. Inbox delivery remains unverified.

## Editing the menu

Open [Sanity Studio on the project computer](http://localhost:3333/structure). Choose **Browse products by collection**, select a product and edit its German text, image or **Portions and prices**. Prices use euro cents. For example, 850 means €8.50. Use **Menu collections** for collection titles and navigation order. Save a draft, review it locally, then publish the approved edit to update the public demo. Cross-listed products share one record.

## Release record and rollback

- [Current deployment](https://vercel.com/youssefs-projects-9cc82c0b/ice_cream_msa/CdTgtJmMigaZmrwWhjKB8CJB2evB). The stable manager link is the public menu link above.
- Previous public deployment ID: `dpl_GSEe5DmYeje2CVk8SDbKdx3tiog8`. For a storefront rollback, restore that deployment in Vercel. It uses the earlier catalog type.
- [Pre-release catalog backup](.vercel/step8/catalog-before-release.tar.gz) on the project computer contains 77 documents and 71 assets, including the reviewed drafts and four earlier products. SHA-256: `994618910D6522D1272CDF7E1A0011956FFDD8E9275CFD6125135DB7F5209D8F`. Restore into a separate dataset first for comparison. The private order dataset is separate.
- The public environment uses an explicit test-demo flag, the authorized checkout origin and a dedicated Stripe test webhook secret. To suspend checkout, set `CHECKOUT_PAUSED=true` and redeploy.

Customer launch decisions are listed in the [Step 7 verification report](CLIENT-MENU-STEP-7.md), including delivery coverage, VAT, food references and packaging.
