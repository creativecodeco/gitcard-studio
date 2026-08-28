export interface CardUrlOptions {
  origin: string;
  username: string;
  theme: string;
  cardWidth?: string;
  locale?: string;
  customColors?: string;
  repo?: string;
  viewsLabel?: string;
  viewsColor?: string;
  viewsStyle?: string;
  isPreview?: boolean;
}

export interface CardUrls {
  statsUrl: string;
  languagesUrl: string;
  rankUrl: string;
  streakUrl: string;
  trophiesUrl: string;
  topReposUrl: string;
  sponsorsUrl: string;
  commitActivityUrl: string;
  todayStatusUrl: string;
  timelineMatrixUrl: string;
  repoUrl: string;
  viewsUrl: string;
}

/**
 * Builds API endpoint URLs for all 12 SVG cards.
 */
export function buildCardUrls(options: CardUrlOptions): CardUrls {
  const {
    origin,
    username,
    theme,
    cardWidth,
    locale,
    customColors = '',
    repo,
    viewsLabel,
    viewsColor,
    viewsStyle
  } = options;

  const widthParam = cardWidth ? `&card_width=${encodeURIComponent(cardWidth)}` : '';
  const localeParam = locale ? `&locale=${encodeURIComponent(locale)}` : '';
  const custom = customColors;

  const statsUrl = `${origin}/api/stats?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const languagesUrl = `${origin}/api/languages?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const rankUrl = `${origin}/api/rank?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const streakUrl = `${origin}/api/streak?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const trophiesUrl = `${origin}/api/trophies?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const topReposUrl = `${origin}/api/top-repos?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const sponsorsUrl = `${origin}/api/sponsors?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const commitActivityUrl = `${origin}/api/commit-activity?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  const todayStatusUrl = `${origin}/api/today-status?username=${username}&theme=${theme}${localeParam}${custom}`;
  const timelineMatrixUrl = `${origin}/api/timeline-matrix?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;

  let repoUrl = `${origin}/api/repo?username=${username}&theme=${theme}${widthParam}${localeParam}${custom}`;
  if (repo) {
    repoUrl += `&repo=${encodeURIComponent(repo)}`;
  }

  const labelVal = viewsLabel ? viewsLabel.trim() : '';
  const colorVal = viewsColor ? viewsColor.trim() : '';
  const styleVal = viewsStyle || '';

  let viewsUrl = `${origin}/api/views?username=${username}&theme=${theme}`;
  if (labelVal) viewsUrl += `&label=${encodeURIComponent(labelVal)}`;
  if (colorVal) viewsUrl += `&color=${encodeURIComponent(colorVal)}`;
  if (styleVal) viewsUrl += `&style=${encodeURIComponent(styleVal)}`;
  if (options.isPreview) viewsUrl += `&preview=true`;

  return {
    statsUrl,
    languagesUrl,
    rankUrl,
    streakUrl,
    trophiesUrl,
    topReposUrl,
    sponsorsUrl,
    commitActivityUrl,
    todayStatusUrl,
    timelineMatrixUrl,
    repoUrl,
    viewsUrl
  };
}
