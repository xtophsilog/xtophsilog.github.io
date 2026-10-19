// Runs the API and the Vite dev server side by side with prefixed output.
import { spawn } from 'node:child_process';

const procs = [
  ['api', 'server', '\x1b[36m'],
  ['web', 'client', '\x1b[35m'],
].map(([name, cwd, color]) => {
  const child = spawn('npm', ['run', 'dev'], { cwd, shell: true, env: process.env });
  const prefix = (chunk) =>
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => console.log(`${color}[${name}]\x1b[0m ${line}`));
  child.stdout.on('data', prefix);
  child.stderr.on('data', prefix);
  child.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    procs.forEach((p) => p.kill());
    process.exit(code ?? 0);
  });
  return child;
});

process.on('SIGINT', () => procs.forEach((p) => p.kill()));
