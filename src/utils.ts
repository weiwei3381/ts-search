import nodejieba from 'nodejieba';
import { config } from './config';

/**
 * 词元, 包括词名, 词在句子中的位置和词性, 其中词性为可选项
 */
export interface Segment {
  word: string; // 分割后的词
  pos: number; // 词所在的位置，从0开始
  property?: '名词' | '动词' | '形容词' | '副词'; // 词性
}

export type ReverseDict = Map<string, Map<number, number[]>>; // 倒排索引, 关键词 -> {对应段落id -> [出现位置1, 出现位置2,...]}

// nodejieba带标签分词内容
/**
 * 
专名类别标签集合如下表，其中词性标签 24 个（小写字母），专名类别标签 4 个（大写字母）。

n	普通名词	f	方位名词	s	处所名词	t	时间
nr	人名	ns	地名	nt	机构名	nw	作品名
nz	其他专名	v	普通动词	vd	动副词	vn	名动词
a	形容词	ad	副形词	an	名形词	d	副词
m	数量词	q	量词	r	代词	p	介词
c	连词	u	助词	xc	其他虚词	w	标点符号
PER	人名	LOC	地名	ORG	机构名	TIME	时间
 */

export type TagResult = {
  word: string;
  tag: string;
};

/**
 * 对指定句子进行分词
 * @param sentence 句子
 * @returns 分词后的列表
 */
export function split_words(sentence: string): string[] {
  const result: string[] = nodejieba.cut(sentence);
  return result;
}

export function split_words_with_tag(sentence: string): TagResult[] {
  const results: TagResult[] = nodejieba.tag(sentence);
  return results;
}

/**
 * 对分词后的列表进行处理, 形成词元列表
 * @param word_list 分词后的列表
 * @returns 词元
 */
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
export function json_to_map(json_txt: string): Map<string | number, any> {
  return JSON.parse(json_txt, reviver);
}

/**
 * 将Map递归转成{dataType: 'Map', value: list}的对象格式
 */
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

/**
 * 将对象格式{dataType: 'Map', value: list}转回Map格式
 */
function reviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

/**
 * 给倒排索引词典增加段落或者句子
 * @param reverse_dict 倒排索引
 * @param sentence 新增的段落或句子
 * @param sentence_id 新增的段落或句子的id
 */
export function add_reverse_dict(
  reverse_dict: ReverseDict,
  sentence: string,
  sentence_id: number,
) {
  const meaningless_words_map = get_meaningless_words_map(); // 无意义词
  const words_list = split_words(sentence); // 先分词
  const segments: Segment[] = list_to_segment(words_list); // 形成词元列表
  // 对每个词元, 判断是否在倒排索引中已经存在, 如果不存在, 则新增一个Map(段落id->位置), 否则在原有的Map(段落id->位置)中新增
  for (const segment of segments) {
    if (meaningless_words_map.has(segment.word)) continue; // 如果是无意义词, 则跳走
    if (!reverse_dict.has(segment.word)) {
      const id_map: Map<number, number[]> = new Map();
      id_map.set(sentence_id, [segment.pos]);
      reverse_dict.set(segment.word, id_map);
    } else {
      const id_map = reverse_dict.get(segment.word); // 获取原有段落id的map
      // 如果原有Map中已经有没有该段落id, 则新增, 如果有,则在位置列表中加入一个新位置即可
      if (!id_map.has(sentence_id)) {
        id_map.set(sentence_id, [segment.pos]);
      } else {
        id_map.get(sentence_id).push(segment.pos);
      }
    }
  }
}

/**
 * 获得无意义词对应Map
 * @returns 无意义词的Map格式
 */
export function get_meaningless_words_map(): Map<string, number> {
  const meaningless_word_map: Map<string, number> = new Map();
  const meaningless_word_list: string[] = config.meaningless_words.split(''); // 获得无意义词列表
  for (const word of meaningless_word_list) {
    meaningless_word_map.set(word, 1);
  }
  return meaningless_word_map;
}

export function split_paragraphs(content: string): string[] {
  const raw_paras = content.split('\n'); // 获得纯段落
  const paras = []; // 返回的段落
  for (let i = 0; i < raw_paras.length; i++) {
    const para_i = raw_paras[i].trim();
    if (para_i.length > 3) paras.push(para_i);
  }
  return paras;
}

/**
 * 将相同类型列表进行合并并进行去重
 * @param list1 列表1
 * @param list2 列表2
 * @returns 合并后的列表
 */
export function merge_lists<T>(list1: Array<T>, list2: Array<T>): Array<T> {
  return Array.from(new Set([...list1, ...list2]));
}
