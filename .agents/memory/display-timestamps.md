---
name: Display timestamps
description: Boundary guidance for activity feeds and other user-facing time labels.
---

Activity feeds may intentionally expose human-readable labels such as “7 min ago” or “Yesterday” rather than machine timestamps.

**Why:** Parsing every time field as ISO caused the dashboard to crash when the activity API returned display-ready labels.

**How to apply:** Only parse and format timestamp values that are explicitly ISO/date contracts; render display-ready activity labels directly or give them a distinct API field.