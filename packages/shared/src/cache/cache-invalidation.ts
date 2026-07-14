export const CACHE_INVALIDATION_RULES: Record<string, string[]> = {
  'craftsman.approved': ['craftsman:list:*', 'craftsman:profile:*'],
  'craftsman.rejected': ['craftsman:list:*', 'craftsman:profile:*'],
  'craftsman.profile_updated': ['craftsman:list:*', 'craftsman:profile:*'],
  'order.created': ['order:*'],
  'order.updated': ['order:*'],
};

export function getInvalidationPatterns(eventName: string): string[] {
  return CACHE_INVALIDATION_RULES[eventName] ?? [];
}
