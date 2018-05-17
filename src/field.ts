import {snake} from './utils';
import {Validator, wrapError} from './validator';

/**
 * A field bundles a validator with a way to perform plucking.
 *
 * "Plucking" is a process that starts out with a raw data object and a key.
 * These are used to extract a raw value from the data object, which are then
 * fed into the bundled validator.
 *
 * The field has the opportunity to transform the key's format in any way it
 * wishes, or even ignore the given key.
 */
export interface Field<T> {
  /**
   * The validator to use in the last step of plucking.
   */
  validator: Validator<T>;

  /**
   * The implementation for the plucking process.
   * @param key the desired property name
   * @param data an object, usually a raw response from an external source
   */
  pluck(key: string, data: Field.AnyObject): T;
}

export namespace Field {
  /**
   * Describes any object with string keys and arbitrary values.
   */
  export interface AnyObject {
    [key: string]: any;
  }
}

/**
 * A `MapField` uses a transformation function to first reformat a key at the
 * beginning of the plucking process, and then uses the transformed key to get
 * a property value from the data source, before feeding it to the `validator`.
 */
export class MapField<T> implements Field<T> {
  /**
   * @param validator the validator to use at the end of plucking
   * @param toSourceKey a transformation function that reformats a key
   */
  constructor(
    public validator: Validator<T>,
    public toSourceKey: (key: string) => string,
  ) {}

  pluck(key: string, data: Field.AnyObject): T {
    const {toSourceKey, validator} = this;
    const sourceKey = toSourceKey(key);
    const value = data[sourceKey];
    return wrapError(
      validator,
      `an object with attribute '${sourceKey}', that is`,
    )(value);
  }
}

/**
 * Constructs a `MapField` that does not transform the key at all when
 * plucking.
 * @example
 * const Person = model('Person', {
 *   // plucks the raw value from `data.name`
 *   name: field(string),
 * });
 */
export function field<T>(validator: Validator<T>): Field<T> {
  return new MapField(validator, key => key);
}

/**
 * Constructs a `MapField` that ignores the given key when plucking, and uses
 * the provided `key` instead.
 * @param key the key to use instead
 * @example
 * const DateRange = model('DateRange', {
 *   // plucks the raw value from `data.start_date`
 *   start: fieldWithKey('start_date', date),
 *   // plucks the raw value from `data.end_date`
 *   end: fieldWithKey('end_date', date),
 * });
 */
export function fieldWithKey<T>(
  key: string,
  validator: Validator<T>,
): Field<T> {
  return new MapField(validator, () => key);
}

/**
 * Constructs a `MapField` that transforms the key from camel case to
 * snake case when plucking.
 * @example
 * const Nameable = model('Nameable', {
 *   // plucks the raw value from `data.full_name`
 *   fullName: fieldFromSnake(string),
 * });
 */
export function fieldFromSnake<T>(validator: Validator<T>): Field<T> {
  return new MapField(validator, snake);
}

/**
 * A `MultiField` completely ignores the given key when plucking and instead
 * feeds the entire data object into the validator. This is useful when the
 * data source "splits" a logical, single object into multiple flat properties
 * without any nesting. In other words, when multiple properties need to be
 * "merged" into a single value or object, a `MultiField` can achieve this.
 */
export class MultiField<T> implements Field<T> {
  constructor(public validator: Validator<T>) {}

  pluck(_: string, data: any): T {
    return this.validator(data);
  }
}

/**
 * Constructs a `MultiField` that ignores the given key and feeds the entire
 * data object into the validator.
 *
 * This is useful when the data source "splits" a logical, single object into
 * multiple flat properties without any nesting. In other words, when multiple
 * properties need to be "merged" into a single value or object, a `MultiField`
 * can achieve this.
 * @example
 * const Offer = model('Offer', {
 *   name: field(string),
 *   budget: multiField(
 *     model('Budget', {
 *       min: fieldWithKey('budget_min', number),
 *       max: fieldWithKey('budget_max', number),
 *     }),
 *   ),
 * });
 * // input: {name: 'test', budget_min: 50, budget_max: 150}
 * // output: {name: 'test', budget: {min: 50, max: 150}}
 */
export function multiField<T>(validator: Validator<T>): Field<T> {
  return new MultiField(validator);
}
