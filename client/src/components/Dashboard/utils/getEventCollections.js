import request from "superagent";

export default async (projectId) => {
  try {
    const info = await request.get(`/api/projects/${projectId}/queries/collections`);
    return info.body;
  } catch (error) {
    return {};
  }
};
