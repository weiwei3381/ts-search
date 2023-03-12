import * as ort from 'onnxruntime-node';
import fs from 'fs';

// use an async context to call onnxruntime functions.
async function test() {
  try {
    // create a new session and load the specific model.
    //
    // the model in this example contains a single MatMul node
    // it has 2 inputs: 'a'(float32, 3x4) and 'b'(float32, 4x3)
    // it has 1 output: 'c'(float32, 3x3)
    const session = await ort.InferenceSession.create(
      'D:\\js_projects\\ts-search\\src\\model.onnx',
    );

    // prepare inputs. a tensor need its corresponding TypedArray as data
    const dataA = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const dataB = Float32Array.from([
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
    ]);
    const tensorA = new ort.Tensor('float32', dataA, [3, 4]);
    const tensorB = new ort.Tensor('float32', dataB, [4, 3]);

    // prepare feeds. use model input names as keys.
    const feeds = { a: tensorA, b: tensorB };

    // feed inputs and run
    const results = await session.run(feeds);

    // read from results
    const dataC = results.c.data;
    console.log(`data of result tensor 'c': ${dataC}`);
  } catch (e) {
    console.error(`failed to inference ONNX model: ${e}.`);
  }
}

// 获得最大的n个对象索引
const getMaxNumIndex = (l: Float32Array | Float64Array | number[], n = 2) => {
  const max_list = [];
  const max_indexes = [];
  for (let i = 0; i < n; i += 1) {
    max_list.push(-999999);
    max_indexes.push(-1);
  }
  for (let i = 0; i < l.length; i += 1) {
    const current = l[i];
    let flag = false;
    for (let j = 0; j < max_list.length; j += 1) {
      if (max_list[j] < current) {
        max_list[j] = current;
        max_indexes[j] = i;
        flag = true;
      }
      if (flag) {
        break;
      }
    }
  }
  return max_indexes;
};

function exp(l: Float32Array | Float64Array | number[]) {
  const expList: number[] = [];
  for (let i = 0; i < l.length; i += 1) {
    const current = l[i];
    expList.push(Math.exp(current));
  }
  return expList;
}

// 对list进行softmax操作, 转换成概率值
function softmax(l: Float32Array | Float64Array | number[]) {
  const expList = exp(l);
  const softmaxList: number[] = [];
  let expSum = 0;
  for (const ep of expList) {
    expSum += ep;
  }
  for (let i = 0; i < expList.length; i += 1) {
    const ep = expList[i];
    softmaxList.push(ep / expSum);
  }
  return softmaxList;
}

function filterTopK(
  softmaxList: Float32Array | Float64Array | number[],
  topK: number,
) {
  const maxIndexes = getMaxNumIndex(softmaxList, topK); // 获得topK个位置
  const filterList: number[] = []; // 过滤后的list
  for (let i = 0; i < softmaxList.length; i += 1) {
    if (maxIndexes.indexOf(i) >= 0) {
      filterList.push(softmaxList[i]);
    } else {
      filterList.push(0);
    }
  }
  return filterList;
}

// 根据概率随机选取一个index
function choiceByProb(probList: Float32Array | Float64Array | number[]) {
  let probSum = 0; // 概率和
  for (const prob of probList) {
    probSum += prob;
  }
  const randNum = Math.random() * probSum;
  let startValue = 0;
  for (let i = 0; i < probList.length; i += 1) {
    const prob = probList[i];
    if (randNum >= startValue && randNum <= startValue + prob) {
      return i;
    }
    startValue += prob;
  }
}

// 加载分词器文件
function loadTokenizer(vocabPath: string) {
  const content = fs.readFileSync(vocabPath, { encoding: 'utf-8' });
  const int2token: Array<string> = content.split('\n');
  // token到索引int的映射map
  const token2int = new Map<string, number>();
  for (let i = 0; i < int2token.length; i += 1) {
    token2int.set(int2token[i], i);
  }
  return { int2token, token2int };
}

// 把文本切分成tokens
function splitTotokens(text: string) {
  const tokens: string[] = [];
  const raws = text.split('');
  const mergeReg = /[a-zA-Z0-9]/;
  let merge = [];
  for (let i = 0; i < raws.length; i += 1) {
    const rawToken = raws[i]; // 未加工的token
    if (rawToken === ' ') {
      if (merge.length > 0) {
        tokens.push(merge.join(''));
        merge = [];
      }
      continue;
    }
    if (mergeReg.test(rawToken)) {
      merge.push(rawToken);
    } else {
      if (merge.length > 0) {
        tokens.push(merge.join(''));
        merge = [];
      }
      tokens.push(rawToken);
    }
  }
  return tokens;
}

function text2tokens(text: string, token2int: Map<string, number>) {
  const segments = splitTotokens(text); // 获得词元列表
  const tokens: bigint[] = []; // tokens列表
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (token2int.has(segment)) {
      tokens.push(BigInt(token2int.get(segment)));
    } else {
      if (segment.length <= 1) {
        tokens.push(BigInt(token2int.get('[UNK]'))); // 如果找不到,而且词元长度为1, 则给[UNK]标识符
      } else {
        // 获得长词元,例如201314的小token, 然后逐个加入tokens中去
        const segTokens = getSegmentTokens(segment, token2int);
        for (const t of segTokens) {
          tokens.push(t);
        }
      }
    }
  }
  return tokens;
}

function getSegmentTokens(segment: string, token2int: Map<string, number>) {
  const tokenList: bigint[] = []; // 最后形成的list
  let isUnknown = false; // 整体的tokenList是不是为[UKN]

  // 获取第一个token, 需要递归调用
  const getFirstToken = (seg: string, isStart = false): void => {
    const len = seg.length;
    if (seg.length > 0) {
      let n = 0; // 缩小的幅度
      while (len > n) {
        let narrowSeg = seg.slice(0, len - n); // 缩小的seg
        const lastSeg = seg.slice(len - n, len); // 剩余的seg
        const narrowSegLen = narrowSeg.length; // 缩小的seg长度, 如果为1了还是没搜到, 那么就得考虑插入[UKN]
        // 如果不是开头,则需要在前面加##进行匹配
        if (!isStart) {
          narrowSeg = '##' + narrowSeg;
        }
        if (token2int.has(narrowSeg)) {
          tokenList.push(BigInt(token2int.get(narrowSeg)));
          getFirstToken(lastSeg, false);
          break;
        } else {
          if (narrowSegLen === 1) {
            isUnknown = true;
            tokenList.push(BigInt(token2int.get('[UKN]')));
            getFirstToken(lastSeg, false);
            break;
          }
          n += 1;
        }
      }
    }
  };

  getFirstToken(segment, true);
  // 如果有一个子词为unknown, 那么整个都是unknown, 也返回[ukn]
  if (isUnknown) {
    return [BigInt(token2int.get('[UKN]'))];
  }
  return tokenList;
}

async function GPT2Model(
  session: ort.InferenceSession,
  initInputs: bigint[],
  append_indexes: bigint[],
) {
  try {
    let inputs = [...initInputs];
    if (append_indexes.length > 0) {
      inputs = [...initInputs, ...append_indexes];
    }
    const attentionArray: bigint[] = [];
    for (let i = 0; i < inputs.length; i += 1) {
      attentionArray.push(1n);
    }
    // 加载tokenizer
    const feeds = {
      input_ids: new ort.Tensor('int64', BigInt64Array.from(inputs), [
        1,
        inputs.length,
      ]),
      attention_mask: new ort.Tensor(
        'int64',
        BigInt64Array.from(attentionArray),
        [1, inputs.length],
      ),
    };
    console.time('gpt');
    const results = await session.run(feeds);
    console.timeEnd('gpt');
    const tokenNum: number =
      results.logits.dims[results.logits.dims.length - 1]; // 获得分词数量
    // 获得最后一个维度的数组
    const lastLogits = results.logits.data.slice(
      results.logits.data.length - tokenNum,
    ) as Float32Array;
    // 给重复项增加一个惩罚系数
    const noDupliInputs = new Set(inputs);
    for (const id of noDupliInputs) {
      lastLogits[Number(id)] = lastLogits[Number(id)] / 1.25;
    }
    // 求最后一个维度数组的softmax概率
    const softLogits = softmax(lastLogits);
    const filterList = filterTopK(softLogits, 8);
    const indexesOfMax = [choiceByProb(filterList)];
    // const indexesOfMax = getMaxNumIndex(lastLogits, 2);
    return indexesOfMax;
  } catch (error) {
    console.log(`error: ${error}`);
  }
}

const main = async (text: string) => {
  console.time('loadModel');
  // 加载模型
  // const session = await ort.InferenceSession.create(
  //   'C:\\Users\\weiwe\\hungging_face\\model\\model.onnx',
  // );
  const session = await ort.InferenceSession.create(
    'D:\\onnx_model\\fine-tunning\\decoder_model.onnx',
  );
  console.timeEnd('loadModel');

  console.time('loadTokenizer');
  // 加载tokenizer
  // const { int2token, token2int } = loadTokenizer(
  //   'C:\\Users\\weiwe\\.cache\\huggingface\\hub\\models--IDEA-CCNL--Wenzhong2.0-GPT2-110M-BertTokenizer-chinese\\snapshots\\333cdaddc9d53708829ccad1abc7ba70536449ef\\vocab.txt',
  // );
  const { int2token, token2int } = loadTokenizer(
    'D:\\onnx_model\\fine-tunning\\vocab.txt',
  );
  console.timeEnd('loadTokenizer');

  const genTextNum = 5; // 生成的文本数量
  const appendCharNum = 40; // 续写的词的数量
  const allGenTexts = []; // 生成的所有文本
  for (let tn = 0; tn < genTextNum; tn += 1) {
    console.time('epoch');
    const initInputs = text2tokens(text, token2int); // 初始输入
    const indexes: bigint[] = []; // 最后输出的output索引
    for (let i = 0; i < appendCharNum; i += 1) {
      console.time('oneToken');
      // 获得8个概率最大的索引位置
      console.time('getIndex');
      const indexesOfMax = await GPT2Model(session, initInputs, indexes);
      console.timeEnd('getIndex');
      // 从8个概率最大的索引位置中随机获得其中1个索引
      const randIndex =
        indexesOfMax[Math.floor(Math.random() * indexesOfMax.length)];
      // 把获得的随机索引放入索引列表中
      indexes.push(BigInt(randIndex));
      // 随机索引对应的字符
      const randchar = int2token[randIndex];
      // 如果是句号，则跳出循环
      if (randchar === '。') {
        break;
      }
      console.timeEnd('oneToken');
    }
    let genText = text;
    for (const index of indexes) {
      genText += int2token[Number(index)];
    }
    allGenTexts.push(genText);
    console.timeEnd('epoch');
  }
  for (const t of allGenTexts) {
    console.log(t);
  }
};

main('根据自己的理解，将代码进行重构，添加详细注释，希望可以');
