/**
 * 测试levelDB存储倒排索引
 */

import level from 'level';
import { config } from './config';
import { json_to_map, map_to_json } from './utils';

const db: level.LevelDB<string, any> = level(config.levelDb_path);

let save_num = 0;
async function save_map(
  key: string,
  value: Map<string | number, unknown>,
): Promise<void> {
  const json_value: string = map_to_json(value);
  try {
    await db.put(key, json_value);
    save_num += 1;
    if (save_num % 1000 === 0) console.log(save_num);
  } catch (error) {
    console.log(`save [key = ${key}] error: ${error}`);
  }
}

async function query_map(key: string): Promise<Map<string | number, any>> {
  try {
    const map_json: string = await db.get(key);
    const map_value: Map<string | number, any> = json_to_map(map_json);
    return map_value;
  } catch (error) {
    console.log(`query [key = ${key}] error: ${error}`);
  }
}

/**
 * 构建levelDB
 */
async function build() {
  const reverse_dict = new Map();
  for (const key of reverse_dict.keys()) {
    const sentence_id_map = reverse_dict.get(key);
    await save_map(key, sentence_id_map);
  }
}

async function get(key: string): Promise<Map<any, any>> {
  const result_map = await query_map(key);
  return result_map;
}

export const reverse_dict = { get };
