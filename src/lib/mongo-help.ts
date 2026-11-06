import dns from "node:dns";

/** Public resolvers used only when this computer's own DNS cannot look up an Atlas address. */
const FALLBACK_DNS = "1.1.1.1,8.8.8.8";

/** The host of an Atlas style `mongodb+srv://` address, or null for a normal `mongodb://` address. */
export function srvHost(uri: string | undefined): string | null {
  return uri?.match(/^mongodb\+srv:\/\/(?:[^@/]*@)?([^/?:@]+)/i)?.[1] ?? null;
}

/**
 * Atlas addresses (`mongodb+srv://`) need a DNS "SRV" lookup. On some Windows setups, VPNs and home routers Node's resolver
 * cannot reach its DNS server and fails with `querySrv ECONNREFUSED`, even though the browser works fine.
 * This tests the lookup once and, only when it fails, adds public resolvers as a fallback. Set `DNS_SERVERS=system` to turn it off
 * or `DNS_SERVERS=9.9.9.9,1.1.1.1` to choose other resolvers.
 */
export async function ensureSrvDns(uri: string | undefined, log: (message: string) => void = console.warn): Promise<void> {
  const host = srvHost(uri);
  if (!host || (process.env.DNS_SERVERS ?? "").trim().toLowerCase() === "system") return;
  const probe = () => dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  try {
    await probe();
    return;
  } catch {
    // fall through to the fallback below
  }
  const system = dns.getServers();
  const fallback = (process.env.DNS_SERVERS?.trim() || FALLBACK_DNS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    dns.setServers([...new Set([...fallback, ...system])]);
    await probe();
    log(`[AcademiaConnect] This computer's DNS (${system.join(", ") || "none"}) could not look up ${host}, so ${fallback.join(" and ")} is used for that lookup.`);
  } catch {
    try {
      dns.setServers(system);
    } catch {
      // keep whatever is configured
    }
  }
}

/** Turns a MongoDB connection failure into a few plain sentences that say what to do. */
export function explainMongoError(err: unknown, uri: string | undefined, envFile = ".env.local"): string {
  const e = err as { message?: string; code?: string | number; cause?: { code?: string } };
  const text = `${e?.message ?? err} ${e?.code ?? ""} ${e?.cause?.code ?? ""}`;
  const host = srvHost(uri) ?? uri?.match(/^mongodb:\/\/(?:[^@/]*@)?([^/?,:]+)/i)?.[1] ?? "the database";
  const where = `MONGODB_URI in ${envFile}`;

  if (!uri || /USER:PASSWORD|<password>|<db_password>|CLUSTER\.mongodb|xxxxx/i.test(uri)) {
    return `${where} still has the example text. Replace it with your own connection string (Atlas: Connect, Drivers) or with mongodb://127.0.0.1:27017 for a MongoDB on this computer.`;
  }
  if (/bad auth|authentication failed|auth failed/i.test(text)) {
    return `MongoDB rejected the user name or password in ${where}. Check them in Atlas under Database Access. If the password has symbols such as @ : / or #, write them as % codes (for example @ becomes %40).`;
  }
  if (/querySrv|queryTxt|ENOTFOUND|ENODATA|EAI_AGAIN|ETIMEOUT/i.test(text) && !/ETIMEDOUT/.test(text)) {
    return [
      `This computer could not look up the database address (${host}). That is a DNS problem on this network, not a problem in the app.`,
      `Try these in order:`,
      `  1. Switch to another network (a phone hotspot is a quick test) or turn off your VPN.`,
      `  2. Set your computer's DNS servers to 1.1.1.1 and 8.8.8.8. On Windows: Settings, Network and internet, your connection, DNS server assignment.`,
      `  3. In Atlas choose Connect, Drivers and copy the older "standard" connection string that starts with mongodb:// (not mongodb+srv://) into ${where}.`,
      `  4. Check in Atlas that the cluster still exists and is not paused.`,
    ].join("\n");
  }
  if (/ECONNREFUSED/.test(text) && /127\.0\.0\.1|localhost|::1/.test(text)) {
    return `No MongoDB is running on this computer. Either start one, or put your Atlas connection string in ${where} (and in server/.env for the API).`;
  }
  if (/whitelist|not allowed|ServerSelection|Could not connect to any servers|ETIMEDOUT|timed out/i.test(text)) {
    return `Atlas did not answer. The usual cause is that it does not allow this computer's IP address yet. In Atlas open Network Access and add your current IP address, or 0.0.0.0/0 (allow from anywhere) while you are developing. Also check that the cluster is not paused.`;
  }
  return `Could not connect to MongoDB (${host}): ${e?.message ?? err}. Check ${where}.`;
}

/**
 * Runs once when the website's server starts. Applies the DNS fallback, and while developing checks the database right away,
 * so a wrong connection string is explained in the terminal instead of showing up later as a failed sign in.
 */
export async function checkDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  await ensureSrvDns(uri);
  if (process.env.NODE_ENV === "production") return;

  const dbName = process.env.MONGODB_DB ?? "academiaconnect";
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri ?? "mongodb://127.0.0.1:27017", { serverSelectionTimeoutMS: 10_000 });
  try {
    await client.connect();
    const accounts = await client.db(dbName).collection("user").estimatedDocumentCount();
    console.log(
      `[AcademiaConnect] MongoDB connected (database "${dbName}").` +
        (accounts === 0 ? " It has no accounts yet: create one on the Register page, or run `npm run seed` in the server folder to load the demo accounts." : ""),
    );
  } catch (err) {
    console.error(`\n[AcademiaConnect] The website cannot reach MongoDB, so sign up and login will fail.\n${explainMongoError(err, uri, "client/.env.local")}\n`);
  } finally {
    await client.close().catch(() => {});
  }
}
