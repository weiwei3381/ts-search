/**
 * 使用json文件构建词典文件, 使用大约16万行数据, 3400万字, 效果不错
 */

import fs from 'fs';
import { map_to_json, ReverseDict, add_reverse_dict } from './utils';
import { config } from './config';

/**
 * 例如:
 * {"t": "加快建设全国统一大市场提高政府监管效能深入推进世界一流大学和一流学科建设",
 * "p": "reference/2021-12-18.html#加快建设全国统一大市场提高政府监管效能深入推进世界一流大学和一流学科建设-人民日报",
 * "d": "　　■ 发展社会主义市场经济是我们党的一个伟大创造，关键是处理好政府和市场的关系，使市场在资源配置中起决定性作用，更好发挥政府作用。构建新发展格局，迫切需要加快建设高效规范、公平竞争、充分开放的全国统一大市场，建立全国统一的市场制度规则，促进商品要素资源在更大范围内畅通流动。要加快转变政府职能，提高政府监管效能，推动有效市场和有为政府更好结合，依法保护企业合法权益和人民群众生命财产安全。要突出培养一流人才、服务国家战略需求、争创世界一流的导向，深化体制机制改革，统筹推进、分类建设一流大学和一流学科。科技伦理是科技活动必须遵守的价值准则，要坚持增进人类福祉、尊重生命权利、公平公正、合理控制风险、保持公开透明的原则，健全多方参与、协同共治的治理体制机制，塑造科技向善的文化理念和保障机制。要推动发展适合中国国情、政府政策支持、个人自愿参加、市场化运营的个人养老金，与基本养老保险、企业（职业）年金相衔接，实现养老保险补充功能　　"},
 */
interface Index {
  t: string; // 标题
  p: string; // 文件位置
  d: string; // 描述
}

let sentence_id = 0; // 段落id
const json_file = './data/报纸索引.json';
const reverse_dict: ReverseDict = new Map(); // 关键词
const sentence_list: string[] = []; // 句子列表

/**
 * 保存数据
 */
function save_data(): void {
  fs.writeFileSync(config.reverse_dict_db, map_to_json(reverse_dict));
  fs.writeFileSync(config.sentences_db, JSON.stringify(sentence_list));
  console.log(`写入文件成功!, 共写入${sentence_list.length}条数据`);
}

/**
 *制作倒排索引文件
 */
function build_reverse_index(): void {
  const indexes: Index[] = JSON.parse(
    fs.readFileSync(json_file, { encoding: 'utf-8' }),
  ); // 获得索引文件
  console.log(`需要处理${indexes.length}条句子`);

  for (const index of indexes) {
    if (sentence_id % 500 === 0) console.log(sentence_id);
    sentence_list.push(index.d);
    add_reverse_dict(reverse_dict, index.d, sentence_id);
    sentence_id += 1;
  }

  save_data();
}

build_reverse_index();
