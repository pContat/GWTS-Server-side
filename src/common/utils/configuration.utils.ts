export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function isTest() {
  return process.env.NODE_ENV === 'test';
}

export function isDev() {
  return process.env.NODE_ENV === 'development';
}
