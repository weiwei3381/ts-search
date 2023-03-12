/**
 * 单纯使用levelDB构建倒排索引
 */

import level from 'level';
import { config } from './config';
import {
  json_to_map,
  map_to_json,
  split_words,
  list_to_segment,
  Segment,
  ReverseDict,
  merge_lists,
} from './utils';

/**
 * 报纸的接口
 */
interface NewsPaper {
  title: string;
  date: string;
  content: string;
}

// 倒排索引数据库
const reverse_db: level.LevelDB<string, any> = level(config.reverse_db_path);

async function generate_reverse_dict_from_news_json(
  news_json_path: string,
): ReverseDict {}

/**
 * 给倒排索引词典增加段落或者句子
 * @param para 新增的段落或句子
 */
function add_reverse_dict(
  reverse_dict: ReverseDict,
  para: string,
  para_id: number,
) {
  const words_list = split_words(para);
  const segments: Segment[] = list_to_segment(words_list);
  for (const segment of segments) {
    if (!reverse_dict.has(segment.word)) {
      const id_map: Map<number, number[]> = new Map();
      id_map.set(para_id, [segment.pos]);
      reverse_dict.set(segment.word, id_map);
    } else {
      // 获取id对应的map，然后根据情况给id加值
      const id_map = reverse_dict.get(segment.word);
      if (!id_map.has(para_id)) {
        id_map.set(para_id, [segment.pos]);
      } else {
        id_map.get(para_id).push(segment.pos);
      }
    }
  }
}

/**
 * 给倒排索引增加段落
 * @param para 新增段落内容
 * @param para_id 新增段落在数据库中的id
 */
async function add_para(para: string, para_id: number) {
  const words_list = split_words(para);
  const segments: Segment[] = list_to_segment(words_list);
  for (const segment of segments) {
    try {
      // 如果找到了词对应的map, 根据id对应的map，然后根据情况给id加值
      const exist_map_json: string = await reverse_db.get(segment.word);
      const exist_word_map = json_to_map(exist_map_json);
      if (!exist_word_map.has(para_id)) {
        exist_word_map.set(para_id, [segment.pos]);
      } else {
        exist_word_map.get(para_id).push(segment.pos);
      }
      await reverse_db.put(segment.word, map_to_json(exist_word_map)); // 新的进行存储
    } catch (NotFoundError) {
      // 如果没有找到, 则走异常流程
      const new_word_map: Map<number, number[]> = new Map();
      new_word_map.set(para_id, [segment.pos]);
      await reverse_db.put(segment.word, map_to_json(new_word_map));
    }
  }
}

/**
 * 将已有的倒排索引词典加入持久化文件中
 * @param reverse_dict 倒排索引词典
 */
async function add_exist_reverse_dict(reverse_dict: ReverseDict) {
  for (const word of reverse_dict.keys()) {
    const para_id_map = reverse_dict.get(word);
    await add_word_map(word, para_id_map);
  }
}

/**
 * 将段落单个单词以及对应的word_map加入持久化文件中
 * @param word 单词
 * @param para_id_map 单词对应的段落id和位置pos的Map
 */
async function add_word_map(word: string, para_id_map: Map<number, number[]>) {
  try {
    // 如果找到了词对应的map, 根据id对应的map，然后根据情况给id加值
    const exist_map_json: string = await reverse_db.get(word); // 找不到会抛出NotFoundError
    const exist_paraId_map: Map<string | number, number[]> =
      json_to_map(exist_map_json); // 已有的段落id对应的Map

    // 遍历每个段落id对应的位置列表
    for (const para_id of para_id_map.keys()) {
      // 如果已有段落id, 则考虑合并位置后重新设置
      if (exist_paraId_map.has(para_id)) {
        const merged_pos_list = merge_lists(
          exist_paraId_map.get(para_id),
          para_id_map.get(para_id),
        ); // 合并位置list
        exist_paraId_map.set(para_id, merged_pos_list);
      } else {
        // 如果没有段落id, 则直接设置
        exist_paraId_map.set(para_id, para_id_map.get(para_id));
      }
    }
    // 保存map
    await reverse_db.put(word, map_to_json(exist_paraId_map));
  } catch (NotFoundError) {
    // 走异常流程, 则说明没有找到, 则直接保存
    await reverse_db.put(word, map_to_json(para_id_map));
  }
}

async function save_reverse_dict(reverse_dict: ReverseDict) {
  for (const word of reverse_dict.keys()) {
    const word_id_map = reverse_dict.get(word);
  }
}

/**
 * 根据关键词获得索引
 * @param word 搜索关键词
 * @returns 关键词对应的段落索引和出现位置
 */
async function get_word_index(
  word: string,
): Promise<Map<string | number, any>> {
  try {
    const map_json: string = await reverse_db.get(word);
    const map_value: Map<string | number, number> = json_to_map(map_json);
    return map_value;
  } catch (error) {
    console.log(`query [word = ${word}] error: ${error}`);
  }
}

export const reverse_index = { get_word_index, add_para };

(async () => {
  add_para(
    '优待证分为“中华人民共和国退役军人优待证”和“中华人民共和国烈士、因公牺牲军人、病故军人遗属优待证”两种，分别面向符合条件的退役军人和烈士遗属、因公牺牲军人遗属、病故军人遗属等其他优抚对象免费发放。优待证全国统一制发、统一式样、统一编号，整体以红色为基调，以五角星为背景，正面印有优待证种类名称、持证人基本信息、相片、发放单位，配天安门、华表、长城、光荣花图案。',
    99999,
  );
})();
