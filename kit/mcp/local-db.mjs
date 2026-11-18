#!/usr/bin/env node
// MCP stdio server: read/write access to the hub's LOCAL docker MySQL and MongoDB (never production).
// Configured by the hub's workspace.json `localDb`: { project: <compose project>, mysql?: <service>, mongo?: <service>, notes? }.
// Only the configured engines are listed as tools; a hub without `localDb` gets none.
// Goes through `docker exec`, so the passwords never leave the containers (official images' root env vars).
// ponytail: no SDK, the stdio protocol is newline-delimited JSON-RPC; add @modelcontextprotocol/sdk if we need resources/prompts.
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function hubConfig() {
  let dir = process.env.FACTORY_HUB || process.cwd();
  for (;;) { // same lookup as bin/lib/hub.sh: FACTORY_HUB, else the nearest workspace.json up from cwd
    const f = join(dir, 'workspace.json');
    if (existsSync(f)) { try { return JSON.parse(readFileSync(f, 'utf8')).localDb ?? null; } catch { return null; } }
    if (dirname(dir) === dir) return null;
    dir = dirname(dir);
  }
}
const cfg = hubConfig();

const MAX_ROWS = 200;
// Data changes yes, schema changes no: migrations own the schema and a dropped table/collection means a reseed.
const SQL_DDL = /\b(create|alter|drop|truncate|rename)\s+(table|database|schema|index|view|trigger|procedure|function|user)\b|\binto\s+(outfile|dumpfile)\b|\b(grant|revoke)\b/i;
const MONGO_DDL = /\.(drop|dropDatabase|dropIndex|dropIndexes|renameCollection|createUser|dropUser)\s*\(/;

export function checkSql(sql) {
  return SQL_DDL.test(sql) ? 'Schema changes (CREATE/ALTER/DROP/TRUNCATE/RENAME, GRANT, INTO OUTFILE) are not allowed: change data only.' : null;
}

export function checkMongo(script) {
  return MONGO_DDL.test(script) ? 'Dropping or renaming databases, collections, indexes or users is not allowed: change documents only.' : null;
}

function container(service) {
  const name = execFileSync('docker', ['ps', '--filter', `label=com.docker.compose.project=${cfg.project}`, '--filter', `label=com.docker.compose.service=${service}`, '--format', '{{.Names}}'], { encoding: 'utf8' })
    .split('\n')[0];
  if (!name) throw new Error(`No local ${service} container running in compose project ${cfg.project} (start the docker stack of that repo).`);
  return name;
}

function exec(service, env, cmd) {
  const envArgs = Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  return execFileSync('docker', ['exec', '-i', ...envArgs, container(service), 'sh', '-c', cmd], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

const mysql = (sql, database) =>
  exec(cfg.mysql, { Q: sql, D: database }, 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --batch -e "$Q" $D 2>&1 | grep -v "Using a password"');

const mongo = (script, database) =>
  exec(cfg.mongo, { Q: script, D: database },
    'mongosh --quiet -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin "mongodb://localhost:27017/$D" --eval "$Q" 2>&1');

function limitRows(tsv) {
  const lines = tsv.trimEnd().split('\n');
  if (lines.length <= MAX_ROWS + 1) return tsv;
  return lines.slice(0, MAX_ROWS + 1).join('\n') + `\n… ${lines.length - 1 - MAX_ROWS} more rows (add a LIMIT)`;
}

const DB_NAME = /^[\w-]*$/;
const refuse = msg => { if (msg) throw new Error(msg); };
const tools = [
  {
    name: 'mysql_query',
    engine: 'mysql',
    description: 'SQL against the LOCAL docker MySQL (never production). SELECT, INSERT, UPDATE and DELETE allowed (several statements per call too); schema changes are not. Returns TSV (max 200 rows). Writes skip the service logic: prefer the API when it can create the data.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'The SQL. `SHOW DATABASES` lists the schemas.' },
        database: { type: 'string', description: 'Schema to run it in. Optional if the SQL qualifies tables.' },
      },
      required: ['sql'],
    },
    run: ({ sql = '', database = '' }) => refuse(checkSql(sql)) ?? limitRows(mysql(sql, database)),
  },
  {
    name: 'mongo_eval',
    engine: 'mongo',
    description: 'mongosh script against the LOCAL docker MongoDB (never production), with `db` set to `database`. Reads and document writes allowed (find, insertOne, updateMany, deleteOne…); dropping or renaming collections/databases/indexes is not. Print results, e.g. `printjson(db.items.find({}).limit(5).toArray())`. `db.adminCommand({listDatabases:1})` lists the databases.',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'The mongosh JavaScript.' },
        database: { type: 'string', description: 'Database to use as `db`.' },
      },
      required: ['script'],
    },
    run: ({ script = '', database = '' }) => refuse(checkMongo(script)) ?? mongo(script, database),
  },
].filter(t => cfg?.project && cfg[t.engine])
  .map(t => cfg.notes ? { ...t, description: `${t.description} ${cfg.notes}` } : t);

function call(name, args) {
  const tool = tools.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool ${name}`);
  if (!DB_NAME.test(args.database ?? '')) return { content: [{ type: 'text', text: 'Bad database name.' }], isError: true };
  try {
    const text = tool.run(args);
    return { content: [{ type: 'text', text: text || '(done, no output)' }], isError: /^(ERROR \d+|MongoServerError|\w*Error:)/m.test(text) };
  } catch (e) {
    return { content: [{ type: 'text', text: String(e.stdout || e.message) }], isError: true };
  }
}

function handle({ id, method, params }) {
  if (method === 'initialize') return { protocolVersion: params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'local-db', version: '0.2.0' } };
  if (method === 'tools/list') return { tools: tools.map(({ run, engine, ...t }) => t) };
  if (method === 'tools/call') return call(params.name, params.arguments ?? {});
  if (method === 'ping') return {};
  if (id !== undefined) throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

if (process.argv[2] === '--self-test') {
  const assert = (await import('node:assert')).strict;
  assert.equal(checkSql('SELECT 1; INSERT INTO t VALUES (1); UPDATE t SET a=2; DELETE FROM t WHERE a=2'), null);
  assert.equal(checkSql("INSERT INTO t (note) VALUES ('please drop by')"), null);
  for (const bad of ['DROP TABLE users', 'truncate table users', 'ALTER TABLE users ADD x int', 'CREATE DATABASE x', "SELECT 1 INTO OUTFILE '/tmp/x'", 'GRANT ALL ON *.* TO x'])
    assert.ok(checkSql(bad), bad);
  assert.equal(checkMongo('db.items.insertOne({a:1}); db.items.deleteMany({a:1})'), null);
  for (const bad of ['db.items.drop()', 'db.dropDatabase()', 'db.items.renameCollection("x")'])
    assert.ok(checkMongo(bad), bad);
  console.log('ok');
} else {
  createInterface({ input: process.stdin }).on('line', line => {
    if (!line.trim()) return;
    const msg = JSON.parse(line);
    let reply;
    try {
      const result = handle(msg);
      if (msg.id === undefined) return; // notification
      reply = { jsonrpc: '2.0', id: msg.id, result };
    } catch (e) {
      reply = { jsonrpc: '2.0', id: msg.id, error: { code: e.code ?? -32603, message: e.message } };
    }
    process.stdout.write(JSON.stringify(reply) + '\n');
  });
}
