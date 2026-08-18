const SERVER_URL = "http://localhost:8080";

// Default username (TikTok's official account)
const DEFAULT_ITEM_ID = "7675348455367216385";

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
 * Build user search API URL
 */
function buildUserSearchUrl(itemID) {
  const params = new URLSearchParams({
    WebIdLastTime: Date.now().toString(),
    aid: "1988",
    app_language: "en",
    app_name: "tiktok_web",
    browser_language: "en-US",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "MacIntel",
    browser_version: "5.0",
    channel: "tiktok_web",
    cookie_enabled: "true",
    count: "10",
    cursor: "0",
    device_id: "7520531026079925774",
    device_platform: "web_pc",
    focus_state: "true",
    history_len: "2",
    is_fullscreen: "false",
    is_page_visible: "true",
    itemId: itemID,
    language: "en",
    os: "mac",
    priority_region: "US",
    region: "US",
    screen_height: "1080",
    screen_width: "1920",
    tz_name: "America/New_York",
    webcast_language: "en",
  });

  return `https://www.tiktok.com/api/item/detail/?${params.toString()}`;
}

/**
 * Fetch user info
 */
async function fetchItem(itemID) {
  const url = buildUserSearchUrl(itemID);

  console.log(url);

  console.log(`Fetch for ID: @${itemID}`);
  console.log("");

  // Get signed URL
  console.log("Getting signed URL...");
  const signedData = await getSignedUrl(url);

  console.log(signedData);
  // Fetch from TikTok
  console.log("Fetching from TikTok...");
  const data = await fetchFromTikTok(signedData);

  return data || {};
}

// Main execution
async function main() {
  const itemID = process.argv[2] || DEFAULT_ITEM_ID;

  try {
    const data = await fetchItem(itemID);
    console.log(data);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
