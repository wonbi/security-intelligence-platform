const fs = require("node:fs/promises");

const feeds = [
  {
    "source": "boannews",
    "label": "보안뉴스",
    "url": "https://www.boannews.com/rss/allArticle.xml",
    "allowedHosts": [
      "boannews.com"
    ]
  },
  {
    "source": "kisa",
    "label": "KISA 보호나라",
    "url": "https://www.boho.or.kr/kr/rss.do?bbsId=B0000133",
    "allowedHosts": [
      "boho.or.kr"
    ]
  }
];

function decode(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();
}

function tag(block, name) {
  const match = block.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return match ? decode(match[1]) : "";
}

function normalizeUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (!allowedHosts.some(host => url.hostname === host || url.hostname.endsWith("." + host))) return "";
    return url.href;
  } catch {
    return "";
  }
}

async function readFeed(feed) {
  const response = await fetch(feed.url, { headers: { "user-agent": "security-intelligence-platform RSS updater" } });
  if (!response.ok) throw new Error(feed.label + " 응답 오류: " + response.status);
  const xml = await response.text();
  const blocks = xml.match(/<item(?:\\s[^>]*)?>[\\s\\S]*?<\\/item>/gi) || [];
  return blocks.slice(0, 10).map(block => ({
    source: feed.source,
    sourceLabel: feed.label,
    title: tag(block, "title") || "제목 없음",
    link: normalizeUrl(tag(block, "link"), feed.allowedHosts),
    published: tag(block, "pubDate") || tag(block, "dc:date"),
    description: tag(block, "description").replace(/<[^>]+>/g, "").slice(0, 240)
  })).filter(item => item.link && item.title);
}

const results = [];
const errors = [];
for (const feed of feeds) {
  try {
    results.push(...await readFeed(feed));
  } catch (error) {
    errors.push(feed.label + ": " + error.message);
  }
}
results.sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));
const payload = {
  updatedAt: new Date().toISOString(),
  sources: feeds.map(feed => ({source: feed.source, label: feed.label, url: feed.url})),
  items: results.slice(0, 20),
  errors
};
await fs.writeFile("news.json", JSON.stringify(payload, null, 2) + "\n");
console.log("news.json updated:", results.length, "items", errors.length ? errors.join(" | ") : "");
