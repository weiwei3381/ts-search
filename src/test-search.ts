/**
 * 搜索测试
 */

import { split_words } from './utils';
import { cloneDeep } from 'lodash';
import { reverse_dict, get_sentence_by_id } from './db';

/**
 * 搜索部分,分为连续部分和离散部分
 */
type SearchContinueParts = Array<Array<string>>;

/**
 * 将搜索值切分为连续部分,形成列表
 * 例如对于搜索词"描述过程 生物 医药学", 分词之后形成的结果为[["描述","过程"],["生物"],["医药","学"]]
 * @param search_value 搜索值
 * @returns 连续部分的列表
 */
function split_search_value(search_value: string): SearchContinueParts {
  const search_parts = search_value.split(/ +/);
  const search_continue_parts: SearchContinueParts = [];
  for (const search_part of search_parts) {
    search_continue_parts.push(split_words(search_part));
  }
  return search_continue_parts;
}

/**
 * 搜索得到对应的结果, 根据连续和空格进行区分, 例如搜索关键词为"世界的本源 思想",
 * 就搜索文章中含有"世界的本源"和"思想"的所有文本
 * @param search_value 搜索关键词
 */
function search(search_value: string): void {
  // 获取第一个词元对应的结果, 将以这个结果不断缩减
  const search_continue_parts = split_search_value(search_value); // 获取连续搜索词元部分
  const result_sentence_map: Map<number, number[]> = cloneDeep(
    reverse_dict.get(search_continue_parts[0][0]),
  );

  for (let i = 0; i < search_continue_parts.length; i++) {
    const search_part: string[] = search_continue_parts[i];
    for (let j = 0; j < search_part.length; j++) {
      const search_element: string = search_part[j];
      const search_id_map = reverse_dict.get(search_element);

      // 每个连续词元列表的第一个元素不做位置判断, 只做是否有的判断
      if (j === 0) {
        if (i === 0) continue; // 如果是第一个词元列表的第一个元素则跳过
        for (const sentence_id of result_sentence_map.keys()) {
          if (!search_id_map.has(sentence_id))
            result_sentence_map.delete(sentence_id);
        }
        continue;
      }
      // 判断连续情况
      for (const sentence_id of result_sentence_map.keys()) {
        const compare_pos: number[] = [];
        if (search_id_map.has(sentence_id)) {
          // 获得前一个词的位置列表, 以及后一个词的位置列表, 如果前一个词的位置中含有后一个词的位置-1, 则代表两者相邻
          const previous_pos_list = result_sentence_map.get(sentence_id);
          const next_pos_list = search_id_map.get(sentence_id);
          for (const pos of next_pos_list) {
            if (previous_pos_list.includes(pos - 1)) compare_pos.push(pos);
          }
        }
        //如果结果集合中没有该句子id, 则删除
        if (compare_pos.length > 0) {
          result_sentence_map.set(sentence_id, compare_pos);
        } else {
          result_sentence_map.delete(sentence_id);
        }
      }
    }
  }
  print_result(result_sentence_map); // 打印结果
}

/**
 * 打印搜索结果
 * @param result_map 结果对应的id
 */
function print_result(result_map: Map<number, number[]>): void {
  console.log(`一共有${result_map.size}个结果`);
  for (const sentence_id of result_map.keys()) {
    console.log(get_sentence_by_id(sentence_id)); // 打印搜索结果的句子
  }
}

const search_sentence = '世界的本源 思想'; // 搜索短句
console.log(search(search_sentence));
