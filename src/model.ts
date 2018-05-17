import {Invokable} from 'invokable';

import {Field} from './field';
import {ValidationError} from './validator';

/**
 * A `Model` combines multiple `Field` objects. The bulk of a model consists of
 * a field definition, which is an object whose values are fields and keys are
 * the desired key of the validation result. This definition is used to
 * validate and transform a raw data object into a processed object.
 *
 * A model is also a `Validator<T>`, and can be called directly like a function.
 */
export class Model<Data extends object> {
  readonly name: string | null;
  readonly definition: Model.Definition<Data>;

  constructor({name, definition}: Model.ConstructionOptions<Data>) {
    this.name = name;
    this.definition = definition;
    return Invokable.create(this);
  }

  /**
   * Creates a new model based on this model using the given extension model or
   * definition.
   *
   * If the extension contains a field whose name already exists in this
   * model's definition, the extension's version takes precedence.
   * @param name the name of the new model, or `null` if it does not have one
   * @param extension additional field definitions in the new model
   */
  extend<Extension extends object>(
    name: string | null,
    extension: Model<Extension> | Model.Definition<Extension>,
  ): Model<Data & Extension> {
    const definition =
      extension instanceof Model ? extension.definition : extension;
    /**
     * TO-DO: It may be possible to remove the casts and convert to object spread
     * in a later TypeScript version.
     * See: https://github.com/Microsoft/TypeScript/issues/10727
     */
    return new Model({
      name,
      definition: Object.assign(
        {},
        this.definition,
        definition,
      ) as Model.Definition<Data & Extension>,
    });
  }

  /**
   * Validates and transforms the given raw `data` according to the field
   * definition of this model.
   */
  validate(data: any): Model.ResultObject<Data> {
    try {
      if (typeof data !== 'object') {
        throw new ValidationError('an object');
      }

      const result: Partial<Data> = {};

      for (const key of Object.keys(this.definition) as Array<keyof Data>) {
        const field = this.definition[key];
        const value = field.pluck(key, data);
        if (value !== undefined) {
          result[key] = value;
        }
      }

      return result as Model.ResultObject<Data>;
    } catch (e) {
      if (e instanceof ValidationError && this.name !== null) {
        throw new ValidationError.Named(this.name, e.assertionMessage);
      } else {
        throw e;
      }
    }
  }

  [Invokable.call](data: any): Model.ResultObject<Data> {
    return this.validate(data);
  }
}

export interface Model<Data extends object> {
  /**
   * Alias to the `validate` method.
   *
   * This makes a `Model<T>` itself also a `Validator<T>`.
   */
  // tslint:disable-next-line:callable-types
  (data: any): Model.ResultObject<Data>;
}

export namespace Model {
  /**
   * Yields the type of the result of a model's validation.
   */
  export type ResultOf<T extends Model<any>> = T extends Model<infer Data>
    ? ResultObject<Data>
    : never;

  /**
   * Given an object type `T`, yields a string literal union of all its keys
   * whose values can be `undefined`.
   */
  export type OptionalKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never
  }[keyof T];

  /**
   * Given an object type `T`, yields a string literal union of all its keys
   * whose values cannot be `undefined`.
   */
  export type RequiredKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K
  }[keyof T];

  /**
   * Transforms an object type so that a property that can be `undefined` is
   * also made optional.
   *
   * In a TypeScript object type, a property `p?: T` is "optional", which
   * implies that the property's type can also be `undefined`. In other words,
   * such a property expands to `p?: T | undefined`. However, this is not the
   * same as `p: T | undefined`. Note the lack of the `?` modifier. Here, the
   * property `p` must exist inside an object, even if its value is explicitly
   * `undefined`, whereas if the property were optional, it would be valid to
   * completely omit `p` from the object. This distinction can be detected at
   * runtime using the `in` operator.
   */
  export type ResultObject<Data extends object> = {
    [K in RequiredKeys<Data>]: Data[K]
  } &
    {[K in OptionalKeys<Data>]?: Data[K]};

  export interface ConstructionOptions<Data extends object> {
    /** The name of the model, or `null` if it does not have one. */
    readonly name: string | null;

    /**
     * The field definition of the model. Each value is a field, and its
     * corresponding key is the desired key in the output of the model.
     */
    readonly definition: Definition<Data>;
  }

  /**
   * An object where each key is the desired resulting key of a field, and the
   * value is the field itself.
   */
  export type Definition<T extends object> = {
    readonly [K in keyof T]: Field<T[K]>
  };
}

export namespace model {
  export type ResultOf<T extends Model<any>> = Model.ResultOf<T>;
}

/**
 * Constructs a model with the given `name` and `definition`.
 * @param name the name of the model
 * @param definition a definition object where each value is a field and its key
 *        is the desired key in the result
 * @example
 * const Person = model('Person', {
 *   name: field(string),
 *   age: field(optional(number)),
 * });
 * type Person = model.ResultOf<typeof Person>;
 */
export function model<Data extends object>(
  name: string | null,
  definition: Model.Definition<Data>,
): Model<Data> {
  return new Model({
    name,
    definition,
  });
}
