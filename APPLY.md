# Applying the IQRA2 hardening branch

The work is 9 commits on top of `main` (196969d). It could not be pushed:
this session's GitHub integration has read access to `2bu3dl/IQRA2` but not
write, so both `git push` and the GitHub API returned 403 / "Resource not
accessible by integration".

## Apply the bundle

From your local clone, with `main` checked out at 196969d:

```sh
git fetch /path/to/iqra2-hardening.bundle claude/iqra2-analysis-upload-0fp2hf
git checkout -b claude/iqra2-analysis-upload-0fp2hf FETCH_HEAD
```

Then verify:

```sh
npm install
npm run verify     # syntax check across all source files, then the test suite
```

Expect: `check-syntax: 73 file(s) OK` and `7 suites, 110 tests passing`.

## To let a future session push directly

Grant the Claude GitHub App write access to the repository, then re-run.
Repository settings are under the GitHub App's installation configuration for
your account.

## Do not skip

`npm run verify` does not cover the two things that need you:

1. **Rotate the credentials.** They were removed from tracking, but they are
   still in git history and must be treated as compromised. See the top of
   the summary: GitHub 2FA recovery codes, the admin dashboard's JWT /
   session / refresh secrets, and the TLS private key.

2. **Run the Supabase migration.**
   `supabase/migrations/20260731000001_secure_recovery_tokens.sql`, in the
   Supabase SQL editor. Until it runs, every user's account-recovery token is
   readable by anyone with the anon key — which ships inside the app.
