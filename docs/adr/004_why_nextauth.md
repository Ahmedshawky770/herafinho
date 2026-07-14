# ADR-004: Choosing NextAuth v4 (Auth.js) over Custom JWT Implementation

> **Status note (Implementation):** The original decision (recorded above) was made for **NextAuth v5**. The version actually installed and implemented is **next-auth v4** (`next-auth@^4.24.14`), which is what the code samples in this repo reflect. The rationale below remains valid; only the major version differs.

| Status | Accepted |
|--------|----------|
| Date | 2026-07-01 |
| Author | Ahmed Shawky |
| Reviewers | — |

---

## Context

Harfino requires authentication for 3 user roles (client, craftsman, admin) with:
- Google OAuth 2.0 as the sole identity provider.
- Session management with role-based access control.
- WebSocket authentication (JWT in handshake).
- No password storage or email/password login.

Options:
1. **Custom JWT** (manually issue + verify JWTs using `jose` or `jsonwebtoken`)
2. **NextAuth v4 (Auth.js)** — framework-agnostic auth library, Next.js-native
3. **Clerk / Supabase Auth / Firebase Auth** — third-party auth platforms

---

## Decision

We chose **NextAuth v4 (Auth.js)**.

### Rationale

| Criterion | NextAuth v4 | Custom JWT | Clerk / Supabase / Firebase |
|-----------|------------|------------|-----------------------------|
| **Google OAuth** | Built-in provider | Manual OAuth flow | Built-in |
| **Session strategy** | JWT or database (configurable) | Manual JWT | Managed platform |
| **Framework fit** | Next.js App Router (v4 compatible) | Agnostic (more code) | External dependency |
| **Type safety** | Full TypeScript | Manual typings | API-dependent |
| **CSRF protection** | Built-in | Manual | Built-in |
| **Session management** | Cookie-based + hooks | Manual cookie handling | Managed |
| **WebSocket auth** | Extract JWT from session | Manual token extraction | SDK-dependent |
| **Operational overhead** | Low (library handles edge cases) | High (implement securely yourself) | High (vendor lock-in) |
| **Cost** | Free (MIT) | Free (library) | Freemium / paid tiers |

### Why not Custom JWT?
- **Security**: CSRF protection, PKCE, token rotation, cookie flags (`__Host-`, `__Secure-`) are hard to get right.
- **Time**: A secure custom implementation takes ~1–2 weeks and must be maintained. NextAuth is maintained by the framework team.
- **Edge cases**: Session expiration, token refresh, OAuth callback errors, account linking.

### Why not third-party auth (Clerk / Supabase)?
- **Vendor lock-in**: Harfino's data model is custom (craftsman profiles with 9-step onboarding, freeze/ban logic, 3-strike auto-ban). Clerk/Supabase Auth adds a dependency that may not fit.
- **Cost**: These platforms charge at scale. Harfino wants to minimize recurring costs.
- **Data residency**: Egyptian users → data should remain in our control.

---

## Consequences

### Good
- **Production-ready OAuth flow** — Google provider handles edge cases (token refresh, consent prompts, account linking).
- **Type-safe sessions** — `auth()` helper available in Route Handlers + Server Components.
- **Middleware integration** — `auth()` in `middleware.ts` for route protection.
- **Extensible** — supports JWT, database sessions, custom callbacks.

### Bad
- **Library abstraction** — debugging NextAuth internals can be opaque.
- **Version lock** — v4 is mature and stable; breaking changes are rare between minor versions.
- **Custom claims** — adding `role` and `googleId` to JWT requires custom callbacks.

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| NextAuth v4 API changes | Low | Medium | Pin version; test on upgrade |
| JWT size limit (4 kB) exceeded | Low | Low | Keep session payload minimal (userId, role, googleId only) |
| Google OAuth scope changes | Low | Medium | Monitor Google changelog |

---

## Session Model

```typescript
// libs/auth/options.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.googleId = profile.sub;
        token.email = profile.email;
        token.role = (await getUserRole(profile.sub)) ?? 'client';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.googleId = token.googleId as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
```

---

## Alternatives Considered

### Custom JWT with `jose`
- **Why rejected**: Security-critical code that must be maintained forever. NextAuth is the "boring" secure choice.

### Clerk
- **Why rejected**: Expensive at scale; organization management adds complexity; not worth it for MVP.

### Supabase Auth
- **Why rejected**: Pulls in Supabase client + PostgREST; Harfino already chose Drizzle + raw PostgreSQL. Supabase Auth couples us to Supabase's pricing and API.

### Firebase Auth
- **Why rejected**: Google ecosystem dependency; Harfino wants to stay provider-agnostic where possible. Also NoSQL-centric; our data is relational.

---

## References
- [NextAuth.js Docs](https://authjs.dev/)
- [Auth.js GitHub](https://github.com/nextauthjs/next-auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)

---

## Related Documents
- [Project Plan](../plan.md)
- [Sequence — Google OAuth Login](../diagrams/seq-google-oauth.md)
- [Security Architecture](../diagrams/security-architecture.md)
