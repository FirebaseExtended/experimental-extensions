import { getFunctions } from "firebase-admin/functions";

export async function enqueueTask(address: string, docId: string) {
  // Retry the request if it fails.
  const queue = getFunctions().taskQueue(
    `ext-${process.env.EXT_INSTANCE_ID}-updateLatLong`,
    process.env.EXT_INSTANCE_ID
  );

  await queue.enqueue(
    {
      name: docId,
      address: address,
      docId: docId,
    },
    // Retry the request after 30 days.
    { scheduleDelaySeconds: 30 * 24 * 60 * 60 }
  );
}
