// SQLite stores nested/array fields as JSON TEXT columns; these helpers convert
// rows back into the shape the frontend expects (parsed JSON, booleans instead
// of 0/1) when reading, and back into TEXT when writing.
const JSON_FIELDS = {
  mechanics: ["hoursText", "services", "staff", "reviewList", "verificationDocs", "brandsServiced", "paymentMethods"],
  vehicles: ["reminderOverrides", "customReminders", "history"],
  owners: ["favoriteIds", "favoriteMechanicIds", "likedReviewIds"],
  listings: ["offers", "messages", "features", "photos"],
  conversations: ["messages"],
  job_listings: ["requirements", "skills", "applicants"],
  appointments: ["issuePhotos"],
  support_tickets: ["adminReplies"],
  quote_requests: ["photos", "mechanicIds"],
};
const BOOL_FIELDS = {
  mechanics: ["verified"],
  appointments: ["autoAccepted", "reviewed", "noShow", "historyShareConsent", "depositRefunded"],
  support_tickets: ["refunded"],
  listings: ["tradeIn", "negotiable", "featured", "adminRemoved"],
};

export function hydrate(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS[table] || []) {
    try { out[f] = JSON.parse(out[f] ?? "null"); } catch { /* leave as-is if malformed */ }
  }
  for (const f of BOOL_FIELDS[table] || []) {
    out[f] = !!out[f];
  }
  return out;
}

export function hydrateAll(table, rows) {
  return rows.map((r) => hydrate(table, r));
}

export function dehydrate(table, obj) {
  const out = { ...obj };
  for (const f of JSON_FIELDS[table] || []) {
    if (f in out) out[f] = JSON.stringify(out[f] ?? []);
  }
  for (const f of BOOL_FIELDS[table] || []) {
    if (f in out) out[f] = out[f] ? 1 : 0;
  }
  return out;
}
