import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '').replaceAll('%20', ' '));
const commands = [
  ['backend', [path.join(root, 'backend/src/app.js')], root],
  ['frontend', [path.join(root, 'frontend/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], path.join(root, 'frontend')],
];
const children = commands.map(([name, args, cwd]) => {
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
  child.on('error', error => { console.error(`[${name}] ${error.message}`); stop(1); });
  child.on('exit', code => {
    if (code && code !== 0) stop(code);
  });
  return child;
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
  process.exitCode = code;
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
