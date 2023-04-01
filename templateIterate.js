const fs = require("fs");
function readFile(name) {
  const buffer = fs.readFileSync(name,{ encoding: 'utf8' });
  return clearComment(buffer.toString()).trim();
}

function writeFile(name, content) {
  fs.writeFileSync(name, content);
}

const argv = process.argv;
let debug = false;
if (argv.includes('-debug=true')) {
  debug = true;
}
const SPLITTER = '\n---------\n';

const regexVariable = /{{\s*([\w.]+)\s*}}/g;
const regexVariableFilter = /{{\s*(\w+)\s*(?:\|(\s*(\w+)\((.*?)\))?\s*)}}/g;
const regexIteration = /{{#each\s+([\w.]+)\s*}}(.*){{\/each}}/gs;
const regexCondition = /{{#if\s+([\w.]+)\s*}}(.*){{\/if}}/gs;
const regexLink = /{{#\s*link\s*}}([\s\S]*?){{\/\s*link\s*}}/g;
const regexBlock = /\{\{#block file="(.*?\.mikeml)" data=(.*?)\/\}\}/g;
const regexInclude = /\{\{#include file="([^"]+)" \/}}/;
const regexImport = /\{\{#import file="([^"]+)" \/}}/;
const regexComment = /<!--(.|\s)*?-->/g;
const regexFunctionCall = /(\w+)\((.*?)\)/;

const clearComment = (html) => {
  return html.replace(regexComment, '');
};
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
const formatNumber = (value, currency, lang) => {
  if (currency) {
    const formatter = new Intl.NumberFormat(lang, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2
    });
    return formatter.format(value);
  }
  const formatter = new Intl.NumberFormat(lang, {
    minimumFractionDigits: 2
  });
  return formatter.format(value);
};

function renderHtml(template, data) {
  return template.trim()
    .replace(regexImport, (match, templateFileName) => {
      try {
        console.log(templateFileName)
        const content = readFile(templateFileName);
        return renderHtml(content, data);
      } catch (e) {
        console.warn(e)
        return ''
      }
    })
    .replaceAll(regexBlock, (match, templateFileName, arg) => {
      const args = data[arg.trim()];

      if (!templateFileName.includes(".mikeml")) {
        throw new Error("unsupported file format, use *.mikeml");
      }
      try {
        const blockTemplate = readFile(templateFileName);
        if (!blockTemplate) {
          return '';
        }
        if (debug) {
          console.log(SPLITTER, templateFileName, blockTemplate, args, arg, match, data, SPLITTER)
        }
        return renderHtml(blockTemplate, args)
      } catch (e) {
        console.warn(e)
        return ''
      }
    })
    .replaceAll(regexIteration, (match, key, innerTemplate) => {
      let result = '';
      const array = data[key];
      if (Array.isArray(array)) {
        array.forEach((item) => {
          innerTemplate = innerTemplate.replace(regexInclude, (match, key) => {
            try {
              const content = readFile(key);
              return renderHtml(content, item)
            } catch (e) {
              console.log(e);
            }
          })
          result += renderHtml(innerTemplate, item);
        });
      }
      return result;
    })
    .replace(regexLink, () => {
      if (!data.link) {
        return ''
      }
      const { link } = data;
      let target = '';
      if (link?.target) {
        target = ` target="${ link.target }"`;
      }
      return `<a href="${ link.href }"${ target }>${ link.text }</a>`;
    })
    .replace(regexVariableFilter, (match, key, filter) => {
      const keys = key.split('.');
      let value = data;
      // console.log(match, key, {filter})

      keys.forEach((k) => {
        value = value[k];
      });
      if (!value) {
        return '';
      }
      if (filter) {
        const match1 = filter.match(regexFunctionCall);
        switch (match1[1]) {
          case 'format':
            const currency = match1[2];
            // console.log(value)
            value = formatNumber(value, currency.substring(1, currency.length - 1), 'en-UK');
            break;
          case 'capitalize':
            value = capitalizeFirstLetter(value);
            break;
          case 'upper':
            value = value.toUpperCase();
            break;
        }
        // console.log(match1)
      }
      // console.log({value})
      return value ? value : '';
    }).replace(regexVariable, (match, key) => {
      const keys = key.split('.');
      let value = data;
      keys.forEach((k) => {
        value = value[k];
      });
      return value ? value : '';
    })
    .replace(regexCondition, (match, key, innerTemplate) => {
      const value = data[key];
      if (value) {
        return renderHtml(innerTemplate, data);
      } else {
        return '';
      }
    });
}

let template1 = `
  {{#block file="header.mikeml" data=header /}}

  <h1>{{title}}</h1>
  {{#block file="content.mikeml" data=someData /}}
  <ul>
    {{#each items}}
      <li>
        {{#include file="item.mikeml" /}}
        {{#each images}}
          <img src="{{ path }}" alt="{{alt}}">
        {{/each}}
        {{#if discount}}
          <p>You have a {{ discount }}% discount!</p>
        {{/if}}
        {{#link }}
          {{ link }}
        {{/link }}
        {{#link }}
          {{ link }}
        {{/link }}
      </li>
    {{/each}}
  </ul>
  {{#if discount}}
    <p>You have a {{discount}}% discount!</p>
  {{/if}}
  {{#block file="footer.mikeml" data=footer /}}
<!--  {{#block file="footer.html" data=footer /}}-->
`;

const data = {
  title: 'My Shopping Cart',
  header: {
    title: 'cute cats',
  },
  footer: {
    logo: 'Cute cats'
  },
  someData: {
    data: {
      title: 'hello world',
    },
    description: 'hello description',
    cats: [
      { name: 'cat 1' },
      { name: 'cat 2' },
      { name: 'cat 3' },
    ],
  },
  items: [
    { name: 'Item 1', price: 10, discount: 10, images: [
      { path: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=1600', alt: 'image 1' },
      { path: 'https://images.pexels.com/photos/1741205/pexels-photo-1741205.jpeg?auto=compress&cs=tinysrgb&w=1600' },
      { path: 'https://images.pexels.com/photos/320014/pexels-photo-320014.jpeg?auto=compress&cs=tinysrgb&w=1600' },
    ] },
    {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },   {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },
    {
      name: 'Item 3', price: 30, link: {
        href: "https://example.com/oranges",
        text: "Learn more",
      },
    },
  ],
  discount: 15,
};

const templ = argv.filter(it => it.includes('-template='));
if (templ) {
  const fileName = templ[0].split('=')
  template1 = readFile(fileName[1]);
}

function render(template, data) {
  return renderHtml(clearComment(template), data).replace(/(^[ \t]*\n)/gm, "");
}

let count = 0;
const last = argv[argv.length - 1];
if (!isNaN(last)) {
  count = Number(last);
}

for (let i = 0; i < count; i++) {
  data.items = data.items.concat(data.items)
}
console.log(data.items.length)
console.time();
const renderedTemplate = render(template1, data);
writeFile('result.html', renderedTemplate);
if (debug) {
  // console.log(renderedTemplate);
}
console.timeEnd();
