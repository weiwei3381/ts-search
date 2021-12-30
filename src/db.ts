/**
 * 获得数据, 并格式化为相应的对象
 */

import fs from 'fs';
import { config } from './config';
import { json_to_map, ReverseDict } from './utils';

const reverse_dict_txt = fs.readFileSync(config.reverse_dict_db, {
  encoding: 'utf-8',
});
const sentence_list_txt = fs.readFileSync(config.sentences_db, {
  encoding: 'utf-8',
});

// 导出句子列表和倒排索引
export const reverse_dict: ReverseDict = json_to_map(reverse_dict_txt);
export const sentence_list: string[] = JSON.parse(sentence_list_txt);

/**
 * 根据句子id返回指定的句子
 * @param id 句子id
 * @returns 句子
 */
export function get_sentence_by_id(id: number): string {
  return sentence_list[id];
}
