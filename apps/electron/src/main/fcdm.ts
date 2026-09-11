import he from "he";
import * as cheerio from "cheerio";
import vm from "node:vm";
import { groupBy } from "es-toolkit";

// cSpell:words FENGCHEDONGMAN
const host = process.env["FENGCHEDONGMAN_HOST"];

async function getRealPlayUrl(url: string): Promise<string | undefined> {
  const response = await fetch(new URL(url, host));
  const html = await response.text();
  const decodedHtml = he.decode(html);
  const $ = cheerio.load(decodedHtml);
  const div = $("div.main script");
  const content = div.html() || "";
  console.log(content);
  const context: any = {};
  vm.createContext(context);
  vm.runInContext(content, context);
  console.log(context.player_aaaa);
  return context.player_aaaa.url;
}

async function getPlayList(url: string) {
  const response = await fetch(new URL(url, host));
  const html = await response.text();
  const $ = cheerio.load(html);
  const playList = $("div.module-list")
    .map((i, div) => {
      return $(div)
        .find("a")
        .map((_, a) => {
          return {
            url: $(a).attr("href"),
            name: $(a).find("span").text(),
            type: i + 1,
          };
        })
        .toArray();
    })
    .toArray();
  const group = groupBy(playList, (item) => item.name);
  return Object.keys(group).map((key) => ({
    name: key,
    list: group[key].filter((i) => i.url).map((i) => i.url!),
  }));
}

async function search(keyword: string) {
  const url = new URL("/vsh/-------------.html", host);
  url.searchParams.append("wd", keyword);
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  return $("div.module-card-item")
    .map((_, div) => {
      const title = $(div).find("div.module-card-item-title");
      return {
        url: $(title).find("a").attr("href"),
        name: $(title).find("a").text(),
        img: $(div).find("img").attr("data-original"),
      };
    })
    .toArray();
}

export { getRealPlayUrl, getPlayList, search };
