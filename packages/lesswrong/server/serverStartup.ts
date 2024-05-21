/* eslint-disable no-console */
import './datadog/tracer';
import { createSqlConnection } from './sqlConnection';
import { replaceDbNameInPgConnectionString, setSqlClient } from '../lib/sql/sqlClient';
import PgCollection, { DbTarget } from '../lib/sql/PgCollection';
import { Collections } from '../lib/vulcan-lib/getCollection';
import { isAnyTest, CommandLineArguments } from '../lib/executionEnvironment';
import { PublicInstanceSetting } from "../lib/instanceSettings";
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { Globals } from '../lib/vulcan-lib/config';
import { getBranchDbName } from "./branchDb";
import { dropAndCreatePg } from './testingSqlClient';
import process from 'process';
import { filterConsoleLogSpam, wrapConsoleLogFunctions } from '../lib/consoleFilters';
import { getAllPostgresViews } from './postgresView';
import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { panic } from './utils/errorUtil';
import { addCronJob } from './cronUtil';

const numCPUs = cpus().length;

/**
 * Whether to run multiple node processes in a cluster.
 * The main reason this is a PublicInstanceSetting because it would be annoying and disruptive for other devs to change this while you're running the server.
 */
export const clusterSetting = new PublicInstanceSetting<boolean>('cluster.enabled', false, 'optional')
export const numWorkersSetting = new PublicInstanceSetting<number>('cluster.numWorkers', numCPUs, 'optional')

// Do this here to avoid a dependency cycle
Globals.dropAndCreatePg = dropAndCreatePg;

const initConsole = () => {
  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";

  filterConsoleLogSpam();
  wrapConsoleLogFunctions((log, ...message) => {
    const pidString = clusterSetting.get() ? ` (pid: ${process.pid})` : "";
    process.stdout.write(`${blue}${new Date().toISOString()}${pidString}:${endBlue} `);
    log(...message);

    // Uncomment to add stacktraces to every console.log, for debugging where
    // mysterious output came from.
    //var stack = new Error().stack
    //log(stack)
  });
}

const connectToPostgres = async (connectionString: string, target: DbTarget = "write") => {
  try {
    if (connectionString) {
      const branchDb = await getBranchDbName();
      if (branchDb) {
        connectionString = replaceDbNameInPgConnectionString(connectionString, branchDb);
      }
      const dbName = /.*\/(.*)/.exec(connectionString)?.[1];
      // eslint-disable-next-line no-console
      console.log(`Connecting to postgres (${dbName})`);
      const sql = await createSqlConnection(connectionString, false);
      setSqlClient(sql, target);
    }
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to postgres: ", err.message);
    process.exit(1);
  }
}

const initDatabases = ({postgresUrl, postgresReadUrl}: CommandLineArguments) =>
  Promise.all([
    connectToPostgres(postgresUrl),
    connectToPostgres(postgresReadUrl, "read"),
  ]);

const initSettings = () => {
  if (!isAnyTest) {
    setInterval(refreshSettingsCaches, 1000 * 60 * 5) // We refresh the cache every 5 minutes on all servers
  }
  return refreshSettingsCaches();
}

const initPostgres = async () => {
  if (Collections.some(collection => collection instanceof PgCollection)) {
    for (const collection of Collections) {
      if (collection instanceof PgCollection) {
        collection.buildPostgresTable();
      }
    }
  }

  // If we're migrating up, we might be migrating from the start on a fresh database, so skip the check
  // for whether postgres views exist
  const migrating = process.argv.some(arg => arg.indexOf('migrate') > -1)
  const migratingUp = process.argv.some(arg => arg === 'up')
  if (migrating && migratingUp) return;

  try {
    for (const view of getAllPostgresViews()) {
      view.registerCronJob(addCronJob);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure Postgres views exist:", e);
  }
}

export const initServer = async (commandLineArguments?: CommandLineArguments) => {
  initConsole();
  const args = commandLineArguments ?? getCommandLineArguments();
  if (!args.postgresUrl) {
    panic("Missing postgresUrl");
  }
  await initDatabases(args);
  await initSettings();
  require('../server.ts');
  await initPostgres();
  return args;
}

export const serverStartup = async () => {
  // Run server directly if not in cluster mode
  if (!clusterSetting.get()) {
    await serverStartupWorker();
    return;
  }

  // Use OS load balancing (as opposed to round-robin)
  // In principle, this should give better performance because it is aware of resource (cpu) usage
  cluster.schedulingPolicy = cluster.SCHED_NONE
  if (cluster.isPrimary) {
    // Initialize db connection and a few other things such as settings, but don't start a webserver.
    console.log("Initializing primary process");
    await initServer();

    const numWorkers = numWorkersSetting.get();

    console.log(`Running in cluster mode with ${numWorkers} workers (vs ${numCPUs} cpus)`);
    console.log(`Primary ${process.pid} is running, about to fork workers`);

    // Fork workers.
    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, _code, _signal) => {
      console.log(`Worker ${worker.process.pid} died`);
    });
  } else {
    console.log(`Starting worker ${process.pid}`);
    await serverStartupWorker();
    console.log(`Worker ${process.pid} started`);
  }
}

export const serverStartupWorker = async () => {
  const commandLineArguments = await initServer();
  const { serverMain } = require('./serverMain');
  await serverMain(commandLineArguments);
}
