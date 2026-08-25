import { PrismaPg } from "@prisma/adapter-pg";

export function postgresAdapter(connectionString: string) {
  return new PrismaPg({ connectionString: withHostedPostgresSsl(connectionString) });
}

function withHostedPostgresSsl(connectionString: string) {
  const url = new URL(connectionString);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (isLocal) return connectionString;
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}
