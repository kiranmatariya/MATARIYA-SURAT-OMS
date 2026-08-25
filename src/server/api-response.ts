export function apiError(error: unknown) {
  const raw = error instanceof Error ? error.message : "Unexpected server error.";
  const message = raw.includes("expired transaction") || raw.includes("Transaction API error")
    ? "The database was briefly slow and could not complete this action. Please try again."
    : raw;
  return Response.json({ error: message }, { status: message.includes("not found") ? 404 : 400 });
}
