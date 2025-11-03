let token: string | null = null;
let siteId: string | null = null;
let listId: string | null = null;

export const setSPToken = (value: string) => {
  token = value;
};

export const setSPSiteId = (value: string) => {
  siteId = value;
};

export const setSPListId = (value: string) => {
  listId = value;
};

export const getSPToken = (): string | null => {
  return token;
};

export const getSPSiteId = (): string | null => {
  return siteId;
};
export const getSPListId = (): string | null => {
  return listId;
};
