import sjs from 'simhash-js';

const simhash = new sjs.SimHash();

const x = simhash.hash(
  `T新华社北京4月21日电  4月21日，国家主席习近平向在上海“世界会客厅”举办的“中国式现代化与世界”蓝厅论坛致贺信。习近平指出，实现现代化是近代以来中国人民的不懈追求，也是世界各国人民的共同追求。一个国家走向现代化，既要遵循现代化的一般规律，更要符合本国实际、具有本国特色。中国共产党团结带领全国各族人民，经过长期艰辛探索找到了符合中国国情的发展道路，正在以中国式现代化全面推进强国建设、民族复兴。中方愿同各国一道，努力以中国式现代化新成就为世界发展提供新机遇，为人类探索现代化道路和更好社会制度提供新助力，推动构建人类命运共同体。“中国式现代化与世界”蓝厅论坛由中国公共外交协会、中国人民外交学会和上海市人民政府共同主办，近80国政府、智库、媒体代表参加。`,
);

const y = simhash.hash(
  `习近平指出，实现现代化是近代以来中国人民的不懈追求，也是世界各国人民的共同追求。一个国家走向现代化，既要遵循现代化的一般规律，更要符合本国实际、具有本国特色。中国共产党团结带领全国各族人民，经过长期艰辛探索找到了符合中国国情的发展道路，正在以中国式现代化全面推进强国建设、民族复兴。中方愿同各国一道，努力以中国式现代化新成就为世界发展提供新机遇，为人类探索现代化道路和更好社会制度提供新助力，推动构建人类命运共同体。`,
);

console.log(x);
console.log(y);

const s = sjs.Comparator.similarity(x, y);

console.log(s);
