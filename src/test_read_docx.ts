import mammoth from 'mammoth';
import { Document } from 'docxyz';

// const fileName = 'D:\\js_projects\\ts-search\\data.docx';
// const document = new Document(fileName);
// console.log(document.paragraphs[0]);
// console.log(document.text);

function transformParagraph(element) {
  if (element.children[0]) {
    const value = element.children[0].children[0].value;
    if (
      /^[一二三四五六七八九十]{1,2}、.{0,}/.exec(value) &&
      !element.styleName
    ) {
      return { ...element, styleName: 'Heading 1' };
    } else if (
      /^（[一二三四五六七八九十]{1,2}）.{0,}/.exec(value) &&
      !element.styleName
    ) {
      return { ...element, styleName: 'Heading 2' };
    } else {
      return element;
    }
  }
  return element;
}

mammoth
  .convertToMarkdown(
    { path: 'C:\\Users\\weiwe\\Documents\\测试文档_20221223120031.docx' },
    {
      transformDocument: mammoth.transforms.paragraph(transformParagraph),
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
        "p[style-name='Heading 3'] => h4:fresh",
        "p[style-name='Heading 4'] => h5:fresh",
        "p[style-name='Heading 5'] => h6:fresh",
        'b => strong',
      ],
    },
  )
  .then((result) => {
    const mdText = result.value;
    console.log(mdText.replace(/__/g, '**'));
  });
