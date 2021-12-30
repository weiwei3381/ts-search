/**
 * 搜索测试
 */

import fs from 'fs';
import { split_words, json_to_map, ReverseDict } from './utils';
import { config } from './config';
import { cloneDeep } from 'lodash';

const search_sentence = '描述过程'; // 搜索短句

const reverse_dict_txt = fs.readFileSync(config.reverse_dict_db, {
  encoding: 'utf-8',
});
const sentence_list_txt = fs.readFileSync(config.sentences_db, {
  encoding: 'utf-8',
});
const reverse_dict: ReverseDict = json_to_map(reverse_dict_txt);
const sentence_list: string[] = JSON.parse(sentence_list_txt);

function search_by_sentence(search_sentence: string) {
  const search_word_list: string[] = split_words(search_sentence);
  const result_id_map: Map<number, number[]> = cloneDeep(
    reverse_dict.get(search_word_list[0]),
  ); // 结果的句子id
  // 从第二个关键词开始搜索
  for (let i = 1; i < search_word_list.length; i++) {
    const word = search_word_list[i];
    if (!reverse_dict.has(word)) return []; // 如果没有则直接为空
    const id_map = reverse_dict.get(word);
    for (const result_key of result_id_map.keys()) {
      if (!id_map.has(result_key)) result_id_map.delete(result_key); //如果结果集合中没有这个键,则删除
    }
  }
  console.log(`一共有${result_id_map.size}个结果`);

  for (const key of result_id_map.keys()) {
    console.log(sentence_list[key]);
  }
}

console.log(search_by_sentence(search_sentence));
