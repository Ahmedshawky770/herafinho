export function createEmailQueue() {
  return {
    add: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };
}

export function createEmailWorker() {
  return {
    close: () => Promise.resolve(),
  };
}
