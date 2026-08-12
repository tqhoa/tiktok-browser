/**
 * User Follow List Example
 *
 * Fetch the following/followers list of a TikTok user by secUid.
 *
 * Usage:
 *   1. Start the server: npm start
 *   2. Run: node examples/user-follow.js [SEC_UID] [following|follower] [COUNT]
 */

const SERVER_URL = "http://localhost:8080";

// Default secUid (TikTok's official account)
const DEFAULT_SEC_UID =
  "MS4wLjABAAAAuU3iSTEOGcGXqtZNtJTZ8GKck5dtZrC3L-P3j86JA5XWYjiNld58YETlLlsCm-V2";

const CONFIG = {
  DEVICE_ID: "7669228444366489089",
  ODIN_ID: "7146841732746036230",
  VERIFY_FP: "verify_msl8vkcv_J8gj8YZl_giY1_4eBQ_9CmX_QnYkCihoPueD",
  // scene: 21 = following list, 22 = followers list
  SCENE: { following: "21", follower: "67" },
};

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
  //console.log(signedData.signed_url);
  //console.log(signedData.cookies);
  const response = await fetch(signedData.signed_url, {
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
 * Fallback: Fetch through browser using /fetch endpoint
 */
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
 * Build user follow list API URL
 */
function buildUserListUrl(secUid, type = "following", count = 30, cursor = 0) {
  const userAgent =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

  const params = new URLSearchParams({
    WebIdLastTime: Date.now().toString(),
    aid: "1988",
    app_language: "en",
    app_name: "tiktok_web",
    browser_language: "en-US",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "Linux x86_64",
    browser_version: userAgent,
    channel: "tiktok_web",
    cookie_enabled: "true",
    count: count.toString(),
    data_collection_enabled: "true",
    device_id: CONFIG.DEVICE_ID,
    device_platform: "web_pc",
    focus_state: "true",
    from_page: "user",
    history_len: "2",
    is_fullscreen: "false",
    is_page_visible: "true",
    maxCursor: "0",
    minCursor: cursor.toString(),
    odinId: CONFIG.ODIN_ID,
    os: "mac",
    priority_region: "US",
    referer: "",
    region: "US",
    //scene: CONFIG.SCENE[type] || CONFIG.SCENE.following,
    scene: 67,
    screen_height: "1080",
    screen_width: "1920",
    secUid: secUid,
    tz_name: "America/Los_Angeles",
    user_is_login: "true",
    verifyFp: CONFIG.VERIFY_FP,
    webcast_language: "en",
  });

  return `https://www.tiktok.com/api/user/list/?${params.toString()}`;
}

/**
 * Fetch follow list
 */
async function fetchUserList(
  secUid,
  type = "following",
  count = 50,
  cursor = "",
) {
  const url = buildUserListUrl(secUid, type, count, cursor);
  /*
  console.log(
    `Fetching ${type} list for secUid: ${secUid.substring(0, 30)}...`,
  );
  */
  //console.log("");

  //console.log("Getting signed URL...");
  const signedData = await getSignedUrl(url);
  //console.log("Fetching from TikTok...");

  let data;
  try {
    data = await fetchFromTikTok(signedData);
  } catch (e) {
    console.log("Fetching from /fetch...");
    data = null;
  }
  if (!data) {
    data = await fetchViaBrowser(url);
  }

  return data || {};
}

async function main() {
  const secUid = process.argv[2] || DEFAULT_SEC_UID;
  const type = process.argv[3] || "following";
  const count = parseInt(process.argv[4]) || 30;

  let minCursor = "";
  let hasMore = true;
  let index = 0;

  try {
    while (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const data = await fetchUserList(secUid, type, count, minCursor);
      //console.log(JSON.stringify(data, null, 2));
      //console.log(data.total);
      minCursor = data.minCursor;
      hasMore = data.hasMore;

      //console.log(hasMore);

      data.userList.forEach((user) => {
        console.log(++index, user.user.uniqueId, user.statsV2);
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
