import {snake} from './utils';

describe('snake', () => {
  it('converts camel to snake case', () => {
    expect(snake('helloWorld')).toBe('hello_world');
    expect(snake('hello_world')).toBe('hello_world');
    expect(snake('ALOT')).toBe('a_l_o_t');
    expect(snake('helloWorld123')).toBe('hello_world_123');
    expect(snake('hello world')).toBe('hello world');
  });
});
