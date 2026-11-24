import {defineField, defineType} from "sanity";

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({name: "name", title: "German product name", type: "string", validation: (rule) => rule.required()}),
    defineField({
      name: "slug", title: "Product identifier", type: "slug", options: {source: "name"},
      description: "Keep this identifier stable after publishing. Use erdbeere for the strawberry product.",
      validation: (rule) => rule.required(),
    }),
    defineField({name: "description", title: "German description", type: "text", rows: 2, validation: (rule) => rule.required()}),
    defineField({name: "image", title: "Product image", type: "image", validation: (rule) => rule.required().assetRequired()}),
    defineField({name: "sizeMl", title: "Pack size (ml)", type: "number", initialValue: 500, validation: (rule) => rule.required().integer().min(1)}),
    defineField({name: "priceCents", title: "Price (euro cents)", type: "number", validation: (rule) => rule.required().integer().min(1)}),
    defineField({name: "available", title: "Available to add to cart", type: "boolean", initialValue: false, validation: (rule) => rule.required()}),
    defineField({name: "ingredients", title: "German ingredient list", type: "text", rows: 3}),
    defineField({name: "allergens", title: "German allergen statement", type: "text", rows: 2}),
    defineField({
      name: "foodDetailsVerified", title: "Ingredient and allergen information verified", type: "boolean", initialValue: false,
      description: "Enable after checking both fields against the approved product information.",
      validation: rule => rule.custom((verified, {document}) =>
        !verified || (document?.ingredients?.trim() && document?.allergens?.trim())
          ? true : "Enter both the verified ingredient list and allergen statement.",
      ),
    }),
  ],
  preview: {select: {title: "name", media: "image"}},
});
