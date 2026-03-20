import { ApifyClient } from "apify-client";

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
  if (!client) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error("APIFY_API_TOKEN not set in environment");
    }
    client = new ApifyClient({ token });
  }
  return client;
}

/**
 * Run an Apify actor and return the dataset items.
 * Waits for the run to complete (polling).
 */
export async function runApifyActor<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>,
  options?: { timeoutSecs?: number; memoryMbytes?: number },
): Promise<T[]> {
  const apify = getClient();
  const timeoutSecs = options?.timeoutSecs ?? 300;
  const memoryMbytes = options?.memoryMbytes ?? 4096;

  console.log(`[apify] Starting actor ${actorId}…`);

  const run = await apify.actor(actorId).call(input, {
    timeout: timeoutSecs,
    memory: memoryMbytes,
    waitSecs: timeoutSecs,
  });

  if (run.status !== "SUCCEEDED") {
    throw new Error(
      `Apify actor ${actorId} finished with status: ${run.status}`,
    );
  }

  console.log(`[apify] Run ${run.id} completed in ${((run.stats?.runTimeSecs ?? 0)).toFixed(0)}s`);

  // Fetch dataset items
  const { items } = await apify
    .dataset(run.defaultDatasetId)
    .listItems();

  console.log(`[apify] Retrieved ${items.length} items from dataset`);

  return items as T[];
}
