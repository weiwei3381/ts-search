// 合并相似词词典

import fs from 'fs';

interface SimilaryWord {
  target: string;
  similary_words: Array<
    | {
        word: string;
        similarity: number;
      }
    | string
  >;
}

function getDict(filePath: string) {
  const similar50Text: string = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  });
  const similarList: Array<SimilaryWord> = JSON.parse(similar50Text); // 50相似度词
  const similarDict = new Map<string, string[]>();
  for (const item of similarList) {
    similarDict.set(item.target, item.similary_words as string[]);
  }
  return similarDict;
}

const similar50Dict = getDict('./近义词_50_自己训练_不带相似度_列表.json');
const similar30Dict = getDict('./近义词_30_不带相似度_列表.json');
const tencentDict = getDict('./腾讯文本图谱_近义词.json');
console.log(similar50Dict.size);
console.log(similar30Dict.size);
console.log(tencentDict.size);
const mergeDict = new Map<string, string[]>();

for (const key of tencentDict.keys()) {
  const similar50List = similar50Dict.get(key);
  const similar30List = similar30Dict.get(key);
  const originStrList = tencentDict.get(key);
  for (let i = 0; i < 50; i += 1) {
    if (similar50List && i < similar50List.length) {
      const item = similar50List[i];
      if (!originStrList.includes(item)) {
        originStrList.push(item);
      }
    }
    if (similar30List && i < similar30List.length) {
      const item = similar30List[i];
      if (!originStrList.includes(item)) {
        originStrList.push(item);
      }
    }
  }
  mergeDict.set(key, originStrList);
}

//map转list
const mergeList: SimilaryWord[] = [];
for (const [k, v] of mergeDict) {
  mergeList.push({
    target: k,
    similary_words: v,
  });
}
// write JSON string to a file
fs.writeFile(
  './近似词_合并_不带相似度.json',
  JSON.stringify(mergeList),
  (err) => {
    if (err) {
      throw err;
    }
    console.log('JSON data is saved.');
  },
);
