import moment from 'moment';

import {ValidationError} from './validator';

/**
 * Validates that a value is a primitive string.
 */
export function string(value: any): string {
  if (typeof value !== 'string') {
    throw new ValidationError('a string');
  }
  return value;
}

/**
 * Validates that a given value is a primitive number.
 */
export function number(value: any): number {
  if (typeof value !== 'number') {
    throw new ValidationError('a number');
  }
  return value;
}

/**
 * Validates that a value is a primitive boolean.
 */
export function boolean(value: any): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError('a boolean');
  }
  return value;
}

/**
 * Validates that a value is a string conforming to the date format
 * "YYYY-MM-DD". If it is, the string is converted to a `Date` object, with its
 * hour zeroed out to midnight.
 */
export function date(value: any): Date {
  if (typeof value === 'string') {
    const date = moment(value, 'YYYY-MM-DD', true);
    if (date.isValid()) {
      date.set('hour', 12);
      return date.toDate();
    }
  }
  throw new ValidationError('a date formatted string');
}

/**
 * Validates that a value is a string conforming to the ISO 8601 time format.
 * If it is, the string is converted to a `Date` object.
 */
export function time(value: any): Date {
  if (typeof value === 'string') {
    const date = moment(value, moment.ISO_8601, true);
    if (date.isValid()) {
      return date.toDate();
    }
  }
  throw new ValidationError('a time formatted string');
}
