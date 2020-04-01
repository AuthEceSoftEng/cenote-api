import request from "superagent";

export default async (projectId, col, readKey) => {
  try {
    const info = await request.get(`/api/projects/${projectId}/queries/count?readKey=${readKey}&event_collection=${col}`);
    return info.body.results[0].count || 0;
  } catch (error) {
    return {};
  }
};
