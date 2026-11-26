import {quoteOrder} from "../../../../lib/server-quote.mjs";
import {allowedCheckoutOrigin, createSandboxSession, stripeSandbox} from "../../../../lib/stripe-checkout.mjs";

const headers = {"Cache-Control": "no-store"};
const attemptPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function failure(error, status) {
  return Response.json({error}, {status, headers});
}

export async function POST(request) {
  const origin = allowedCheckoutOrigin(request.headers.get("origin"));
  if (!origin) return failure("INVALID_ORIGIN", 403);
  if (process.env.CHECKOUT_PAUSED === "true") return failure("CHECKOUT_PAUSED", 503);

  let input;
  try {
    input = await request.json();
  } catch {
    return failure("INVALID_CART", 400);
  }
  if (typeof input?.attemptId !== "string" || !attemptPattern.test(input.attemptId) ||
      !Number.isSafeInteger(input.expectedTotalCents) || input.expectedTotalCents < 1) {
    return failure("INVALID_CART", 400);
  }

  try {
    if (process.env.VERCEL_ENV === "production" && input.catalog !== "eistaxi-preview") return failure("INVALID_CART", 400);
    const quote = await quoteOrder(input);
    if (quote.error) return Response.json(quote, {status: 422, headers});
    if (quote.totalCents !== input.expectedTotalCents) return failure("QUOTE_CHANGED", 409);

    const stripe = stripeSandbox();
    if (!stripe) return failure("CHECKOUT_NOT_CONFIGURED", 503);

    const url = await createSandboxSession(stripe, quote, input.attemptId, origin);
    return Response.json({url}, {headers});
  } catch (error) {
    // Stripe error payloads can contain request details. Log the type only.
    console.error("Sandbox Checkout session could not be created", error.type || error.name);
    return failure("CHECKOUT_UNAVAILABLE", 503);
  }
}
