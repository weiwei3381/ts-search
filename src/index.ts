import fs from 'fs';
import lineReader from 'line-reader';
import {
  split_words,
  list_to_segment,
  Segment,
  map_to_json,
  ReverseDict,
} from './utils';
import { config } from './config';

let line_id = 0; // 当前行位置，也是id
const max_line_num = 99999999; // 最大行数

const reverse_dict: ReverseDict = new Map(); // 关键词
const sentence_list: string[] = []; // 句子列表

lineReader.eachLine(config.file_path, (line, last) => {
  if (last || line_id > max_line_num) {
    fs.writeFileSync(config.reverse_dict_db, map_to_json(reverse_dict));
    fs.writeFileSync(config.sentences_db, JSON.stringify(sentence_list));
    console.log('写入文件成功!');
    console.log(sentence_list.length);
    console.log(line_id);

    return false;
  }
  if (line.length > 3) {
    sentence_list.push(line);
    const words_list = split_words(line);
    const segments: Segment[] = list_to_segment(words_list);
    for (const segment of segments) {
      if (!reverse_dict.has(segment.word)) {
        const id_map: Map<number, number[]> = new Map();
        id_map.set(line_id, [segment.pos]);
        reverse_dict.set(segment.word, id_map);
      } else {
        // 获取id对应的map，然后根据情况给id加值
        const id_map = reverse_dict.get(segment.word);
        if (!id_map.has(line_id)) {
          id_map.set(line_id, [segment.pos]);
        } else {
          id_map.get(line_id).push(segment.pos);
        }
      }
    }
    line_id += 1;
  }
});
