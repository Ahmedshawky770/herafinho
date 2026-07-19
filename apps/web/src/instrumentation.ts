import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      // Tracing: sample a fraction of transactions in production to control cost.
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      // Profiling is opt-in and only enabled in production to limit overhead.
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV ?? 'development',
      // De-duplicate repeated errors fired in quick succession.
      maxBreadcrumbs: 50,
      // Don't crash the app if the DSN is unset (monitoring stays optional).
      enabled: Boolean(process.env.SENTRY_DSN),
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      environment: process.env.NODE_ENV ?? 'development',
      enabled: Boolean(process.env.SENTRY_DSN),
    });
  }
}
