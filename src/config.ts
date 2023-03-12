export const config = {
  reverse_dict_db: './data/mydb.json', // 倒排索引的数据库
  sentences_db: './data/sentences.json', // 语句的数据库
  file_path: './data/硬核前沿科普.txt',
  levelDb_path: 'C:\\Users\\weiwe\\Documents\\.searchData\\reverse.db', // levelDB使用的数据库
  dict_db_path: 'C:\\Users\\weiwe\\Documents\\.searchData\\dict.db', // levelDB存储词典的索引文件
  reverse_db_path: './data/reverse_index', // levelDB存储倒排索引文件
  documents_path: './data/documents.sqlite', // 文档的sql存储地址
  // 无意义词列表，包括各种常见标点符号
  meaningless_words: `，。；、？！“”《》（）1234567890%+=_-　`,
};
