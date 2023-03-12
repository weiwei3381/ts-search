/**
 * 使用sqlite管理文档
 */

import { Optional, Sequelize, Model, DataTypes } from 'sequelize';
import { config } from './config';
import { split_paragraphs } from './utils';
import { reverse_index } from './reverse_index';
import fs from 'fs';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.documents_path,
  logging: false,
}); // 初始化Sequelize配置

// 文档属性
interface DocumentAttributes {
  id: number;
  title: string; // 文档标题
  author?: string | null; // 文档作者, 可为空
  kind?: string | null; // 文档类型, 可为空
  date?: Date; // 文档时间
  star?: number; // 文档标星, 可为空
  paraLength: number; // 包含段落数量
}

// 段落属性
interface ParagraphAttributes {
  id: number;
  documentId: number; // 所属文档id
  content: string; // 内容
  order: number; // 段落序号
}

type DocumentCreationAttributes = Optional<DocumentAttributes, 'id'>;
type ParagraphCreationAttributes = Optional<ParagraphAttributes, 'id'>;

class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  declare id: number; // Note that the `null assertion` `!` is required in strict mode.
  declare title: string;
  declare author: string | null; // 可为空
  declare kind: string | null;
  declare date: Date | null;
  declare star: number;
  declare paraLength: number;

  // 时间戳, 因为只需要用到创建时间,所以这里只写了createdAt属性
  declare readonly createdAt: Date;
}

class Paragraph
  extends Model<ParagraphAttributes, ParagraphCreationAttributes>
  implements ParagraphAttributes
{
  declare id: number; // Note that the `null assertion` `!` is required in strict mode.
  declare documentId: number;
  declare content: string;
  declare order: number;

  // 时间戳, 因为只需要用到创建时间,所以这里只写了createdAt属性
  declare readonly createdAt: Date;
}

// 定义[文档表]结构
Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false }, // 文档名
    author: { type: DataTypes.STRING, allowNull: true }, // 文档作者, 可以为空
    kind: { type: DataTypes.STRING, allowNull: true }, // 文档种类, 可以为空
    date: { type: DataTypes.DATE, allowNull: true }, // 文档写作时间
    star: { type: DataTypes.INTEGER, defaultValue: 0 }, // 文档星级, 默认为0
    paraLength: { type: DataTypes.INTEGER, allowNull: false }, // 段落数量
  },
  {
    sequelize,
    tableName: 'document',
    timestamps: true,
    updatedAt: false,
  },
);

// 定义[段落表]结构
Paragraph.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    documentId: { type: DataTypes.INTEGER, allowNull: false }, // 对应的文档ID
    order: { type: DataTypes.INTEGER, allowNull: false }, // 段落序号
    content: { type: DataTypes.STRING, allowNull: false }, // 段落内容
  },
  {
    sequelize,
    tableName: 'paragraph',
    timestamps: true,
    updatedAt: false,
  },
);

// 测试文档表结构
(async () => {
  type NewPaper = { title: string; date: string; content: string };
  // 检查数据库中表的当前状态(它具有哪些列,它们的数据类型等),然后在表中进行必要的更改以使其与模型匹配
  await sequelize.sync({ alter: true });

  const txt: string = fs.readFileSync('./data/科技信息.json', {
    encoding: 'utf-8',
  });
  const new_paper_list: Array<NewPaper> = JSON.parse(txt);
  for (const new_paper of new_paper_list) {
    const news_paras = split_paragraphs(new_paper.content); // 获得拆分后的段落数据
    const document = await Document.create({
      title: new_paper.title,
      paraLength: news_paras.length,
      date: new Date(new_paper.date),
    });
    const document_id = document.id;
    for (let i = 0; i < news_paras.length; i++) {
      const para_content = news_paras[i];
      const para = await Paragraph.create({
        documentId: document_id,
        content: para_content,
        order: i,
      });
      await reverse_index.add_para(para.content, para.id);
    }
  }
})();
