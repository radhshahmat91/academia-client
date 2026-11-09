export async function register() {
  // Only the Node.js server talks to MongoDB. The check is written as "is Node.js" (not "is not Node.js, then return")
  // so that webpack can drop the whole branch from the Edge build instead of trying to bundle the MongoDB driver for it.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkDatabase } = await import("./lib/mongo-help");
    await checkDatabase();
  }
}
