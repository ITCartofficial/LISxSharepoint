let token: string | null = null;
let siteId: string | null = null;
let postListId: string | null = null;
let promptListId: string | null = null;

export const setSPToken = (value: string) => {
  token = value;
};

export const setSPSiteId = (value: string) => {
  siteId = value;
};

export const setPostListId = (value: string) => {
  postListId = value;
};

export const setPromptListId = (value: string) => {
  promptListId = value;
};

export const getSPToken = (): string | null => {
  return token;
};

export const getSPSiteId = (): string | null => {
  return siteId;
};

export const getPromptListId = (): string | null => {
  return promptListId;
};

export const getPostListId = (): string | null => {
  return postListId;
};


