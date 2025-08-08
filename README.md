# 不好用！！

# IPTV 自动更新直播源生成器 (Cloudflare Workers)

每日自动拉取 [iptv-org](https://iptv-org.github.io/api/) 直播源，自动验证有效性，缓存到 Cloudflare KV，支持：

- M3U 播放列表 (`?type=m3u`)
- TVBox JSON 格式 (`?type=tvbox`)

## 🚀 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/你的GitHub用户名/iptv-auto-updater)

## 使用示例

- 获取 M3U 播放列表  
  `https://你的worker域名.workers.dev/?type=m3u`

- 获取 TVBox JSON 配置  
  `https://你的worker域名.workers.dev/?type=tvbox`

## 额外说明

- 自动更新由 Cloudflare Cron Trigger 每天凌晨 4 点执行。
- 你也可以手动触发更新：访问 `https://你的worker域名.workers.dev/update`
