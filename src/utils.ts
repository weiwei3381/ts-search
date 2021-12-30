import { Segment, useDefault } from 'segmentit';

const segmentit = useDefault(new Segment());

export interface Segment {
  word: string; // 分割后的词
  pos: number; // 词所在的位置，从0开始
}

export type ReverseDict = Map<string, Map<number, number[]>>;

/**
 * 对指定句子进行分词
 * @param sentence 句子
 * @returns 分词后的列表
 */
export function split_words(sentence: string): string[] {
  const result: string[] = segmentit.doSegment(sentence, {
    simple: true,
  });
  return result;
}

export function list_to_segment(word_list: string[]) {
  const segments: Segment[] = []; // 每个词位置单元
  for (let i = 0; i < word_list.length; i++) {
    segments.push({
      word: word_list[i],
      pos: i,
    });
  }
  return segments;
}

/**
 * JSON的stringify方法无法转换Map对象，因此参考了一些解决方案
 * https://stackoverflow.com/questions/29085197/how-do-you-json-stringify-an-es6-map
 * @param map_obj Map对象
 * @returns
 */
export function map_to_json(map_obj: Map<string | number, unknown>): string {
  return JSON.stringify(map_obj, replacer);
}

/**
 * 将json文本转换为map对象
 * @param json_txt json的文本
 * @returns map对象
 */
export function json_to_map(json_txt: string): Map<string, any> {
  return JSON.parse(json_txt, reviver);
}

function replacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

function reviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}
