# functrace


[![Codacy Badge](https://api.codacy.com/project/badge/Grade/2bdd57c66a014adf89148f7f83bb3b51)](https://www.codacy.com/app/EvgenyOrekhov/functrace?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=EvgenyOrekhov/functrace&amp;utm_campaign=badger)

## Function call tracer

## Install

```sh
npm install functrace --save-dev
```

## Usage example

```js
const functrace = require("functrace");
const trace = functrace.makeTracer();

function add(a, b) {
    return a + b;
}

const tracedAdd = trace(add);

tracedAdd(1, 2);

/* logs to console:

{ name: 'add',
  args: [ 1, 2 ],
  callCount: 1,
  returnValue: 3,
  duration: '42 μs' }

*/

/* It can also trace functions that return promises */

function addAsync(a, b) {
    return new Promise(
        (resolve) => setTimeout(() => resolve(a + b), 1000)
    );
}

const tracedAddAsync = trace(addAsync);

tracedAddAsync(1, 2);

/* logs to console one second later:

{ name: 'addAsync',
  args: [ 1, 2 ],
  callCount: 1,
  fulfillmentValue: 3,
  duration: '1 s' }

*/
```

## Test

```sh
npm test
```

## [Changelog](https://github.com/EvgenyOrekhov/functrace/releases)

## License

[MIT](LICENSE)
