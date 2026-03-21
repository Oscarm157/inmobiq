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
  const timeoutSecs = options?.timeoutSecs ?? 600;
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

/**
 * Run an Apify actor in batches to avoid rate limits.
 * Splits the `urls` field from input into smaller batches,
 * runs the actor for each batch, and concatenates results.
 */
export async function runApifyActorBatched<T = Record<string, unknown>>(
  actorId: string,
  input: Record<string, unknown>,
  batchOptions?: { batchSize?: number; delayMs?: number },
  options?: { timeoutSecs?: number; memoryMbytes?: number },
): Promise<T[]> {
  const urls = input.urls as string[];
  if (!urls || urls.length === 0) {
    return runApifyActor<T>(actorId, input, options);
  }

  const batchSize = batchOptions?.batchSize ?? 2;
  const delayMs = batchOptions?.delayMs ?? 45_000;

  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  const allItems: T[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[apify] Batch ${i + 1}/${batches.length} — ${batch.length} URLs`);

    const items = await runApifyActor<T>(
      actorId,
      { ...input, urls: batch },
      options,
    );
    allItems.push(...items);

    if (i < batches.length - 1) {
      console.log(`[apify] Waiting ${(delayMs / 1000).toFixed(0)}s before next batch…`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[apify] All batches done — ${allItems.length} total items`);
  return allItems;
}
