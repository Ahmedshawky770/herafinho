# Google OAuth Failures

## Common Issues and Solutions

### "redirect_uri_mismatch" error

**Cause**: Google Cloud Console OAuth configuration mismatch.

**Solution**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. For production: `https://herafino.com/api/auth/callback/google`

### "invalid_client" or "invalid_grant"

**Cause**: Wrong client ID/secret or expired credentials.

**Solution**:
```bash
# Verify environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check for whitespace in .env.local
cat .env.local | grep GOOGLE
```

### Session not persisting after login

**Cause**: JWT callback not setting role properly.

**Solution**:
```typescript
// Verify in NextAuth options
callbacks: {
  async jwt({ token, account, profile }) {
    if (account?.provider === 'google') {
      token.googleId = profile.sub;
      token.role = await getRoleFromDb(profile.sub);
    }
    return token;
  }
}
```

### Craftsman redirected to wrong page

**Cause**: Onboarding check in middleware not detecting profile.

**Solution**:
- Verify `users.role = 'craftsman'` in database
- Check `craftsman_profiles` record exists
- Clear browser cookies and re-login