// 测试根据句子中的单词idf，来搜索可能的相似句子
import { split_words, split_words_with_tag } from './utils';
import fs from 'fs';

function load_idf_words() {
  const data = fs.readFileSync('./map形式_4万个常用单词的idf_1022.json', {
    encoding: 'utf-8',
  });
  const word_map: Record<string, number> = JSON.parse(data);
  return word_map;
}

function find_important_words(sentence: string) {
  const word_list = split_words(sentence);
  console.time('load_idf_words');
  const idf_word_map = load_idf_words();
  console.timeEnd('load_idf_words');
  const word_tag_list = split_words_with_tag(sentence);
  const word_attri_list = word_tag_list.map((t) => {
    if (t.word in idf_word_map) {
      return {
        ...t,
        idf: idf_word_map[t.word],
      };
    }
  });
  // 过滤出实词
  const notional_words = word_attri_list.filter((item) => {
    if (item && 'tag' in item) {
      if (
        item.tag.includes('n') ||
        item.tag.includes('v') ||
        item.tag.includes('a')
      )
        return true;
    }
    return false;
  });
  const sorted_notional_words = notional_words.sort((a, b) => b.idf - a.idf);
  if (sorted_notional_words.length > 1) {
    return sorted_notional_words.slice(0, 3).map((item) => item.word);
  }
  return [];
}

console.log(find_important_words('探索多种渠道增加中低收入群众要素收入'));
console.log(find_important_words('是全体人民共同富裕的现代化'));
console.log(find_important_words('并以此来规范整个团队的工作'));
console.log(find_important_words('健全全面从严治党体系'));
