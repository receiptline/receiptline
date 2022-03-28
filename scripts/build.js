const { buildSync } = require('esbuild');
const glob = require("tiny-glob");
const { execSync } = require("child_process");
const path = require("path");

const pkg = require('../package.json');

(async () => {
  const chalk = (await import('chalk')).default;

  try {
    console.info(chalk.blue(`Build Started`));
    const outdir = path.resolve(__dirname, '../dist');

    // CLEAN STAGE
    console.info(chalk.blueBright(`clean started`));
    await execSync(`rm -rf ${outdir}`);
    console.info(chalk.blueBright(`clean complete:`), outdir);

    // BUNDLE/BUILD STAGE
    const globPath = path.resolve(__dirname, '../src/**/*');
    let entryPoints = await glob(globPath, { filesOnly: true });
    entryPoints = entryPoints.filter((filePath) => {
      // exclude files starting with "src/index" & "src/router" & "src/views"
      if (/^(src\/index|src\/router|src\/views)/.test(filePath)) return false;
      // exclude any test files from the build
      if (/(unit|integ)\.test/.test(filePath)) return false;
      return true;
    });

    let result = await buildSync({
      entryPoints,
      bundle: true,
      format: 'cjs',
      // format: 'esm',
      // sourcemap: true,
      external: [
        'stream',
        'string_decoder',
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies || {})
      ],
      outdir,
      // loader: {
      //   '.png': 'dataurl',
      // },
      logLevel: 'debug',
    });
    console.info(chalk.blue(`esbuild build complete`), result);

    // TYPESCRIPT STAGE
    console.info(chalk.blueBright(`typescript started`));
    let ts = Date.now();
    await execSync('$(npm bin)/tsc --project ./tsconfig.build.json');
    ts = Date.now() - ts;
    console.info(chalk.blueBright(`typescript done in ${ts / 1000}s`));
  } catch (e) {
    console.error(chalk.red(e));
  }
})();

