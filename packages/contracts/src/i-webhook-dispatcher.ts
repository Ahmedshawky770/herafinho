export interface IWebhookDispatcher {
  dispatch(event: string, payload: Record<string, unknown>): Promise<void>;
}
