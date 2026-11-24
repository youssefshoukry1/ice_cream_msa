import "server-only";
import {createClient} from "@sanity/client";
import project from "../../studio/project.json" with {type: "json"};

export const sanity = createClient({
  projectId: process.env.SANITY_PROJECT_ID || project.projectId,
  dataset: process.env.SANITY_DATASET || project.dataset,
  apiVersion: "2025-02-19",
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN || undefined,
  perspective: "published",
});
