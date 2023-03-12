/**
 * 文本内容改写
 */

import fs from 'fs';
import { split_words } from './utils';

/**
 * 获得相似词词典
 * @returns
 */
function getSimilarDict() {
  const similarText: string = fs.readFileSync(
    './data/近义词_50_自己训练_带相似度.json',
    {
      encoding: 'utf-8',
    },
  );
  const similarDict = JSON.parse(similarText);
  return similarDict;
}

function modifyText(inputText: string) {
  const similarDict = getSimilarDict();
  const segments = split_words(inputText); // 分词
  console.log(segments.join('|'));
  const probability_list = [];
  for (const segment of segments) {
    if (segment.length > 1 && similarDict[segment]) {
      const similarWords = similarDict[segment];
      probability_list.push(similarWords);
    } else {
      probability_list.push([[segment, 1]]);
    }
  }
  for (let i = 0; i < 50; i += 1) {
    let text = '';
    for (const probability_word_list of probability_list) {
      text +=
        probability_word_list[
          Math.floor(Math.random() * Math.min(10, probability_word_list.length))
        ][0];
    }
    console.log(text);
  }
  console.log(probability_list);
  return probability_list;
}

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

type SimilarySet = Array<SimilaryWord>;

function changeFormat() {
  const similarySet: SimilarySet = [];
  const similarDict = getSimilarDict();
  for (const word of Object.keys(similarDict)) {
    const similaryWord: SimilaryWord = {
      target: word,
      similary_words: [],
    };
    for (let i = 0; i < similarDict[word].length; i += 1) {
      const simiWord = similarDict[word][i];
      similaryWord.similary_words.push(simiWord[0]);
    }
    similarySet.push(similaryWord);
  }
  fs.writeFileSync(
    './近义词_50_自己训练_不带相似度_列表.json',
    JSON.stringify(similarySet),
  );
  console.log(`写入文件成功!共写入${similarySet.length}条数据`);
}

changeFormat();

// modifyText(
//   '当我们把目光收回到当下，世纪疫情同样给出了一道难题，中国青年再次选择直面挑战，作出他们的回答。',
// );
