// 测试词典
import { Level } from 'level';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const dictDb: Level<string, any> = new Level(config.dict_db_path);

interface DictItem {
  item: string;
  description: string;
}

// 获得当前所有词典的名称
async function getDictNames() {
  let dictNames: string[] = [];
  try {
    const namesText = await dictDb.get('__dictNames__'); // 获得纯文本
    dictNames = JSON.parse(namesText);
  } catch (NotFoundError) {}
  const dictNamesMap = new Map<number, string>(); // 词典名称Map，0-
  for (let i = 0; i < dictNames.length; i += 1) {
    const dictName = dictNames[i];
    dictNamesMap.set(i, dictName);
  }
  return {
    list: dictNames,
    map: dictNamesMap,
  };
}

// 增加词典名称
async function addDictName(dictName: string): Promise<number> {
  const { list: allDictNames } = await getDictNames(); // 获得所有词典
  const addDictNames = [...allDictNames, dictName]; // 增加的词典
  await dictDb.put('__dictNames__', JSON.stringify(addDictNames));
  return addDictNames.length - 1;
}

export function mergeListJsonDirectly(listJson1: string, listJson2: string) {
  const mergeJson =
    listJson1.slice(0, listJson1.length - 1) + ',' + listJson2.slice(1);
  return mergeJson;
}

// 导入词典文件
async function importDictFile(filePath: string) {
  // 获得文件名作为词典名称
  const { name: dictName } = path.parse(filePath);
  console.log(`正在增加词典：${dictName}，请稍候...`);

  const jsonTxt: string = fs.readFileSync(filePath, {
    encoding: 'utf-8',
  });
  const notFoundOps = []; // 所有找不到的键, 应该对应的操作
  const existKeyOps = []; // 所有能找到的键, 应对应的操作
  try {
    const dictSet: DictItem[] = JSON.parse(jsonTxt); // 获得导入json
    const dictIndex = await addDictName(dictName); // 将词典加入levelDB数据库，返回词典id
    const allKeys = dictSet.map((d) => d.item); // 所有key的列表
    const existedValue = await dictDb.getMany(allKeys); // 找到所有解释
    for (let i = 0; i < existedValue.length; i += 1) {
      // 如果没有找到，则直接加入kv数据库
      if (existedValue[i] === undefined) {
        notFoundOps.push({
          type: 'put',
          key: allKeys[i],
          value: JSON.stringify([[dictIndex, dictSet[i].description]]),
        });
      } else {
        const existDes = existedValue[i]; // 当前kv数据库中存储的解释, 带词典id序号
        const currentDes = JSON.stringify([
          [dictIndex, dictSet[i].description],
        ]);
        existKeyOps.push({
          type: 'put',
          key: allKeys[i],
          value: mergeListJsonDirectly(existDes, currentDes),
        });
      }
    }
    // 处理所有没有找到的key和已有的key, 更新levelDB
    await dictDb.batch(notFoundOps);
    await dictDb.batch(existKeyOps);
  } catch (error) {
    console.log(`出现错误，代码为：${error}`);
  }
}

async function query(name: string) {
  try {
    const { map: dictNameMap } = await getDictNames();
    const value = await dictDb.get(name);
    const itemList = JSON.parse(value);
    for (const item of itemList) {
      const dictName = dictNameMap.get(item[0]);
      const des = item[1];
      console.log(`《${dictName}》\n${des}》`);
    }
  } catch (NotFoundError) {
    console.log('没有找到对应key');
  }
}

async function test() {
  await query('宏图');
  console.log('执行完毕');
}

test();
