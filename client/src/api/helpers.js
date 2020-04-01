export const handleSuccess = resp => resp.body;

export const handleError = ({ response }) => {
  if (!response) response = { status: 500, body: { message: "Internal Server error" } };
  throw response;
};
