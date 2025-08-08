const LIVE_SOURCES_API = "https://iptv-org.github.io/api/channels.json"; // iptv-org 官方直播源JSON

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "m3u";

    // 路由不同请求
    if (url.pathname === "/update") {
      return await updateLiveSources(env);
    } else {
      return await serveLiveSources(type, env);
    }
  },

  async scheduled(event, env, ctx) {
    // Cron 触发自动更新
    event.waitUntil(updateLiveSources(env));
  }
};

/**
 * 拉取直播源，校验有效，缓存到 KV
 */
async function updateLiveSources(env) {
  try {
    const res = await fetch(LIVE_SOURCES_API);
    if (!res.ok) return new Response("Failed to fetch live sources", { status: 500 });

    const channels = await res.json();

    // 过滤和校验直播源（简单校验URL是否可访问）
    const validChannels = [];
    for (const ch of channels) {
      if (!ch.url) continue;
      if (await checkUrlAlive(ch.url)) {
        validChannels.push({
          name: ch.name || ch.id || "unknown",
          url: ch.url,
        });
      }
    }

    // 缓存JSON到 KV
    await env.LIVE_SOURCES.put("channels", JSON.stringify(validChannels));

    return new Response(`Updated ${validChannels.length} live sources`);
  } catch (e) {
    return new Response("Error updating live sources: " + e.message, { status: 500 });
  }
}

/**
 * 简单的 HTTP HEAD 请求验证直播源可用性
 */
async function checkUrlAlive(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok && res.headers.get("content-type")?.includes("video");
  } catch {
    return false;
  }
}

/**
 * 返回用户请求的 M3U 或 TVBox JSON
 */
async function serveLiveSources(type, env) {
  const jsonStr = await env.LIVE_SOURCES.get("channels");
  if (!jsonStr) return new Response("Live sources not ready", { status: 503 });

  const channels = JSON.parse(jsonStr);

  if (type === "m3u") {
    let playlist = "#EXTM3U\n";
    for (const ch of channels) {
      playlist += `#EXTINF:-1,${ch.name}\n${ch.url}\n`;
    }
    return new Response(playlist, {
      headers: { "Content-Type": "audio/x-mpegurl; charset=utf-8" },
    });
  }

  if (type === "tvbox") {
    const tvboxJson = {
      name: "直播源",
      type: 0,
      url: "",
      epg: "",
      logo: "",
      channels: channels.map(ch => ({
        name: ch.name,
        url: ch.url,
      })),
    };
    return new Response(JSON.stringify(tvboxJson, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return new Response("Invalid type. Use ?type=m3u or ?type=tvbox", { status: 400 });
}
