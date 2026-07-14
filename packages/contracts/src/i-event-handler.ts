export interface EventHandler {
  handle(event: { name: string; payload: Record<string, unknown> }): Promise<void>;
}
