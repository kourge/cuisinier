import {field, fieldFromSnake, fieldWithKey} from './field';
import {model} from './model';
import {blankable} from './validator';
import {number, string} from './validators';

describe('Model', () => {
  describe('.create', () => {
    describe('#process', () => {
      const m = model(null, {
        aKey: fieldFromSnake(string),
        c: fieldWithKey(
          'd',
          model(null, {
            e: field(v => number(v) + 1),
          }),
        ),
        b: field(blankable(string)),
      });

      it('type checks', () => {
        // This ensures that the model returns the expected object
        expect(() => m({})).toThrow();
      });

      it('returns object with parsed values', () => {
        expect(m({a_key: '1', b: null, d: {e: 2}})).toEqual({
          aKey: '1',
          c: {e: 3},
        });
      });

      it('does not require optional values', () => {
        expect(m({a_key: '1', d: {e: 2}})).toEqual({aKey: '1', c: {e: 3}});
      });

      it('parses optional values when present', () => {
        expect(m({a_key: '1', b: '2', d: {e: 2}})).toEqual({
          aKey: '1',
          b: '2',
          c: {e: 3},
        });
      });

      it('throws a specific error on bad input', () => {
        expect(() => m({aKey: '1', d: {e: 2}})).toThrow(
          "Expected an object with attribute 'a_key', that is a string.",
        );
        expect(() => m({a_key: '1', d: '2'})).toThrow(
          "Expected an object with attribute 'd', that is an object.",
        );
        expect(() => m({a_key: '1', d: {e: '2'}})).toThrow(
          "Expected an object with attribute 'd', that is an object with attribute 'e', that is a number.",
        );
      });

      it('throws when passed a string', () => {
        expect(() => m('')).toThrow('Expected an object.');
      });

      it('throws when passed undefined', () => {
        expect(() => m(undefined)).toThrow('Expected an object.');
      });

      it('rethrows when inner validator has unknown error', () => {
        const badModel = model(null, {
          a: field(() => {
            throw new Error('A non-parse error');
          }),
        });
        expect(() => badModel({})).toThrow('A non-parse error');
      });

      describe('with a name', () => {
        const namedModel = model('MyClass', {
          aKey: fieldFromSnake(string),
          c: fieldWithKey(
            'd',
            model(null, {
              e: field(v => number(v) + 1),
            }),
          ),
          b: field(blankable(string)),
        });

        it('throws with the class name', () => {
          expect(() => namedModel('')).toThrow('MyClass expected an object.');
          expect(() => namedModel({aKey: '1', d: {e: 2}})).toThrow(
            "MyClass expected an object with attribute 'a_key', that is a string.",
          );
          expect(() => namedModel({a_key: '1', d: '2'})).toThrow(
            "MyClass expected an object with attribute 'd', that is an object.",
          );
          expect(() => namedModel({a_key: '1', d: {e: '2'}})).toThrow(
            "MyClass expected an object with attribute 'd', that is an object with attribute 'e', that is a number.",
          );
        });
      });
    });

    describe('#definition', () => {
      it('is the same as the passed definition', () => {
        const definition = {
          a: field((v: any) => v),
          b: field(blankable((v: any) => v)),
        };
        expect(model(null, definition).definition).toBe(definition);
      });
    });

    describe('when extending', () => {
      const m = model(null, {e: field(number), f: field(blankable(string))})
        .extend(null, {c: field(string), d: field(blankable(number))})
        .extend('MyClass', {a: field(string), b: field(blankable(number))});

      it('type checks', () => {
        // This ensures that the model returns the expected object
        expect(() => m({})).toThrow();
      });

      it('parses only required values', () => {
        expect(m({a: '1', c: '2', e: 3})).toEqual({a: '1', c: '2', e: 3});
      });

      it('parses all values when present', () => {
        expect(m({a: '1', b: 1, c: '2', d: 2, e: 3, f: '3'})).toEqual({
          a: '1',
          b: 1,
          c: '2',
          d: 2,
          e: 3,
          f: '3',
        });
      });

      it('throws a specific error', () => {
        expect(() => m({a: '1', c: '2', e: '3'})).toThrow(
          "MyClass expected an object with attribute 'e', that is a number.",
        );
      });

      it('throws with the class name', () => {
        expect(() => m('')).toThrow('MyClass expected an object.');
      });
    });
  });
});
