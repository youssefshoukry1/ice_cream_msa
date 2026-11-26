# Client menu rollout plan

**Status — awaiting approval to start Step 1.** Each approval authorizes one numbered step. At the end of each step, I will present its deliverable and wait for your explicit approval before beginning the next one. Publishing requires Step 8 approval.

## Source and collection strategy

The supplied two-page PDF is the *Eis-Taxi Lieferservice Karte 2026*. Page 1 combines flavors, drinks, extras and delivery information. Page 2 presents photographed desserts, including children’s cups, several Spaghetti Eis preparations and products with size-specific prices. Its text does not extract as selectable copy, so each entry needs a visual check. The current demo uses the Löffelwerk name and a product model built around 500 ml tubs. The menu rollout needs a decision on storefront branding as well as new product structures.

I propose the following shopper-facing collections. The German navigation labels are proposals for approval. Product titles, descriptions and prices will follow the print source.

| Proposed collection | What belongs there |
| --- | --- |
| Eissorten | Individual flavors from page 1. Preserve the distinction between always available and rotating flavors. Confirm which can be ordered separately. |
| Eisbecher | The main dessert collection. Let shoppers filter by menu families such as fruit, nuts or chocolate, using verified product information. |
| Kinderbecher | Children’s designs such as Panda Bär and Marienkäfer. Preserve the children’s exception to the cream substitution offer. |
| Spaghetti Eis | Group the named Spaghetti Eis preparations. A product can also appear under Eisbecher while sharing one price and stock record. |
| Shakes & Getränke | Group shakes, iced coffee, iced chocolate, smoothies and other drinks, retaining their printed sizes. |
| Extras | Present eligible sauces, toppings and portions beside the products they complement. Confirm which extras customers can buy on their own. |

## Delivery steps and approval gates

1. **Transcribe and reconcile the menu.** Build a review sheet with one row per product or extra, its page and position, printed German title and description, sizes, euro prices, footnote markers and photo reference. Record delivery terms and menu-wide offers separately. Cross-check every row against an enlarged page. Flag unreadable or missing information for the client. **Review:** approve the inventory and resolve or explicitly defer flagged entries.
2. **Approve the collection map and selling rules.** Assign every approved item a primary collection, optional secondary collections and display order. Identify selectable sizes, extras, availability and the products eligible for offers. Confirm the public brand, delivery area, minimum order and fees before replacing demo settings. **Review:** approve a collection-by-product matrix and a sample customer ordering journey.
3. **Approve an image proof.** Extract the highest-resolution embedded artwork available and compare it with the printed reference. Start with a detailed sundae, a children’s design and a drink. Preserve the original serving vessel, scoop count, toppings, colors and framing. Use client originals wherever possible for an exact match. If the print asset lacks detail, present a reference-based recreation side by side for approval. Generated detail is an approximation. **Review:** approve the samples at actual mobile card and desktop detail sizes.
4. **Produce the full image library.** Apply the approved treatment to every mapped photo. Target a 1600 px long-edge master where source detail supports it, with responsive 320, 640 and 960 px web versions and a larger detail view. Preserve tall garnishes and glassware. Group photos and missing individual references require an explicit mapping decision. **Review:** approve a labeled contact sheet and any exceptions.
5. **Build the catalog in Sanity.** Create ordered collection documents and reusable product references, with fields for printed copy, approved images, variants, integer-cent prices, extras and availability. Support pieces, portions and drinks alongside tubs. Import into a review dataset or drafts with stable IDs so repeat imports update the same items. **Review:** check collection counts, sample records and an editor’s price-change workflow.
6. **Connect collections and checkout in a preview.** Build collection navigation, collection pages and product details. Connect selected sizes and extras to the cart and server-side price calculation. Carry the purchased selections and amounts into Stripe test checkout, the saved order and the invoice. **Review:** approve mobile and desktop previews and a sample test order.
7. **Verify the full menu.** Compare every displayed title, description, size, price and photo to its approved source row. Check cross-listed products, unavailable items, delivery rules and menu-wide exceptions. Follow representative purchases through payment, order recording and invoice totals. **Review:** approve the verification report and release candidate.
8. **Publish the approved catalog.** After explicit release approval, back up the current catalog, publish the approved records and storefront, and verify collection links, photos, variants and totals on Vercel. Record the previous deployment and catalog version for rollback. Activating real payments requires separate authorization. **Deliverable:** published links and a short handover for editing collections, products and prices.
