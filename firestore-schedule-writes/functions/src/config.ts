

export default {
    schedule: process.env.SCHEDULE || 'every 1 minutes',
    mergeWrite: process.env.MERGE_WRITE === "true",
    queueCollection: process.env.QUEUE_COLLECTION || "queued_writes",
    targetCollection: process.env.TARGET_COLLECTION,
    stalenessThresholdSeconds: parseInt(
        process.env.STALENESS_THRESHOLD_SECONDS || "0",
        10
    ),
    cleanup: (process.env.CLEANUP as "DELETE" | "KEEP") || "DELETE"
}