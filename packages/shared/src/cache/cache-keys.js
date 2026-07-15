export const CACHE_KEYS = {
    CRAFTSMAN_PROFILE: (id) => `craftsman:profile:${id}`,
    CRAFTSMAN_LIST: (craftType) => `craftsman:list:${craftType}`,
    ORDER: (id) => `order:${id}`,
    USER: (id) => `user:${id}`,
    SEARCH_RESULTS: (params) => `search:${JSON.stringify(params)}`,
};
