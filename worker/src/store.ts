export interface UserRow {
  id: string
  username: string
  password_hash: string
  salt: string
  created_at: number
}

export async function findUser(db: D1Database, username: string): Promise<UserRow | null> {
  return db.prepare('SELECT id, username, password_hash, salt, created_at FROM users WHERE username = ?').bind(username).first<UserRow>()
}

export async function insertUser(
  db: D1Database,
  user: { id: string; username: string; hash: string; salt: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO users (id, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(user.id, user.username, user.hash, user.salt, Date.now())
    .run()
}

export async function readData(db: D1Database, userId: string): Promise<{ payload: string; updated_at: number } | null> {
  return db.prepare('SELECT payload, updated_at FROM user_data WHERE user_id = ?').bind(userId).first<{
    payload: string
    updated_at: number
  }>()
}

export async function writeData(db: D1Database, userId: string, payload: string, updatedAt: number): Promise<void> {
  await db
    .prepare(
      'INSERT INTO user_data (user_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at',
    )
    .bind(userId, payload, updatedAt)
    .run()
}
