import postgres from 'postgres';

/**
 * The postgres default for max_connections is 100 - you can view the current setting
 * with `show max_connections`. When increasing max_connections, you also need to increase
 * shared_buffers and kernel.shmmax. Typical values are anything up to ~1/4 of the system
 * memory for shared_buffers, and slightly more than this for kernel.shmmax.
 *
 * max_connections and shared_buffers are located in /var/lib/pgsql/{version_number}/data/postgresql.conf
 * kernel.shmmax is in /etc/sysctl.conf
 *
 * Make sure you take into account that this is per server instance (so 4 instances of 25
 * connections will hit the limit of 100), and you probably want to leave a couple free
 * for connecting extenal clients for debugging/testing/migrations/etc.
 */
const MAX_CONNECTIONS = parseInt(process.env.PG_MAX_CONNECTIONS ?? "25");

declare global {
  type SqlClient = postgres.Sql<any>;
}

export const createSqlConnection = async (url?: string) => {
  url = url ?? process.env.PG_URL;
  if (!url) {
    throw new Error("PG_URL not configured");
  }
  const sql = postgres(url, {
    max: MAX_CONNECTIONS,
    onnotice: () => {},
    // debug: console.log,
  });
  await sql`SET default_toast_compression = lz4`;
  await sql`CREATE EXTENSION IF NOT EXISTS "btree_gin"`;
  return sql;
}
