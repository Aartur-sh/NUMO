export const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '0.3.6';
export const DEFAULT_GITHUB_REPO = 'Aartur-sh/NUMO';

export interface AppReleaseInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkUrl: string | null;
  releaseUrl: string;
  publishedAt?: string;
  isPrerelease?: boolean;
  displayVersion: string;
}

/**
 * Compare two semver-like version strings (e.g., '0.2.6' vs '0.2.6b' or '0.2.5' vs '0.2.5b')
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 * Stable releases (e.g., '0.2.5') are higher than beta releases of the same base number ('0.2.5b').
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  if (clean1.toLowerCase() === clean2.toLowerCase()) return 0;

  const parts1 = clean1.split(/[-.+]/).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
  const parts2 = clean2.split(/[-.+]/).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  // If numeric base numbers are identical (e.g. '0.2.5' vs '0.2.5b'):
  const isBeta1 = /b$|beta/i.test(clean1);
  const isBeta2 = /b$|beta/i.test(clean2);

  // Official Stable release (without 'b' or 'beta') > Beta release (with 'b' or 'beta')
  if (!isBeta1 && isBeta2) return 1;  // '0.2.5' > '0.2.5b'
  if (isBeta1 && !isBeta2) return -1; // '0.2.5b' < '0.2.5'

  // If both are betas or both are stable, use natural string comparison
  const res = clean1.localeCompare(clean2, undefined, { numeric: true, sensitivity: 'base' });
  return res > 0 ? 1 : res < 0 ? -1 : 0;
}

export function getTargetRepo(): string {
  const saved = localStorage.getItem('numo_github_repo');
  if (saved && saved.includes('/')) return saved.trim();
  const envRepo = (import.meta as any).env?.VITE_GITHUB_REPO;
  if (envRepo && typeof envRepo === 'string' && envRepo.includes('/')) return envRepo.trim();
  return DEFAULT_GITHUB_REPO;
}

/**
 * Perform a GET request to GitHub Releases API to check for updates.
 * @param options.includePrerelease If true (secret 4-second hold), checks pre-releases (beta) as well!
 */
export async function checkForAppUpdate(options?: {
  includePrerelease?: boolean;
}): Promise<AppReleaseInfo> {
  const repo = getTargetRepo();
  const includePrerelease = options?.includePrerelease ?? false;

  // We query the list of releases to find either latest stable or latest prerelease
  const url = `https://api.github.com/repos/${repo}/releases?per_page=10`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Релізи для репозиторію ${repo} ще не опубліковані`);
    }
    throw new Error(`GitHub API HTTP ${response.status}`);
  }

  const releases: any[] = await response.json();
  if (!Array.isArray(releases) || releases.length === 0) {
    throw new Error(`Релізів у репозиторії ${repo} не знайдено`);
  }

  let selectedRelease: any = null;

  if (includePrerelease) {
    // Pick the most recent release (including pre-releases)
    selectedRelease = releases[0];
  } else {
    // Pick only official stable releases
    selectedRelease = releases.find((r) => !r.prerelease && !r.draft);
  }

  if (!selectedRelease) {
    return {
      hasUpdate: false,
      latestVersion: APP_VERSION,
      currentVersion: APP_VERSION,
      releaseName: `v${APP_VERSION}`,
      releaseNotes: '',
      apkUrl: null,
      releaseUrl: '',
      displayVersion: `v${APP_VERSION}`,
    };
  }

  let rawVersion: string = selectedRelease.tag_name || '';
  if (rawVersion.toLowerCase() === 'beta' || !rawVersion.match(/\d/)) {
    // Extract version from release name, e.g. "NUMO Radio Beta v0.2.5b" -> "0.2.5b"
    const match = (selectedRelease.name || '').match(/v?(\d+\.\d+\.\d+b?)/i);
    if (match) {
      rawVersion = match[1];
    }
  }
  const cleanLatest = rawVersion.replace(/^v/i, '').trim();
  const isPrerelease = Boolean(selectedRelease.prerelease);

  // Determine if this is an update
  let hasUpdate = false;
  const cmp = compareVersions(cleanLatest, APP_VERSION);
  if (cmp > 0) {
    hasUpdate = true;
  } else if (cleanLatest.toLowerCase() !== APP_VERSION.toLowerCase() && compareVersions(cleanLatest, APP_VERSION) >= 0) {
    hasUpdate = true;
  } else if (includePrerelease && isPrerelease) {
    // If checking prereleases and user holds version button
    if (cleanLatest.toLowerCase() !== APP_VERSION.toLowerCase() || rawVersion.toLowerCase().includes('beta') || rawVersion.toLowerCase().includes('b')) {
      hasUpdate = true;
    }
  }

  // Format display version (user requested "beta" before or "b" after)
  let displayVersion = `v${cleanLatest}`;
  if (isPrerelease) {
    const withoutSuffix = cleanLatest.replace(/-?beta(\.\d+)?/i, '').replace(/b\d*$/i, '');
    displayVersion = `beta v${withoutSuffix}b`;
  }

  // Search for an attached APK asset
  let apkUrl: string | null = null;
  if (Array.isArray(selectedRelease.assets)) {
    const apkAsset = selectedRelease.assets.find((a: any) =>
      typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
    );
    if (apkAsset && apkAsset.browser_download_url) {
      apkUrl = apkAsset.browser_download_url;
    }
  }

  return {
    hasUpdate,
    latestVersion: cleanLatest,
    currentVersion: APP_VERSION,
    releaseName: selectedRelease.name || rawVersion,
    releaseNotes: selectedRelease.body || '',
    apkUrl: apkUrl || selectedRelease.html_url,
    releaseUrl: selectedRelease.html_url,
    publishedAt: selectedRelease.published_at,
    isPrerelease,
    displayVersion,
  };
}
