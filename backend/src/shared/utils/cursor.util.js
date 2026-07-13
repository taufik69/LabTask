// keyset-pagination cursor: base64("<createdAt-ISO>_<_id>")
const encodeCursor = (doc) => {
  const raw = `${new Date(doc.createdAt).toISOString()}_${doc._id}`;
  return Buffer.from(raw, "utf-8").toString("base64url");
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;

  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf-8");
    const [createdAtStr, _id] = raw.split("_");
    const createdAt = new Date(createdAtStr);
    if (Number.isNaN(createdAt.getTime()) || !_id) return null;
    return { createdAt, _id };
  } catch {
    return null;
  }
};

export { encodeCursor, decodeCursor };
