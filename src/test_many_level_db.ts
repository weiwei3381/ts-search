// 测试多个levelDB的稳定性
import level from 'level';
import fs from 'fs';

// 词向量数据库
const wordVectorDb: level.LevelDB<string, any> = level('./data/wordVec.db');
// 相似词数据库
const similarDb: level.LevelDB<string, any> = level('./data/similar.db');
// 语言模型数据库
const wordModel: level.LevelDB<string, any> = level('./data/model.db');

// 保存测试数据
async function save_similar(key: string, value: string): Promise<void> {
  try {
    await similarDb.put(key, value);
    await wordModel.put(key, value);
    await wordVectorDb.put(key, 1);
  } catch (error) {
    console.log(`save [key = ${key}] error: ${error}`);
  }
}

function save_data(): void {
  const similarDict: Record<string, Array<any>> = JSON.parse(
    fs.readFileSync('./data/近义词_30_带相似度.json', { encoding: 'utf-8' }),
  ); // 获得近义词数据

  // 获得近义词
  const keys = Object.keys(similarDict);
  keys.forEach(async (key) => {
    await save_similar(key, JSON.stringify(similarDict[key]));
  });
}

async function read_data() {
  const data1: string = await similarDb.get('疫情');
  console.log(data1);
  const data2: string = await wordVectorDb.get('大家');
  console.log(data2);
  const data3: string = await wordModel.get('大家');
  console.log(data3);
}

read_data();
console.log('运行完毕');
