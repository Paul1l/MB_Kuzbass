import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Корень репозитория — то, что загружается на хостинг, и он должен совпадать со свежей
// сборкой app/dist. Иначе правка, сделанная только в корне (или только в app), тихо
// теряется при следующей выкладке. Запускать после npm run build.
const distDirectory = path.resolve('dist');
const rootDirectory = path.resolve('..');
// Файлы репозитория, которых нет в сборке и не должно быть на хостинге.
const repositoryOnly = new Set(['.git', '.github', '.gitignore', 'app', 'docs']);

async function collectFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(entryPath, base);
      return [path.relative(base, entryPath).split(path.sep).join('/')];
    }),
  );
  return nested.flat();
}

const builtFiles = await collectFiles(distDirectory);
const rootEntries = await readdir(rootDirectory, { withFileTypes: true });
const rootFiles = (
  await Promise.all(
    rootEntries
      .filter((entry) => !repositoryOnly.has(entry.name) && !(entry.isFile() && entry.name.endsWith('.md')))
      .map((entry) =>
        entry.isDirectory()
          ? collectFiles(path.join(rootDirectory, entry.name), rootDirectory)
          : [entry.name],
      ),
  )
).flat();

const problems = [];
const built = new Set(builtFiles);
for (const file of builtFiles) {
  const [fromBuild, fromRoot] = await Promise.all([
    readFile(path.join(distDirectory, file)),
    readFile(path.join(rootDirectory, file)).catch(() => null),
  ]);
  if (!fromRoot) problems.push(`нет в корне: ${file}`);
  else if (!fromBuild.equals(fromRoot)) problems.push(`отличается от сборки: ${file}`);
}
for (const file of rootFiles) {
  if (!built.has(file)) problems.push(`лишний в корне (нет в сборке): ${file}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  throw new Error(
    'Корень репозитория разошелся с app/dist. Править нужно в app, затем npm run build и скопировать app/dist в корень.',
  );
}
console.log(`Корень репозитория совпадает со сборкой: ${builtFiles.length} файлов.`);
