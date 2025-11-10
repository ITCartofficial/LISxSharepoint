let postListId: string | null = null;
let promptListId: string | null = null;
let leadListId: string | null = null;
let AD_TOKEN: { access_token: string; expires_in: number } | null = null;

export const setADToken = (value: {
  access_token: string;
  expires_in: number;
}) => {
  AD_TOKEN = value;
};

export const getADToken = (): {
  access_token: string;
  expires_in: number;
} | null => {
  return AD_TOKEN;
};

export const setPostListId = (value: string) => {
  postListId = value;
};

export const getPostListId = (): string | null => {
  return postListId;
};

export const setPromptListId = (value: string) => {
  promptListId = value;
};

export const getPromptListId = (): string | null => {
  return promptListId;
};

export const setLeadListId = (value: string) => {
  leadListId = value;
};
export const getLeadListId = (): string | null => {
  return leadListId;
};
