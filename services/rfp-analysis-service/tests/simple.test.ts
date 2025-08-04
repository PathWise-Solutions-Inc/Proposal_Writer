describe('Basic Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should load environment', () => {
    process.env.NODE_ENV = 'test';
    expect(process.env.NODE_ENV).toBe('test');
  });
});