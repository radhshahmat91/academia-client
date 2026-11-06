export async function register() {
  // Only the Node.js server talks to MongoDB
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkDatabase } = await import("./lib/mongo-help");
  await checkDatabase();
}
