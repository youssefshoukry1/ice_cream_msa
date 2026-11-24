import {sanity} from "../src/lib/sanity.mjs";

try {
  const result = await sanity.fetch('{"connected": true, "productCount": count(*[_type == "product"])}');
  if (result?.connected !== true || !Number.isInteger(result.productCount)) {
    throw new Error("The catalog query did not return the expected result.");
  }
  const {projectId, dataset} = sanity.config();
  console.log(`Sanity catalog reachable: ${projectId}/${dataset} (${result.productCount} published products).`);
} catch (error) {
  const status = error.statusCode ? ` (HTTP ${error.statusCode})` : "";
  console.error(`Sanity catalog check failed${status}. Check the project, dataset, and read permissions.`);
  process.exitCode = 1;
}
