// src/__tests__/simple.test.js
describe('Basic Tests', () => {
  test('Math works correctly', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  test('String operations work', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
    expect('world'.length).toBe(5);
  });

  test('Array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });

  test('Date functions work', () => {
    const date = new Date(2024, 0, 1); // Use constructor with explicit year, month (0-indexed), day
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January is 0
  });

  test('JSON operations work', () => {
    const obj = { name: 'test', value: 123 };
    const str = JSON.stringify(obj);
    const parsed = JSON.parse(str);
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(123);
  });
});