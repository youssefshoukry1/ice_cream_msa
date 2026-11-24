import {defineArrayMember, defineField, defineType} from "sanity";

export const orderStatuses = [
  {title: "Paid", value: "paid"},
  {title: "Processing", value: "processing"},
  {title: "Shipped", value: "shipped"},
  {title: "Canceled", value: "canceled"},
];

export default defineType({
  name: "order",
  title: "Order",
  type: "document",
  liveEdit: true,
  fields: [
    defineField({
      name: "status", title: "Fulfillment status", type: "string",
      options: {list: orderStatuses, layout: "radio"},
      validation: rule => rule.required().valid(...orderStatuses.map(status => status.value)),
    }),
    defineField({name: "paidAt", title: "Payment timestamp", type: "datetime", readOnly: true}),
    defineField({name: "stripeSessionId", title: "Stripe Checkout Session", type: "string", readOnly: true}),
    defineField({name: "stripePaymentIntentId", title: "Stripe PaymentIntent", type: "string", readOnly: true}),
    defineField({
      name: "invoice", title: "Paid Stripe invoice", type: "object", readOnly: true,
      fields: [
        defineField({name: "stripeId", title: "Stripe invoice ID", type: "string"}),
        defineField({name: "number", title: "Invoice number", type: "string"}),
      ],
    }),
    defineField({name: "currency", type: "string", readOnly: true}),
    defineField({name: "subtotalCents", title: "Merchandise subtotal (cents)", type: "number", readOnly: true}),
    defineField({name: "shippingCents", title: "Shipping (cents)", type: "number", readOnly: true}),
    defineField({name: "totalCents", title: "Paid total (cents)", type: "number", readOnly: true}),
    defineField({
      name: "refundStatus", title: "Stripe refund reconciliation", type: "string",
      description: "Record the status after verifying the refund in Stripe. This field does not issue a refund.",
      options: {list: [
        {title: "No refund recorded", value: "none"},
        {title: "Partial refund", value: "partial"},
        {title: "Full refund", value: "refunded"},
      ]},
    }),
    defineField({
      name: "refundReferences", title: "Stripe refund IDs", type: "array", of: [{type: "string"}],
      description: "Copy the verified refund IDs from Stripe. Enter one ID per item.",
    }),
    defineField({
      name: "lines", title: "Purchased items", type: "array", readOnly: true,
      of: [defineArrayMember({
        type: "object",
        fields: [
          defineField({name: "productId", title: "Product identifier", type: "string"}),
          defineField({name: "name", type: "string"}),
          defineField({name: "quantity", type: "number"}),
          defineField({name: "unitPriceCents", title: "Unit price (cents)", type: "number"}),
          defineField({name: "totalCents", title: "Line total (cents)", type: "number"}),
        ],
        preview: {select: {title: "name", subtitle: "quantity"}},
      })],
    }),
    defineField({name: "contactEmail", title: "Order contact email", type: "string", readOnly: true}),
    defineField({
      name: "shipping", title: "Delivery details", type: "object", readOnly: true,
      fields: [
        defineField({name: "name", title: "Recipient", type: "string"}),
        defineField({name: "line1", title: "Address line 1", type: "string"}),
        defineField({name: "line2", title: "Address line 2", type: "string"}),
        defineField({name: "postalCode", title: "Postal code", type: "string"}),
        defineField({name: "city", type: "string"}),
        defineField({name: "country", type: "string"}),
      ],
    }),
  ],
  preview: {
    select: {session: "stripeSessionId", status: "status", total: "totalCents", currency: "currency"},
    prepare({session, status, total, currency}) {
      const label = orderStatuses.find(option => option.value === status)?.title ?? "Order";
      return {
        title: session ? `Order …${session.slice(-12)}` : "Order",
        subtitle: Number.isInteger(total) && currency ? `${label} · ${(total / 100).toFixed(2)} ${currency}` : label,
      };
    },
  },
});
