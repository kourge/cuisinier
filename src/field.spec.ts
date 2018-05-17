import {field, fieldFromSnake, fieldWithKey} from './field';
import {ValidationError} from './validator';

describe('Field', () => {
  describe('field', () => {
    it('returns the value of the passed key and passes it through the validator', () => {
      const result = {};
      const validator = (v: any) => v.value;
      expect(field(validator).pluck('a', {a: {value: result}})).toBe(result);
    });

    it('throws an error', () => {
      const validator = () => {
        throw new ValidationError('a string');
      };
      expect(() => field(validator).pluck('b', {a: 1})).toThrow(
        "Expected an object with attribute 'b', that is a string.",
      );
    });
  });

  describe('fieldWithKey', () => {
    it('returns the value of the passed key and passes it through the validator', () => {
      const result = {};
      const validator = (v: any) => v.value;
      expect(
        fieldWithKey('a', validator).pluck('anything', {a: {value: result}}),
      ).toBe(result);
    });

    it('throws an error', () => {
      const validator = () => {
        throw new ValidationError('a string');
      };
      expect(() =>
        fieldWithKey('c', validator).pluck('something else', {a: 1}),
      ).toThrow("Expected an object with attribute 'c', that is a string.");
    });
  });

  describe('fieldFromSnake', () => {
    it('returns the value of the passed key and passes it through the validator', () => {
      const result = {};
      const validator = (v: any) => v.value;
      expect(
        fieldFromSnake(validator).pluck('aSnakeCaseKey', {
          a_snake_case_key: {value: result},
        }),
      ).toBe(result);
    });

    it('throws an error', () => {
      const validator = () => {
        throw new ValidationError('a string');
      };
      expect(() =>
        fieldFromSnake(validator).pluck('erroneousSnakeCaseKey', {
          erroneous_snake_case_key: 1,
        }),
      ).toThrow(
        "Expected an object with attribute 'erroneous_snake_case_key', that is a string.",
      );
    });
  });
});
