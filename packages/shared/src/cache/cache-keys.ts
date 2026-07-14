export const CACHE_KEYS = {
  CRAFTSMAN_PROFILE: (id: string) => `craftsman:profile:${id}`,
  CRAFTSMAN_LIST: (craftType: string) => `craftsman:list:${craftType}`,
  ORDER: (id: string) => `order:${id}`,
  USER: (id: string) => `user:${id}`,
  SEARCH_RESULTS: (params: Record<string, string>) => `search:${JSON.stringify(params)}`,
} as const;
