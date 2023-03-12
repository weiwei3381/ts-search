import { marked } from 'marked';

console.log(marked('# Marked in browser\nRendered by **marked**.'));

marked.setOptions({
  pedantic: false,
  gfm: false,
  breaks: false,
});
