// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export function createDbClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { db: { schema: 'linktree' } }
  );
}

export function createStorageClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
