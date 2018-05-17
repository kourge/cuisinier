import {Validator} from './validator';
import {boolean, date, number, string, time} from './validators';

describe('validators', () => {
  let validator: Validator<any>;
  const setValidator = (p: Validator<any>) => () => (validator = p);
  beforeEach(
    setValidator(() => {
      throw new Error('No validator set');
    }),
  );

  let value: any;
  const setValue = (v: any) => () => (value = v);
  beforeEach(setValue('unset value'));

  describe('string', () => {
    beforeEach(setValidator(string));

    describe('when passed a string', () => {
      beforeEach(setValue('world'));
      it('returns the passed value', testValidatorExact('world'));
    });

    describe('when passed an empty string', () => {
      beforeEach(setValue(''));
      it('returns an empty string', testValidatorExact(''));
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('throws an error', testValidatorError('Expected a string.'));
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('throws an error', testValidatorError('Expected a string.'));
    });

    describe('when passed a number', () => {
      beforeEach(setValue(1));
      it('throws an error', testValidatorError('Expected a string.'));
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it('throws an error', testValidatorError('Expected a string.'));
    });
  });

  describe('number', () => {
    beforeEach(setValidator(number));

    describe('when passed a number', () => {
      beforeEach(setValue(123213));
      it('returns the passed value', testValidatorExact(123213));
    });

    describe('when passed zero', () => {
      beforeEach(setValue(0));
      it('returns zero', testValidatorExact(0));
    });

    describe('when passed a negative number', () => {
      beforeEach(setValue(-123213));
      it('returns the passed value', testValidatorExact(-123213));
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('throws an error', testValidatorError('Expected a number.'));
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('throws an error', testValidatorError('Expected a number.'));
    });

    describe('when passed a string', () => {
      beforeEach(setValue('132'));
      it('throws an error', testValidatorError('Expected a number.'));
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it('throws an error', testValidatorError('Expected a number.'));
    });
  });

  describe('boolean', () => {
    beforeEach(setValidator(boolean));

    describe('when passed true', () => {
      beforeEach(setValue(true));
      it('returns true', testValidatorExact(true));
    });

    describe('when passed false', () => {
      beforeEach(setValue(false));
      it('returns true', testValidatorExact(false));
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed a number', () => {
      beforeEach(setValue(132));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed zero', () => {
      beforeEach(setValue(0));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed a string', () => {
      beforeEach(setValue('132'));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed an empty string', () => {
      beforeEach(setValue(''));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it('throws an error', testValidatorError('Expected a boolean.'));
    });
  });

  describe('date', () => {
    beforeEach(setValidator(date));

    describe('when passed a date string', () => {
      beforeEach(setValue('2017-01-25'));

      it(
        'returns the passed string as a Date object',
        testValidator(new Date(2017, 0, 25, 12)),
      );

      describe('with time data', () => {
        beforeEach(setValue('2017-01-25T20:30:00Z'));
        it(
          'throws an error',
          testValidatorError('Expected a date formatted string.'),
        );
      });

      describe('with an invalid year', () => {
        beforeEach(setValue('10000-04-31'));
        it(
          'throws an error',
          testValidatorError('Expected a date formatted string.'),
        );
      });

      describe('with an invalid month', () => {
        beforeEach(setValue('2017-13-01'));
        it(
          'throws an error',
          testValidatorError('Expected a date formatted string.'),
        );
      });

      describe('with an invalid day', () => {
        beforeEach(setValue('2017-04-31'));
        it(
          'throws an error',
          testValidatorError('Expected a date formatted string.'),
        );
      });

      describe('with extra data', () => {
        beforeEach(setValue('2017-04-31 '));
        it(
          'throws an error',
          testValidatorError('Expected a date formatted string.'),
        );
      });
    });

    describe('when passed a string', () => {
      beforeEach(setValue('world'));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });

    describe('when passed an empty string', () => {
      beforeEach(setValue(''));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });

    describe('when passed a number', () => {
      beforeEach(setValue(1));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it(
        'throws an error',
        testValidatorError('Expected a date formatted string.'),
      );
    });
  });

  describe('time', () => {
    beforeEach(setValidator(time));

    describe('when passed a time string', () => {
      beforeEach(setValue('2017-01-25T20:32:21Z'));

      it(
        'returns the passed string as a Date object',
        testValidator(new Date(Date.UTC(2017, 0, 25, 20, 32, 21))),
      );

      describe('with an invalid hour', () => {
        beforeEach(setValue('2017-01-25T25:32:21Z'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });

      describe('with an invalid minute', () => {
        beforeEach(setValue('2017-01-25T20:61:21Z'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });

      describe('with an invalid second', () => {
        beforeEach(setValue('2017-01-25T20:32:61Z'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });
    });

    describe('when passed a date string', () => {
      beforeEach(setValue('2017-01-25'));

      it(
        'returns the passed string as a Date object',
        testValidator(new Date(2017, 0, 25, 0, 0, 0)),
      );

      describe('with an invalid year', () => {
        beforeEach(setValue('10000-04-31'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });

      describe('with an invalid month', () => {
        beforeEach(setValue('2017-13-01'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });

      describe('with an invalid day', () => {
        beforeEach(setValue('2017-04-31'));
        it(
          'throws an error',
          testValidatorError('Expected a time formatted string.'),
        );
      });
    });

    describe('when passed a string', () => {
      beforeEach(setValue('world'));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });

    describe('when passed an empty string', () => {
      beforeEach(setValue(''));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });

    describe('when passed a number', () => {
      beforeEach(setValue(1));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it(
        'throws an error',
        testValidatorError('Expected a time formatted string.'),
      );
    });
  });

  function testValidator(result: any) {
    return () => {
      expect(validator(value)).toEqual(result);
    };
  }

  function testValidatorExact(result: any) {
    return () => {
      expect(validator(value)).toBe(result);
    };
  }

  function testValidatorError(errorText: any) {
    return () => {
      expect(() => validator(value)).toThrow(errorText);
    };
  }
});
