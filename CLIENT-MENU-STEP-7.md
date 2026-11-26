# Eis-Taxi · Step 7 verification report

**Decision:** the local test storefront is ready for manager review. Public release and real payments have separate approval gates.

[Open the menu preview](http://localhost:3000/menue) · [Review the flyer transcription](CLIENT-MENU-STEP-1.md) · [Compare the imagery](menu-review/step-4/review.html)

## Menu accuracy

| Check | Result |
|---|---|
| Six collection pages | Eisbecher 32, Kinderbecher 4, Spaghetti Eis 2, Shakes & Getränke 8, Extras 8, Eissorten 19 flavors plus the scoop portion link. All cross-listings led to the same product URL. |
| 67 product detail pages | Every page returned successfully. Rendered titles, German descriptions where printed, printed marks and all 110 portion/size/choice prices matched the Step 1 inventory and Step 4 mapping. Shared extras retained their printed option lines. |
| 67 image assignments | Each detail-page image URL contained the content hash of its approved Step 4 WebP. The visual reference for each recreation is available in the comparison gallery. |
| Mobile and desktop | At 390 px and 1440 px, the flavor list kept the 19 flavors first and the scoop link last. The ingredient-reference disclosure opened on both sizes, including the missing-number-12 notice on Copa Banana. The checked detail view fit both widths. |

Two presentation issues were corrected during review. The scoop link now follows the flavors, and shoppers can read the flyer’s ingredient-number key directly on product detail pages.

## Ordering checks

The server accepted a €14.00 merchandise basket at the threshold and added €2.00 delivery. It rejected a lower subtotal, an incomplete postcode, a postcode outside the preview zone, a foreign destination and a zero quantity. Product checks covered a seasonal strawberry cup, a rotating flavor, the children’s cream-bonus exclusion, the fixed vanilla recipe for Spaghetti Eis, the Eisschokolade cream bonus, milkshake scoop counts and an unassigned extra.

| Paid Stripe test purchase | Verified in Stripe and the private Sanity order |
|---|---|
| SPAGHETTI EIS normal, without cream, plus MARIENKÄFER normal | €8.50 + €6.50 + €2.00 delivery = **€17.00**. The invoice and saved order retained “ohne Sahne, +1 Kugel”. Rechecked the completed Step 6 purchase. |
| MATCHA TIME with Haferdrink plus Portion Früchte / Sauerkirschen | €10.30 + €0.50 + €3.20 + €2.00 delivery = **€16.00**. Completed a new mobile test purchase. The invoice and order retained the oat drink and cherry selections. |

Each purchase produced one matching private order with a paid invoice link. Checkout used a test card and a non-deliverable test email address. Inbox delivery remains unverified.

## Decisions before customer orders

- **Food information:** obtain the meaning of footnote 12 and resolve the different Amarena cherry references with the client.
- **Stock and choices:** confirm current rotating flavors and seasonal dishes, eligible extras, separately selectable grouped options, standalone portions and the bonus-scoop flavor rule. Regular items currently use simulated availability for preview purchases.
- **Delivery and packaging:** the test postcode is 22846. Confirm actual address coverage, seasonal hours, dispatch rules, minimum-order calculation and which reusable containers and deposits apply. The tested totals use standard packaging.
- **Business and billing:** confirm public branding, business invoice details, production VAT settings and invoice email delivery. The preview uses test tax settings.

**Next gate:** explicit approval for Step 8 and the intended release scope. A public test demo and a store accepting real orders are separate release decisions.
