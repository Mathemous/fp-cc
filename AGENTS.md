# Project workflow

- After completing and validating requested changes, commit them and push the current branch to its configured upstream automatically.
- Do not wait for a separate reminder to push unless the user explicitly says not to push.
- If no Git upstream is configured, say that clearly and still publish the validated app to Vercel production when the change affects the live site.
- Never commit or push credentials, secrets, private keys, or unrelated user files.
