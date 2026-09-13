// "better-sqlite3" isteğini test adaptörüne yönlendiren ESM yükleyicisi.
import { pathToFileURL } from "node:url";
const ADAPTER = pathToFileURL(new URL("./sqlite-adapter.mjs", import.meta.url).pathname).href;
export async function resolve(specifier, context, next) {
  if (specifier === "better-sqlite3") return { url: ADAPTER, shortCircuit: true };
  return next(specifier, context);
}
