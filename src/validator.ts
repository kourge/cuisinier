import {Enum} from 'typescript-string-enums';

/**
 * A validator performs validation on a piece of data and potentially converts
 * it into another type. When the validation succeeds, the validator should
 * return. When the validation fails, the validator should throw a
 * `ValidationError` or a subclass of it.
 *
 * @example
 * const emptyString: Validator<''> = value => {
 *   if (value !== '') {
 *     throw new ValidationError('an empty string');
 *   }
 *   return '';
 * };
 */
export type Validator<T> = (value: any) => T;

/**
 * A `ValidationError` is thrown by a validator when the validation fails.
 */
export class ValidationError extends Error {
  /**
   * @param assertionMessage an expectation, e.g. `"a number"`
   */
  constructor(public assertionMessage: string) {
    super(`Expected ${assertionMessage}.`);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export namespace ValidationError {
  /**
   * A `ValidationError.Named` is thrown by a validator with a well-known name,
   * such as a model.
   */
  export class Named extends ValidationError {
    /**
     * @param name the name of the validator
     * @param assertionMessage an expectation, e.g. `"a number"`
     */
    constructor(public name: string, assertionMessage: string) {
      super(assertionMessage);
      this.message = `${name} expected ${assertionMessage}.`;
      Object.setPrototypeOf(this, Named.prototype);
    }
  }
}

/**
 * Wraps a validator and produces one whose error message is prepended with the
 * given `error` message.
 * @param validator a validator to wrap
 * @param error a message to prepend to the wrapped validator's own message
 */
export function wrapError<T>(
  validator: Validator<T>,
  error: string,
): Validator<T> {
  return (value: any) => {
    try {
      return validator(value);
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`${error} ${e.assertionMessage}`);
      }
      throw e;
    }
  };
}

/**
 * Wraps around a validator factory, which is used to lazily create the real
 * validator right before validation. This laziness can be used to avoid the
 * eager evaluation that causes circular imports to break.
 * @param deferred a validator factory, which is any nullary function that can
 *        produce a validator
 */
export function lazy<T>(deferred: () => Validator<T>): Validator<T> {
  return (value: T) => deferred()(value);
}

/**
 * Wraps around a validator and produces one that additionally accepts
 * `undefined`.
 * @param validator the validator to make optional
 */
export function optional<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value: any) =>
    value === undefined ? value : wrapError(validator, 'undefined or')(value);
}

/**
 * Wraps around a validator and produces one that additionally accepts `null`.
 * @param validator the validator to make nullable
 */
export function nullable<T>(validator: Validator<T>): Validator<T | null> {
  return (value: any) =>
    value === null ? value : wrapError(validator, 'null or')(value);
}

/**
 * Wraps around a validator and produces one that additionally accepts both
 * `undefined` and `null`. Both `undefined` and `null` are coerced to
 * `undefined` after validation succeeds.
 *
 * This exists to account for the behavior originating from the Ruby on Rails
 * class `ActiveRecord::Serializer`, which fails to omit a non-existing value,
 * instead emitting `nil`, which is interpreted by the Rails JSON serializer as
 * `null`.
 * @param validate the validator to make blankable
 */
export function blankable<T>(validate: Validator<T>): Validator<T | undefined> {
  return (value: any) =>
    value === null || value === undefined
      ? undefined
      : wrapError(validate, 'null, undefined, or')(value);
}

/**
 * Wraps around a validator and produces one that verifies that a value is not
 * only an array, but that each element in the array passes the wrapped
 * validator's validation.
 * @param validator the validator for each element in the array
 */
export function arrayOf<T>(validator: Validator<T>): Validator<T[]> {
  return (values: any) => {
    if (Array.isArray(values)) {
      return values.map((value: any, index: number) =>
        wrapError(validator, `an array with value at [${index}], that is`)(
          value,
        ),
      );
    }
    throw new ValidationError('an array');
  };
}

/**
 * Produces a validator that verifies that a value belongs to one of the enum
 * values in the given an enum object.
 * @param _enum an enum object containing all values of said enum
 */
export function enumOf<T extends {[_: string]: any}>(
  _enum: T,
): Validator<Enum<T>> {
  return (value: any): Enum<T> => {
    if (typeof value === 'string') {
      if (Enum.isType(_enum, value)) {
        return value;
      }
      throw new ValidationError('a value in the enum');
    }
    throw new ValidationError('a string');
  };
}

function validationMessageOf(e: Error): string {
  if (e instanceof ValidationError.Named) {
    return `${e.name}, that is ${e.assertionMessage}`;
  } else if (e instanceof ValidationError) {
    return e.assertionMessage;
  } else {
    throw e;
  }
}

/**
 * Wraps two different validators and produces one that, given a value, will
 * succeed in validation as long as said value would pass validation under one
 * of those validators.
 *
 * The first validator is tried first.
 * @param a the first validator
 * @param b the second validator
 */
export function union<A, B>(
  a: Validator<A>,
  b: Validator<B>,
): Validator<A | B> {
  return (data: any): A | B => {
    let messageA: string;
    let messageB: string;
    try {
      return a(data);
    } catch (e) {
      messageA = validationMessageOf(e);
    }
    try {
      return b(data);
    } catch (e) {
      messageB = validationMessageOf(e);
    }
    throw new ValidationError(`${messageA}; or ${messageB}`);
  };
}

/**
 * Wraps two different validators and produces one that, given a value, will
 * perform validation using both validators, in the order they are passed.
 *
 * Note that the results of both validators are copied into an empty object,
 * in the same order. This limitation means if one of the validators produces
 * a non-plain object (`Object.getPrototypeOf(o) !== Object.prototype`), then
 * the resulting validator will produce objects with the wrong prototype.
 *
 * To work around this limitation, it is recommended to manually write a
 * single validator that performs all the necessary validations, and annotate
 * its return type accordingly with an intersection type.
 * @param a the first validator
 * @param b the second validator
 */
export function intersect<A extends object, B extends object>(
  a: Validator<A>,
  b: Validator<B>,
): Validator<A & B> {
  return (data: any): A & B => Object.assign({}, a(data), b(data));
}
