import {quoteOrder} from "../../../../lib/server-quote.mjs";

const headers = {"Cache-Control": "no-store"};

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({error: "INVALID_CART"}, {status: 400, headers});
  }
  try {
    const result = await quoteOrder(input);
    const status = !result.error ? 200 : ["INVALID_ADDRESS", "INVALID_CART"].includes(result.error) ? 400 : 422;
    return Response.json(result, {status, headers});
  } catch {
    return Response.json({error: "QUOTE_UNAVAILABLE"}, {status: 503, headers});
  }
}
