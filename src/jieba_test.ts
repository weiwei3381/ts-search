/**
 * 结巴分词测试
 */

import jieba from 'nodejieba';

// 句子中匹配的类型
type match = {
  sentence: string; // 词语组成的句子, 例如"安全形势分析"
  segments: Array<string>; // 词语列表,按顺序排列, 例如["安全","形势","分析"]
  merge: string; // 分词按|进行合并的句子,例如"安全|形势|分析"
};

// 对于句子sentence, 从第position位开始,是否是从segment开始继续
// 例如对于"安全形势分析"这个sentence, "安全"后面就没法接"全形",因为"安全"后面必须以"形"开头
const is_continue = (sentence: string, segment: string, position: number) => {
  if (sentence.startsWith(segment, position)) return true;
  return false;
};

// 得到下一个对应的匹配列表
const get_next_match_list = (
  sentence: string,
  cut_list: string[],
  match_list: match[],
) => {
  const new_match_list: Array<match> = []; // 接下来新的匹配列表
  // 对当前每个匹配查找下一个匹配是否存在
  for (const match of match_list) {
    for (const cut of cut_list) {
      if (is_continue(sentence, cut, match.sentence.length)) {
        const segments = [...match.segments, cut];
        new_match_list.push({
          sentence: match.sentence + cut,
          segments: segments,
          merge: segments.join('|'),
        });
      }
    }
  }
  return new_match_list;
};

function get_matches(sentence: string): match[] {
  // 首先将句子按照搜索引擎方式进行切分, 例如"安全形势分析"切分为['安全','形势','分析','安全形势']
  const cut_list: string[] = jieba.cutForSearch(sentence);
  // 初始空的匹配列表
  let match_list: match[] = [
    {
      sentence: '',
      segments: [],
      merge: '',
    },
  ];
  const result_match_list = []; // 匹配结果列表

  while (true) {
    // 获得能够继续匹配的列表
    const next_match_list = get_next_match_list(sentence, cut_list, match_list);
    const continue_match_list = []; // 句子不完整，还需要再继续匹配的列表
    // 对于已经匹配的列表, 如果句子完整了, 就推送到结果列表中去就行, 不完整则推送到不完整列表中去
    for (const next_match of next_match_list) {
      // 考虑到可能存在相同词语在一个句子中,因此不同位置的相同词语会被看成是2个词, 因此在最后获取结果时需要考虑是否已经存在过
      if (next_match.sentence === sentence) {
        let is_exist = false; // 当前列表是否存在,默认为否
        for (const result_match of result_match_list) {
          if (next_match.merge === result_match.merge) {
            is_exist = true;
            break;
          }
        }
        // 如果当前列表不存在,则推送到结果列表
        !is_exist && result_match_list.push(next_match);
      } else {
        continue_match_list.push(next_match);
      }
    }
    // 如果还有不完整列表, 那么继续进行匹配, 否则跳出循环
    if (continue_match_list.length > 0) {
      match_list = continue_match_list;
    } else {
      break;
    }
  }
  return result_match_list;
}

const sentence = '安全形势分析';
console.log(JSON.stringify(get_matches(sentence)));
