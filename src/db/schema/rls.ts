import { sql } from "drizzle-orm";

export const enableRLS = (table: string) => {
  return sql.raw(`alter table ${table} enable row level security;`);
};

export const createPolicy = (name: string, table: string, operation: string, using: string) => {
  return sql.raw(`create policy "${name}" on ${table} for ${operation} to authenticated using (${using});`);
};

export const createPolicyWithCheck = (name: string, table: string, operation: string, check: string) => {
  return sql.raw(`create policy "${name}" on ${table} for ${operation} to authenticated with check (${check});`);
};