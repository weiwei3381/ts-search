import * as ort from 'onnxruntime-node';
import * as cv from 'opencv.js';
import WordsNinjaPack from 'wordsninja';

const wordsNinja = new WordsNinjaPack();

console.log(wordsNinja);

async function init(x) {
  dev = x.dev;
  det = await ort.InferenceSession.create(x.det_path);
  rec = await ort.InferenceSession.create(x.rec_path);
  dic = x.dic.split(/\r\n|\r|\n/);
  if (x.max_side) limit_side_len = x.max_side;
  if (x.imgh) imgH = x.imgh;
  if (x.imgw) imgW = x.imgw;
  await WordsNinja.loadDictionary();
  return new Promise((rs) => rs());
}
