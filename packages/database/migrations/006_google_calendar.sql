-- Migration 006: Google Calendar integration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_calendar_token JSONB,
  ADD COLUMN IF NOT EXISTS google_calendar_id    TEXT DEFAULT 'primary';
-- google_calendar_token: { access_token, refresh_token, expires_at }
-- google_calendar_id: calendar ID to sync events to (default: primary)
