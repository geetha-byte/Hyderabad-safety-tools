import postgres from "postgres";

const connectionString = process.env['LOCAL_DATABASE_URL'];

if (!connectionString) {
  throw new Error("LOCAL_DATABASE_URL is not configured");
}

export const localDb = postgres(connectionString, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
