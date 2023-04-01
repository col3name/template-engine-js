## Example

### Template
```js
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
```

### Data
```js


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
      ]
    },
    {
      name: 'Item 2', price: 20, link: {
        href: "https://example.com/bananas",
        text: "Learn more",
        target: "_blank",
      },
    },
  ],
  discount: 15,
};
```
## Performance

---------------------------------------
| count items | time     | with filter|
--------------|----------|------------|
| 960 items   | 8 ms     | 17 ms      |
| 1920 items  | 10 ms    | 23 ms      |
| 3840 items  | 19 ms    | 35 ms      |
| 30720 items | 112.8 ms | 185 ms     |
| 61440 items | 250 ms   | 315 ms     |
---------------------------------------