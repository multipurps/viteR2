// Every row here is sourced from a TMDB query (genre, language, region,
// keyword, or sort order) — none of these require a manually maintained
// list of titles, so they won't go stale or need upkeep as new
// movies/shows release.

export const MOVIE_CATEGORIES = [
  { title: 'Trending This Week', kind: 'trending', mediaType: 'movie', window: 'week' },
  { title: 'New Releases', kind: 'discover', params: (today, month) =>
      `primary_release_date.gte=${month}&primary_release_date.lte=${today}&sort_by=popularity.desc` },
  { title: 'Action & Thriller', kind: 'discover', params: 'with_genres=28,53&sort_by=popularity.desc' },
  { title: 'Comedy', kind: 'discover', params: 'with_genres=35&sort_by=popularity.desc' },
  { title: 'Horror & Suspense', kind: 'discover', params: 'with_genres=27&sort_by=popularity.desc' },
  { title: 'Romance', kind: 'discover', params: 'with_genres=10749&sort_by=popularity.desc' },
  { title: 'Sci-Fi & Fantasy', kind: 'discover', params: 'with_genres=878,14&sort_by=popularity.desc' },
  { title: 'Documentaries', kind: 'discover', params: 'with_genres=99&sort_by=popularity.desc' },
  { title: 'Animated', kind: 'discover', params: 'with_genres=16&sort_by=popularity.desc' },
  { title: 'Kung Fu & Martial Arts', kind: 'discover', params: 'with_keywords=6075&sort_by=popularity.desc' },
  { title: 'Best Indian Movies', kind: 'discover', params: 'region=IN&with_original_language=hi&sort_by=vote_average.desc&vote_count.gte=200' },
  { title: 'Blockbuster Movies', kind: 'discover', params: 'sort_by=revenue.desc&vote_count.gte=1000' },
  { title: 'Top on Netflix', kind: 'provider', provider: 'netflix' },
  { title: 'Top on Prime', kind: 'provider', provider: 'prime' },
  { title: 'Top on HBO Max', kind: 'provider', provider: 'hbomax' },
  { title: 'Top on Apple TV+', kind: 'provider', provider: 'appletv' },
];

export const TV_CATEGORIES = [
  { title: 'Trending Series', kind: 'trending', mediaType: 'tv', window: 'week' },
  { title: 'South African Series', kind: 'discover', params: 'with_origin_country=ZA&sort_by=popularity.desc' },
  { title: 'Crime & Mystery', kind: 'discover', params: 'with_genres=80&sort_by=vote_count.desc' },
  { title: 'Action Series', kind: 'discover', params: 'with_genres=10759&sort_by=popularity.desc' },
  { title: 'Sci-Fi Series', kind: 'discover', params: 'with_genres=10765&sort_by=popularity.desc' },
  { title: 'Drama Series', kind: 'discover', params: 'with_genres=18&sort_by=vote_count.desc' },
  { title: 'Comedy Series', kind: 'discover', params: 'with_genres=35&sort_by=popularity.desc' },
  { title: 'Reality & Talk', kind: 'discover', params: 'with_genres=10764&sort_by=popularity.desc' },
  { title: 'Docuseries & True Crime', kind: 'discover', params: 'with_genres=99&sort_by=popularity.desc' },
  { title: 'Family Series', kind: 'discover', params: 'with_genres=10751&sort_by=popularity.desc' },
  { title: 'Korean Dramas', kind: 'discover', params: 'with_origin_country=KR&sort_by=popularity.desc' },
  { title: 'Turkish Series', kind: 'discover', params: 'with_original_language=tr&sort_by=popularity.desc' },
  { title: 'Spanish Series', kind: 'discover', params: 'with_original_language=es&sort_by=popularity.desc' },
  { title: 'Mature Animation', kind: 'discover', params: 'with_genres=16&without_genres=10751&sort_by=popularity.desc' },
  { title: 'Ancient Adventures', kind: 'keyword-terms', terms: ['vikings', 'sword and sandal', 'middle ages', 'historical fiction'],
    extraParams: 'with_genres=10759,18&sort_by=popularity.desc' },
  { title: 'Best Series of All Time', kind: 'discover', params: 'sort_by=vote_average.desc&vote_count.gte=1000' },
  { title: 'Top on Netflix', kind: 'provider', provider: 'netflix' },
  { title: 'Top on Prime', kind: 'provider', provider: 'prime' },
  { title: 'Top on HBO Max', kind: 'provider', provider: 'hbomax' },
];

// "Ancient Adventures" is now sourced from the keywords behind Vikings,
// Spartacus, Marco Polo, and The Witcher — modern-produced adventure
// dramas in historical/fantasy-medieval settings — rather than a fixed
// title list. If it surfaces the wrong tone, tweak the `terms` array
// above rather than hand-listing shows.
