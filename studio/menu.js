import {defineType} from "sanity";

const required = rule => rule.required();
const name = {name: "name", type: "string", validation: required};
const slug = {name: "slug", type: "slug", options: {source: "name"}, validation: required};
const collectionRef = {type: "reference", to: [{type: "menuCollection"}]};
const price = {name: "priceCents", title: "Price in euro cents", type: "number",
  validation: rule => rule.required().integer().min(0)};

export const menuCollection = defineType({
  name: "menuCollection", title: "Menu collections", type: "document",
  fields: [name, slug, {name: "position", title: "Navigation order", type: "number", validation: required}],
  orderings: [{title: "Navigation order", name: "navigation", by: [{field: "position", direction: "asc"}]}],
  preview: {select: {title: "name"}},
});

export const menuProduct = defineType({
  name: "menuProduct", title: "Menu products", type: "document",
  fields: [
    name, slug, {name: "description", title: "German menu description", type: "text"},
    {name: "primaryCollection", ...collectionRef, validation: required},
    {name: "otherCollections", type: "array", of: [collectionRef], validation: rule => rule.unique()},
    {name: "position", title: "Display order within menu panel", type: "number", validation: required},
    {name: "source", title: "Flyer location", type: "string", readOnly: true},
    {name: "image", type: "image", validation: rule => rule.required().assetRequired()},
    {name: "variants", title: "Portions and prices", type: "array", of: [{
      type: "object", fields: [{name: "label", type: "string", validation: required}, price],
      preview: {select: {label: "label", cents: "priceCents"}, prepare: ({label, cents}) =>
        ({title: label, subtitle: Number.isInteger(cents) ? (cents / 100).toLocaleString("de-DE", {style: "currency", currency: "EUR"}) : ""})},
    }]},
    {name: "options", title: "Optional substitutions and surcharges", type: "array", of: [{
      type: "object", fields: [{name: "label", type: "string", validation: required}, price],
    }]},
    {name: "extraGroups", title: "Eligible extra groups", type: "array", of: [{
      type: "reference", to: [{type: "menuProduct"}], options: {filter: 'primaryCollection._ref == "eistaxi-2026-collection-extras"'},
    }], validation: rule => rule.unique()},
    {name: "availabilityNote", title: "Printed availability", type: "string"},
    {name: "marks", title: "Printed labels", type: "array", of: [{type: "string"}]},
    {name: "available", title: "Available to order", type: "boolean", initialValue: false},
  ],
  preview: {select: {title: "name", subtitle: "source", media: "image"}},
});
