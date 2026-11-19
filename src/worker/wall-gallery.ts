export async function latestWallPhotos(db: D1Database): Promise<{ id: string; created_at: string }[]> {
  const rows = await db.prepare("SELECT id, created_at FROM media WHERE status = 'visible' AND (thumb_path IS NOT NULL OR display_path IS NOT NULL) ORDER BY created_at DESC, id DESC LIMIT 6").all<{ id: string; created_at: string }>();
  return rows.results;
}

export async function wallPhoto(db: D1Database, bucket: R2Bucket, id: string): Promise<R2ObjectBody | null> {
  const row = await db.prepare("SELECT COALESCE(thumb_path, display_path) AS object_key FROM media WHERE id = ? AND status = 'visible'").bind(id).first<{ object_key: string | null }>();
  return row?.object_key ? bucket.get(row.object_key) : null;
}
