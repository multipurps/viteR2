-- Run once in Supabase SQL editor.
--
-- zeeyus_interactions only stored tmdb_id/media_type — fine for the
-- recommendation engine (it fetches DNA by id), but a "My Ratings /
-- Watched" page needs a poster + title to render without re-fetching
-- every title from TMDB on load. Snapshot it the same way
-- zeeyus_watchlist and zeeyus_continue already do.

alter table zeeyus_interactions add column if not exists media_data jsonb;
