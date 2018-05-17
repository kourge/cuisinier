import {field} from './field';
import {model} from './model';
import {
  arrayOf,
  blankable,
  enumOf,
  intersect,
  lazy,
  nullable,
  optional,
  union,
  ValidationError,
  Validator,
  wrapError,
} from './validator';
import {number, string} from './validators';

describe('ValidationError', () => {
  it('responds correctly to instanceof', () => {
    expect(new ValidationError('message')).toBeInstanceOf(ValidationError);
  });

  it('builds out a message', () => {
    expect(new ValidationError('a message').message).toBe(
      'Expected a message.',
    );
  });

  describe('#assertionMessage', () => {
    it('equals the passed message', () => {
      expect(new ValidationError('a message').assertionMessage).toBe(
        'a message',
      );
    });
  });

  describe('Named', () => {
    it('responds correctly to instanceof', () => {
      expect(new ValidationError.Named('MyObject', 'message')).toBeInstanceOf(
        ValidationError,
      );
      expect(new ValidationError.Named('MyObject', 'message')).toBeInstanceOf(
        ValidationError.Named,
      );
    });

    it('builds out a message', () => {
      expect(new ValidationError.Named('MyObject', 'a message').message).toBe(
        'MyObject expected a message.',
      );
    });

    describe('#name', () => {
      it('equals the passed name', () => {
        expect(new ValidationError.Named('MyObject', 'a message').name).toBe(
          'MyObject',
        );
      });
    });

    describe('#assertionMessage', () => {
      it('equals the passed message', () => {
        expect(
          new ValidationError.Named('MyObject', 'a message').assertionMessage,
        ).toBe('a message');
      });
    });
  });
});

describe('validator factories', () => {
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

  let validator: Validator<any>;
  const setValidator = (v: Validator<any>) => () => (validator = v);
  beforeEach(
    setValidator(() => {
      throw new Error('No validator set');
    }),
  );

  let value: any;
  const setValue = (v: any) => () => (value = v);
  beforeEach(setValue('unset value'));

  describe('wrapError', () => {
    it('concats error from inner parse message to passed message', () => {
      expect(
        wrapError(() => {
          throw new ValidationError('we deserve');
        }, 'a message'),
      ).toThrow('Expected a message we deserve.');
    });

    it('rethrows a parse error', () => {
      expect(
        wrapError(() => {
          throw new ValidationError('we deserve');
        }, 'a message'),
      ).toThrow(ValidationError);
    });

    it('rethrows non parse errors', () => {
      expect(
        wrapError(() => {
          throw new Error('an error');
        }, 'a message'),
      ).toThrow('an error');
    });
  });

  describe('lazy', () => {
    const result = {};
    beforeEach(setValidator(lazy(() => () => result)));

    it('does not immediately resolve the validator', () => {
      expect(() => {
        lazy(() => {
          throw new Error('Should not be called.');
        });
      }).not.toThrow();
    });

    it(
      'returns the result from the inner validator',
      testValidatorExact(result),
    );
  });

  describe('blankable', () => {
    const result = {};
    beforeEach(setValidator(blankable(() => result)));

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('returns undefined', testValidatorExact(undefined));
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('returns undefined', testValidatorExact(undefined));
    });

    describe('when passed a value', () => {
      beforeEach(setValue('hello'));
      it('returns parsed value', testValidatorExact(result));
    });

    describe('when passed value that causes an error', () => {
      beforeEach(
        setValidator(
          blankable(() => {
            throw new ValidationError('a string');
          }),
        ),
      );
      beforeEach(setValue(1));
      it(
        'throws an error describing failure',
        testValidatorError('Expected null, undefined, or a string.'),
      );
    });
  });

  describe('optional', () => {
    const result = {};
    beforeEach(setValidator(optional(() => result)));

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('returns undefined', testValidatorExact(undefined));
    });

    describe('when passed a value', () => {
      beforeEach(setValue('hello'));
      it('returns parsed value', testValidatorExact(result));
    });

    describe('when passed value that causes an error', () => {
      beforeEach(
        setValidator(
          optional(() => {
            throw new ValidationError('a string');
          }),
        ),
      );
      beforeEach(setValue(1));
      it(
        'throws an error describing failure',
        testValidatorError('Expected undefined or a string.'),
      );
    });
  });

  describe('nullable', () => {
    const result = {};
    beforeEach(setValidator(nullable(() => result)));

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('returns null', testValidatorExact(null));
    });

    describe('when passed a value', () => {
      beforeEach(setValue('hello'));
      it('returns parsed value', testValidatorExact(result));
    });

    describe('when passed value that causes an error', () => {
      beforeEach(
        setValidator(
          nullable(() => {
            throw new ValidationError('a string');
          }),
        ),
      );
      beforeEach(setValue(1));
      it(
        'throws an error describing failure',
        testValidatorError('Expected null or a string.'),
      );
    });
  });

  describe('arrayOf', () => {
    const result = {};
    beforeEach(
      setValidator(
        arrayOf((v: any) => {
          if (v === 'error') {
            throw new ValidationError('a non-error');
          }
          return result;
        }),
      ),
    );

    describe('passed an empty array', () => {
      beforeEach(setValue([]));
      it('returns an empty array', testValidator([]));
    });

    describe('passed an array of valid values', () => {
      beforeEach(setValue([1, 2, 3]));
      it(
        'returns an array of parsed values',
        testValidator([result, result, result]),
      );
    });

    describe('passed an array with invalid values', () => {
      beforeEach(setValue([1, 'error', 3, 'error']));
      it(
        'throws an error on the first invalid value',
        testValidatorError(
          'Expected an array with value at [1], that is a non-error.',
        ),
      );
    });

    describe('when passed undefined', () => {
      beforeEach(setValue(undefined));
      it('throws an error', testValidatorError('Expected an array.'));
    });

    describe('when passed null', () => {
      beforeEach(setValue(null));
      it('throws an error', testValidatorError('Expected an array.'));
    });

    describe('when passed a number', () => {
      beforeEach(setValue(1));
      it('throws an error', testValidatorError('Expected an array.'));
    });

    describe('when passed an object', () => {
      beforeEach(setValue({}));
      it('throws an error', testValidatorError('Expected an array.'));
    });

    describe('when passed a string', () => {
      beforeEach(setValue('world'));
      it('throws an error', testValidatorError('Expected an array.'));
    });
  });

  describe('enumOf', () => {
    enum Value {
      value1 = 'a',
      value2 = 'b',
    }

    beforeEach(setValidator(enumOf(Value)));

    describe('when passed a value in the enum', () => {
      beforeEach(setValue('a'));
      it('returns the value', testValidatorExact(Value.value1));
    });

    describe('when passed a string', () => {
      beforeEach(setValue('c'));
      it(
        'throws an error',
        testValidatorError('Expected a value in the enum.'),
      );
    });

    describe('when passed an empty string', () => {
      beforeEach(setValue(''));
      it(
        'throws an error',
        testValidatorError('Expected a value in the enum.'),
      );
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

  describe('union', () => {
    describe('with basic types', () => {
      beforeEach(setValidator(union(string, number)));

      describe('with first type', () => {
        beforeEach(setValue('asdf'));
        it('returns the value', testValidatorExact('asdf'));
      });

      describe('with second type', () => {
        beforeEach(setValue(1234));
        it('returns the value', testValidatorExact(1234));
      });

      describe('with neither type', () => {
        beforeEach(setValue(true));
        it(
          'throws an error describing failure',
          testValidatorError('Expected a string; or a number.'),
        );
      });
    });

    describe('with object types', () => {
      beforeEach(
        setValidator(
          union(
            model('ModelA', {a: field(string)}),
            model('ModelB', {b: field(number)}),
          ),
        ),
      );

      describe('with first type', () => {
        beforeEach(setValue({a: 'asdf'}));
        it('returns the value', testValidator({a: 'asdf'}));
      });

      describe('with second type', () => {
        beforeEach(setValue({b: 1234}));
        it('returns the value', testValidator({b: 1234}));
      });

      describe('with both types', () => {
        beforeEach(setValue({a: 'asdf', b: 1234}));
        it('returns parsed value of first type', testValidator({a: 'asdf'}));
      });

      describe('with neither type', () => {
        beforeEach(setValue({a: 1234, b: 'asdf'}));
        it(
          'throws an error describing failure',
          testValidatorError(
            "Expected ModelA, that is an object with attribute 'a', that is a string; or ModelB, that is an object with attribute 'b', that is a number.",
          ),
        );
      });
    });

    describe('with non-validation error in first validator', () => {
      beforeEach(
        setValidator(
          union(() => {
            throw new Error('Test error');
          }, model('ModelA', {a: field(string)})),
        ),
      );

      describe('with first type', () => {
        beforeEach(setValue(1234));
        it('throws the inner error', testValidatorError('Test error'));
      });

      describe('with second type', () => {
        beforeEach(setValue({a: 'asdf'}));
        it('throws the inner error', testValidatorError('Test error'));
      });

      describe('with neither type', () => {
        beforeEach(setValue({a: 1234, b: 'asdf'}));
        it('throws the inner error', testValidatorError('Test error'));
      });
    });

    describe('with non-validation error in second validator', () => {
      beforeEach(
        setValidator(
          union(model('ModelA', {a: field(string)}), () => {
            throw new Error('Test error');
          }),
        ),
      );

      describe('with first type', () => {
        beforeEach(setValue({a: 'asdf'}));
        it('returns the value', testValidator({a: 'asdf'}));
      });

      describe('with second type', () => {
        beforeEach(setValue(1234));
        it('throws the inner error', testValidatorError('Test error'));
      });

      describe('with neither type', () => {
        beforeEach(setValue({a: 1234, b: 'asdf'}));
        it('throws the inner error', testValidatorError('Test error'));
      });
    });
  });

  describe('intersect', () => {
    describe('with object types', () => {
      const ModelA = model('ModelA', {a: field(string)});
      const ModelB = model('ModelB', {b: field(number)});

      beforeEach(setValidator(intersect(ModelA, ModelB)));

      describe('with first type', () => {
        beforeEach(setValue({a: 'asdf'}));
        it(
          'throws an error describing failure',
          testValidatorError(
            "ModelB expected an object with attribute 'b', that is a number.",
          ),
        );
      });

      describe('with second type', () => {
        beforeEach(setValue({b: 1234}));
        it(
          'throws an error describing failure',
          testValidatorError(
            "ModelA expected an object with attribute 'a', that is a string.",
          ),
        );
      });

      describe('with both types', () => {
        beforeEach(setValue({a: 'asdf', b: 1234}));
        it('returns the value', testValidator({a: 'asdf', b: 1234}));
      });

      describe('with neither type', () => {
        beforeEach(setValue({a: 1234, b: 'asdf'}));
        it(
          'throws an error describing failure',
          testValidatorError(
            "ModelA expected an object with attribute 'a', that is a string.",
          ),
        );
      });
    });
  });
});
