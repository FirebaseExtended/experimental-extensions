export default {
  projectId: process.env.PROJECT_ID,
  schedule: process.env.SCHEDULE || "0 0 * * *", //every 24 hours
};
