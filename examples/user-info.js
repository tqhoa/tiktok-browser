/**
 * User Info Example
 *
 * Fetch information about a TikTok user by username.
 * Uses the search API to find user details.
 *
 * Usage:
 *   1. Start the server: npm start
 *   2. Run: node examples/user-info.js [USERNAME]
 */

const SERVER_URL = "http://localhost:8080";

// Default username (TikTok's official account)
const DEFAULT_USERNAME = "bossgirl.media";

/**
 * Get signed URL from signature server
 */
async function getSignedUrl(url) {
  const response = await fetch(`${SERVER_URL}/signature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const result = await response.json();
  if (result.status !== "ok") {
    throw new Error(result.message || "Signature generation failed");
  }

  return result.data;
}

/**
 * Make request to TikTok API with signed URL
 */
async function fetchFromTikTok(signedData) {
  const url = new URL(signedData.signed_url);
  url.searchParams.set("X-Bogus", "1");

  console.log(url);
  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": signedData.navigator.user_agent,
      Cookie: signedData.cookies,
      Accept: "application/json",
      Referer: "https://www.tiktok.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok API returned ${response.status}`);
  }

  return response.json();
}

/**
 * Build user search API URL
 */
function buildUserSearchUrl(username) {
  const params = new URLSearchParams({
    WebIdLastTime: Date.now().toString(),
    aid: "1988",
    appType: "t",
    app_language: "en",
    app_name: "tiktok_web",
    browser_language: "en-US",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "MacIntel",
    browser_version: "5.0",
    channel: "tiktok_web",
    cookie_enabled: "true",
    data_collection_enabled: "false",
    device_id: "7676920074318235153",
    device_platform: "web_pc",
    focus_state: "true",
    from_page: "user",
    history_len: "2",
    is_fullscreen: "false",
    is_page_visible: "true",
    language: "en",
    needAudienceControl: "true",
    odinId: "7676920020005913607",
    os: "mac",
    priority_region: "",
    region: "US",
    screen_height: "1080",
    screen_width: "1920",
    secUid: "",
    tz_name: "America/New_York",
    uniqueId: "bossgirl.media",
    user_is_login: "false",
    webcast_language: "en",
  });

  return `https://www.tiktok.com/api/user/detail/?${params.toString()}`;
}

async function fetchViaBrowser(url) {
  console.log("Using /fetch fallback (browser-based request)...");

  const response = await fetch(`${SERVER_URL}/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const result = await response.json();
  if (result.status !== "ok") {
    throw new Error(result.message || "Fetch failed");
  }

  return result.data;
}

/**
 * Fetch user info
 */
async function fetchUserInfo(username) {
  const url = buildUserSearchUrl(username);

  console.log(`Searching for user: @${username}`);
  console.log("");

  // Get signed URL
  console.log("Getting signed URL...");
  const signedData = await getSignedUrl(url);

  //console.log(signedData);
  // Fetch from TikTok
  let data;
  console.log("Fetching from TikTok...");
  data = await fetchFromTikTok(signedData);

  if (!data) {
    data = await fetchViaBrowser(url);
  }

  return data || {};
}

// Main execution
async function main() {
  const username = process.argv[2] || DEFAULT_USERNAME;

  try {
    const data = await fetchUserInfo(username);
    console.log(data);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
