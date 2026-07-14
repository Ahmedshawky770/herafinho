export function createWebhookWorker() {
  return {
    close: () => Promise.resolve(),
  };
}
