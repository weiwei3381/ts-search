import level from 'level';
import fs from 'fs';
import { config } from './config';

const db: level.LevelDB<string, any> = level(config.levelDb_path);

/**
 * 将迭代器的异步next方法改为同步方法
 * @param iterator leveldb的迭代器
 * @returns
 */
function asyncNext(
  iterator,
): Promise<{ key: string | undefined; value: string | undefined }> {
  return new Promise((resolve, reject) => {
    iterator.next((error, key, value) => {
      if (error) {
        reject(error);
      }
      resolve({ key, value });
    });
  });
}

/**
 * 根据出现次数和段落总数将计数count转为idf，idf越大，说明单词越重要
 * @param count 单词出现次数
 * @param sum 段落总数
 * @returns 单词的idf
 */
function count_to_idf(count: number, sum: number): number {
  const idf = Math.LOG10E * Math.log(sum / count);
  return Number(idf.toFixed(3));
}

async function readAll() {
  console.log('开始');
  const SUM = 412099; // 总数
  const wordCountList: Array<{
    target: string;
    count: number;
  }> = []; // 计算文字个数
  const iterator = db.iterator();
  while (true) {
    const item = await asyncNext(iterator);
    if (!item.key) break;
    const valueData: Array<[number, Array<number>]> = JSON.parse(item.value);
    const appearNum = valueData.length; // 在句子中出现的次数，不管在句子中出现多少次只算1次
    // 在句子中出现n次则算n次，则需要用循环
    // for (const value of valueData) {
    //   appearNum += value[1].length;
    // }
    wordCountList.push({
      target: item.key,
      count: appearNum,
    });
  }
  // 排序后的次数，按照次数有多到少排序，然后取前10万个
  const sortCountList = wordCountList
    .sort((a, b) => b.count - a.count)
    .slice(0, 40000);
  // 将idf的对象及其idf值存入对象
  const idf_map = {};
  for (const countItem of sortCountList) {
    idf_map[countItem.target] = count_to_idf(countItem.count, SUM);
  }
  // 将排序后的次数转为idf重要性
  const idf_list: Array<{
    w: string;
    idf: number;
  }> = sortCountList.map((w) => {
    const idf = count_to_idf(w.count, SUM);
    return {
      w: w.target,
      idf,
    };
  });
  // 将idf的列表转为json
  const listData = JSON.stringify(idf_list);
  const mapData = JSON.stringify(idf_map);
  console.log(`共有${idf_list.length}段`);

  // write JSON string to a file
  fs.writeFile('./10万个常用单词的idf_1022.json', listData, (err) => {
    if (err) {
      throw err;
    }
    console.log('JSON data is saved.');
  });

  fs.writeFile('./map形式_4万个常用单词的idf_1022.json', mapData, (err) => {
    if (err) {
      throw err;
    }
    console.log('JSON data is saved.');
  });
}

readAll();
