import request from "superagent";

export default async (projectId, col, readKey, num = 5) => {
  try {
    const info = await request.get(`/api/projects/${projectId}/queries/extraction?readKey=${readKey}&event_collection=${col
    }&latest=${num}`);
    return info.body.results.slice(0, num);
  } catch (error) {
    return {};
  }
};
