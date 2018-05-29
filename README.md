# cuisinier

> a JSON transformer that does type checking too

The JSON data received from an API often differs from the actual data object
you'd like to work with in a JavaScript application. To solve this, a client
usually has to perform several "cooking steps" to transform the source data into
something more digestible. Cuisinier is a JSON transformer that makes it easy to
define these cooking steps, such as renaming keys, presence validation, runtime
type-checking, converting from a simple type to a complex type, or even merging
multiple fields into one.

## Table of Contents

* [Background](#background)
* [Install](#install)
* [Usage](#usage)
  * [Transforming Keys](#transforming-keys)
  * [Converting Types](#converting-types)
  * [Extending Types](#extending-types)
  * [Merging Fields](#merging-fields)
  * [TypeScript Support](#typescript-support)
* [License](#license)

## Background

In JavaScript, data is built up from three separate levels:

* A _value_.
* A _property_, which associates a key name (usually a string) with a value.
* An _object_, which groups zero or more properties together.

Cuisinier similarly defines a transformation using three levels, with a small
difference in each level's line of responsability:

* A _validator_, which is a function that takes any value and either rejects the
  value by throwing an error, or accepts the value by returning it as-is or
  converting it into a different type.
* A _field_, which is an object that wraps around a validator and a
  `toSourceKey` function, which in turn defines how to convert from the desired
  property key to the source property key. See the
  [Merging Fields](#merging-fields) section for a better understanding of how a
  field works.
* A _model_, which is an object with a _model name_ and a _definition_ that
  groups multiple fields together, associating each field to a desired property
  key name. A model itself is also a validator! This mirrors how a JavaScript
  object can contain another object.

## Install

This project is installable using [npm](https://npmjs.com/):

```
$ npm install cuisinier
```

Cuisinier uses a few ES2017 features: `Object.setPrototypeOf`,
`Object.defineProperties`, and `Object.getOwnPropertyDescriptors`. Please make
sure that these are either supported by your runtime, or that they are
polyfilled.

## Usage

Suppose that we are retrieving a few simple user objects from a server, and that
they each fit the following type definition:

```ts
interface User {
  name: string;
  age?: number;
}
```

Manually writing the validation code for this is extremely tedious, even with
just one required and one optional property!

```js
export function User(data) {
  const c1 = 'name' in data && typeof data.name === 'string';
  const c2 = 'age' in data ? typeof data.age === 'number' : true;

  if (c1 && c2) {
    return data;
  }
  throw new TypeError(`${JSON.stringify(data)} is not a User`);
}
```

With Cuisinier, the code becomes:

```js
import {model, field as f} from 'cuisinier';
import {optional} from 'cuisinier/validator';
import {string, number} from 'cuisinier/validators';

export const User = model('User', {
  name: f(string),
  age: f(optional(number)),
});
```

We customarily rename `field` to `f` in order to shorten the model definition.

### Transforming Keys

Let's say the server responds in the following format:

```ts
interface Nomenclature {
  identifier: string;
  full_name: string;
  short_name?: string;
}
```

But we want it to be:

```ts
interface Nomenclature {
  username: string;
  fullName: string;
  shortName?: string;
}
```

In other words, we want to:

* Rename `identifier` to `username`
* Transform `full_name` to `fullName`
* Transform `short_name` to `shortName`

We would write this code in Cuisinier:

```js
import {model, fieldFromSnake as f, fieldWithKey} from 'cuisinier';
import {optional} from 'cuisinier/validator';
import {string, number} from 'cuisinier/validators';

export const Nomenclature = model('Nomenclature', {
  username: fieldWithKey('identifier', string),
  fullName: f(string),
  shortName: f(optional(string)),
});
```

Note that in the imports, we've instead renamed `fieldFromSnake` to `f`, rather
than a plain `field`.

### Converting Types

Certain complex data types are not native to JSON. For example, a server may
serialize a Unix timestamp into a number, which would be much more useful as a
`Date` object in JavaScript. Suppose we have this data format:

```ts
interface ReminderItem {
  id: string;
  label: string;
  created_at: number;
  updated_at: number;
}
```

First, we need to write a custom timestamp validator:

```js
import {number} from 'cuisinier/validators';

export function timestamp(value) {
  // Throw if `value` is not a number.
  const epoch = number(value);
  return new Date(epoch);
}
```

Then, we can write our model:

```js
import {model, fieldFromSnake as f} from 'cuisinier';
import {string} from 'cuisinier/validators';

export const ReminderItem = model('ReminderItem', {
  id: f(string),
  label: f(string)
  createdAt: f(timestamp),
  updatedAt: f(timestamp),
});
```

### Extending Types

Sometimes you want to create a model that has all the fields of another existing
model:

```ts
interface Acquaintance {
  full_name: string;
}

interface Contact extends Acquiaintance {
  phone_number: string;
}
```

The first half is easy in Cuisinier:

```js
import {model, fieldFromSnake as f} from 'cuisinier';
import {string} from 'cuisinier/validators';

export const Acquaintance = model('Acquaintance', {
  fullName: f(string),
});
```

The second half is just as easy:

```js
export const Contact = Acquaintance.extend('Contact', {
  phoneNumber: f(string),
});
```

The `extend` method returns a new model based on the existing one. Its second
argument, the _extension_, could also be simply another full-fledged model,
rather than just a bare-bones definition.

### Merging Fields

Sometimes a response may contain multiple properties that all logically belong
to the same concept:

```ts
interface Offer {
  name: string;
  budget_min: number;
  budget_max: number;
}
```

Ideally we want the outcome to be a nested object structure, like so:

```ts
interface Offer {
  name: string;
  budget: {
    min: number;
    max: number;
  };
}
```

A multi-field in Cuisinier can achieve this:

```js
import {model, field, fieldWithKey, multiField} from 'cuisinier';
import {string, number} from 'cuisinier/validators';

export const Offer = model('Offer', {
  name: field(string),
  budget: multiField(
    model('Budget', {
      min: fieldWithKey('budget_min', number),
      max: fieldWithKey('budget_max', number),
    }),
  ),
});
```

A field usually takes the desired property key name, transforms it into a source
property key name using `toSourceKey`, uses that key to get a property from the
source data, and then feeds that value into the wrapped validator. This process
is known as _plucking_.

A multi-field, on the other hand, completely disregards the desired property key
name and feeds the entirety of the source data into the wrapped validator as
part of its plucking process.

### TypeScript Support

Cuisinier has first-class TypeScript support, and is itself written in
TypeScript. One additional feature in TypeScript is that you can derive a static
type from a model:

```ts
import {model, field as f} from 'cuisinier';
import {optional} from 'cuisinier/validator';
import {string, number} from 'cuisinier/validators';

export const User = model('User', {
  name: f(string),
  age: f(optional(number)),
});

export interface User extends model.ResultOf<typeof User> {}
```

This essentially gives you a type similar to the following, without having to
write the entire static type again:

```ts
export interface User {
  name: string;
  age?: number;
}
```

## License

MIT © UrbanDoor
