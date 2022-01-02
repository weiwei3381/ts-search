/**
 * 搜索测试
 */

import { split_words } from './utils';
import { cloneDeep } from 'lodash';
import { reverse_dict } from './level-db';
import fs from 'fs';
import { config } from './config';

const sentence_list_txt = fs.readFileSync(config.sentences_db, {
  encoding: 'utf-8',
});
export const sentence_list: string[] = JSON.parse(sentence_list_txt);
/**
 * 根据句子id返回指定的句子
 * @param id 句子id
 * @returns 句子
 */
export function get_sentence_by_id(id: number): string {
  return sentence_list[id];
}

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

async function search_continue_part(
  continue_part: string[],
): Promise<Map<number, number[]>> {
  // 获取第一个词元对应的结果, 将以这个结果不断缩减
  const init_map = await reverse_dict.get(continue_part[0]);
  const result_sentence_map: Map<number, number[]> = cloneDeep(init_map);

  for (let i = 1; i < continue_part.length; i++) {
    const search_element: string = continue_part[i];
    const search_id_map = await reverse_dict.get(search_element);

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
  return result_sentence_map;
}

/**
 * 搜索得到对应的结果, 根据连续和空格进行区分, 例如搜索关键词为"世界的本源 思想",
 * 就搜索文章中含有"世界的本源"和"思想"的所有文本
 * @param search_value 搜索关键词
 */
async function search(search_value: string): Promise<Map<number, number[]>> {
  const search_continue_parts = split_search_value(search_value); // 获取连续搜索词元部分
  // 如果没有搜索词, 则返回为空
  if (search_continue_parts.length === 0) {
    console.info('请输入搜索关键词');
    return new Map();
  }

  // 如果搜索词只有一个连续长度, 直接返回即可
  if (search_continue_parts.length === 1) {
    const continue_result = await search_continue_part(
      search_continue_parts[0],
    );
    return continue_result;
  }

  // 多个连续部分进行求交集
  const continue_result_maps: Array<Map<number, number[]>> = []; // 连续部分结果集合
  for (const continue_part of search_continue_parts) {
    const continue_result = await search_continue_part(continue_part);
    continue_result_maps.push(continue_result);
  }
  // 获取第一个词元对应的结果, 将以这个结果不断缩减
  const result_sentence_map: Map<number, number[]> = cloneDeep(
    continue_result_maps[0],
  );
  for (let i = 1; i < continue_result_maps.length; i++) {
    const comp_map = continue_result_maps[i];
    for (const result_key of result_sentence_map.keys()) {
      if (!comp_map.has(result_key)) result_sentence_map.delete(result_key);
    }
  }
  return result_sentence_map;
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

async function main() {
  print_result(await search('人道主义困难'));
  console.log('==============================================================');
  print_result(await search('全方位 全覆盖的民主'));
  console.log('==============================================================');
  print_result(await search('重大风险 经济工作会议'));
  console.log('==============================================================');
  print_result(await search('中国疫苗 热烈欢迎'));
  console.log('==============================================================');
  print_result(await search('中国共产党和中国人民 发展道路'));
}

main();
