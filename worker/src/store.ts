export interface UserRow {
  id: string
  username: string
  password_hash: string
  salt: string
  role: string
  created_at: number
}

export interface PublicUser {
  id: string
  username: string
  role: string
  createdAt: number
}

export async function findUser(db: D1Database, username: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT id, username, password_hash, salt, role, created_at FROM users WHERE username = ?')
    .bind(username)
    .first<UserRow>()
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare('SELECT id, username, password_hash, salt, role, created_at FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>()
}

export async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS total FROM users').first<{ total: number }>()
  return row?.total ?? 0
}

export async function listUsers(db: D1Database): Promise<PublicUser[]> {
  const { results } = await db
    .prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC')
    .all<{ id: string; username: string; role: string; created_at: number }>()
  return (results ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  }))
}

export async function insertUser(
  db: D1Database,
  user: { id: string; username: string; hash: string; salt: string; role: string },
): Promise<void> {
  await db
    .prepare('INSERT INTO users (id, username, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(user.id, user.username, user.hash, user.salt, user.role, Date.now())
    .run()
}

export async function readConfig(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM app_config WHERE key = ?').bind(key).first<{ value: string }>()
  return row?.value ?? null
}

export async function writeConfig(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare('INSERT INTO app_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, value)
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
