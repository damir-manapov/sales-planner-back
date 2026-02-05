
import { normalizeCode } from './src/lib/normalize-code.js';

console.log('Testing normalizeCode:');
console.log('Input: my-Товар-01');
const result = normalizeCode('my-Товар-01');
console.log('Output:', result);
console.log('Expected: myTovar01');
console.log('Match:', result === 'myTovar01');
