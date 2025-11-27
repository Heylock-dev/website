This file documents the sample dataset and debug endpoints added to `route.js` for demo/testing purposes.

Endpoints
---------
- GET `/api/chat?type=listSessions&from=0&count=20` - returns a paginated list of session summaries.
- GET `/api/chat?type=listUsers` - returns the list of demo users (anonymized).
- GET `/api/chat?type=getSessionEvents&sessionUUID={uuid}` - returns events for the given session.
- GET `/api/chat?type=getKPIs&from={ISO}&to={ISO}` - computes KPIs and returns a summary for the period.

Tools for Chat
--------------
Inside `POST /api/chat` (chat handler), the assistant has access to interactive tools:
- `listSessions({from, count})` - returns paginated session summaries
- `listSessionEvents({sessionUUID})` - returns events for a session
- `findSimilarSessions({sessionUUID, limit})` - returns sessions similar to the session provided
- `computeKPIs({from, to})` - computes DAU, MAU, funnel and revenue for the period

Data & Edge Cases
-----------------
- Dataset size: 25 users, each with 1–5 sessions, 10–60 events per session.
- Time window: last 30 days.
- Event types include sign_up, confirm_email, subscription_start, subscription_cancel, purchase, payment_failed, create_item, share_item, etc.
- Anomalies included intentionally: bot sessions, abandoned signups, failed payments, overlapping sessions, corrupted events, identity anomalies.

Usage
-----
For quick exploration, open your browser and visit `/api/chat?type=listSessions` to see the demo sessions.

Generator script
----------------
You can regenerate or update the demo dataset using the provided script:

```bash
node ../../scripts/generate_sample_data.js --users=25 --days=30
```

This script will overwrite `sample_data.json` in the same directory and prints a summary of created users & sessions.

Runtime tools / Chat tools
-------------------------
The agent (inside the `POST /api/chat`) can access the following tools at runtime:

- `reloadSampleData()` — reloads `sample_data.json` from disk and returns counts. Useful after running the generator to refresh the demo dataset.
- `getSampleStats()` — returns `{users, sessions}` counts for quickly checking dataset size.
- `getSampleRaw({limit})` — returns the raw `users` and `sessions` arrays, with optional `limit` to return first N sessions.

These tools are available to the assistant during a chat session and let it inspect and refresh the sample dataset dynamically.

Note: This dataset is mock/demo data and contains no real PII — only placeholders and anonymized identifiers.
