import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import project from "./project.json";
import product from "./product.js";
import {menuCollection, menuProduct} from "./menu.js";
import order, {orderStatuses} from "./order.js";

const catalog = {
  ...project,
  name: "loeffelwerk",
  basePath: "/",
  title: "Löffelwerk Studio",
  plugins: [structureTool({
    structure: S => S.list().title("Catalog").items([
      S.listItem().id("browse-menu").title("Browse products by collection").child(
        S.documentTypeList("menuCollection").title("Menu collections")
          .defaultOrdering([{field: "position", direction: "asc"}])
          .child(id => S.documentTypeList("menuProduct").title("Collection products")
            .filter('_type == "menuProduct" && (primaryCollection._ref == $id || $id in otherCollections[]._ref)')
            .params({id: id.replace(/^drafts\./, "")})
            .defaultOrdering([{field: "position", direction: "asc"}])),
      ),
      ...S.documentTypeListItems(),
    ]),
  })],
  schema: {types: [menuCollection, menuProduct, product]},
};

const ordersDataset = process.env.SANITY_STUDIO_ORDERS_DATASET?.trim();
const orders = {
  projectId: project.projectId,
  dataset: ordersDataset,
  name: "orders",
  basePath: "/orders",
  title: "Löffelwerk Orders",
  schema: {types: [order]},
  plugins: [structureTool({
    structure: S => S.list().title("Orders").items(orderStatuses.map(({title, value}) =>
      S.listItem().id(value).title(title).child(
        S.documentTypeList("order").title(title).filter('_type == "order" && status == $status')
          .params({status: value}).defaultOrdering([{field: "paidAt", direction: "desc"}]),
      ),
    )),
  })],
  document: {
    newDocumentOptions: () => [],
    actions: actions => actions.filter(action => !["delete", "duplicate", "unpublish"].includes(action.action)),
  },
};

export default defineConfig(ordersDataset && ordersDataset !== project.dataset ? [catalog, orders] : catalog);
