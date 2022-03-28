/* eslint-env node */
const { execSync } = require('child_process');
const yargs  = require('yargs/yargs');
const { hideBin }  = require('yargs/helpers');


/**
 *
 * @description
 * @param argv
 * - By adding flag "-- --FLAG_NAME" to build command like this npm run COMMAND -- --FLAG_NAME
 * - By adding flag "--FLAG_NAME" to direct calls to this node script like this node SCRIPT_FILE --FLAG_NAME
 */
const argv = yargs(hideBin(process.argv)).argv

// available commands
// node scripts/lint.js
// node scripts/lint.js --debug
// node scripts/lint.js --fix

const isDebug = argv.debug ? true : false;
const shouldFix = argv.fix ? true : false;

(async () => {
  const chalk = (await import('chalk')).default;

  let lint_command = '$(npm bin)/eslint --ext=ts,tsx src';
  let ts_command = '$(npm bin)/tsc -p ./tsconfig.eslint.json --noEmit';

  try {
    if (isDebug) {
      // TIMING=1 env var added to check each rule time
      lint_command = `TIMING=1 ${lint_command}`;
    }

    if (shouldFix) {
      lint_command = `${lint_command} --fix`;
      // no need to run ts lint command
      ts_command = undefined;
    }

    if (ts_command) {
      console.info(chalk.blue('TS CHECK STARTED'));
      console.time(ts_command);
      await execSync(ts_command, { stdio: 'inherit' });
      console.timeEnd(ts_command);
    }
    if (lint_command) {
      console.info(chalk.blue('LINTING STARTED'));
      if (isDebug) {
        console.info(chalk.yellow('when checking timing, the first Rule will also accumulate eslint bootstrapping time'));
        console.info(chalk.yellow('the first rule time should not be held as accurate because of this additional time factored in'));
      }
      console.time(lint_command);
      await execSync(lint_command, { stdio: 'inherit' });
      console.timeEnd(lint_command);
    }
  } catch (e) {
    console.info(chalk.red(e));
    if (e.message) {
      if (ts_command && e.message.includes(ts_command)) {
        console.timeEnd(ts_command);
      }
      if (lint_command && e.message.includes(lint_command)) {
        console.timeEnd(lint_command);
      }
    }
    process.exit(1)
  }
  process.exit(0)
})();
