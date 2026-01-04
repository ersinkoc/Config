import { useState, useCallback } from 'react';
import { CodeBlockIDE } from '../components/code/CodeBlockIDE';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';

const PRESETS = {
  yaml: {
    name: 'YAML',
    code: `# Application Configuration
port: 3000
name: my-awesome-app

database:
  host: localhost
  port: 5432
  name: myapp_db

server:
  timeout: 30000
  maxConnections: 100

features:
  - auth
  - logging
  - caching`,
  },
  json: {
    name: 'JSON',
    code: `{
  "port": 3000,
  "name": "my-awesome-app",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "server": {
    "timeout": 30000,
    "maxConnections": 100
  },
  "features": ["auth", "logging", "caching"]
}`,
  },
  toml: {
    name: 'TOML',
    code: `# Application Configuration
port = 3000
name = "my-awesome-app"

[database]
host = "localhost"
port = 5432
name = "myapp_db"

[server]
timeout = 30000
maxConnections = 100

features = ["auth", "logging", "caching"]`,
  },
  env: {
    name: 'ENV',
    code: `PORT=3000
APP_NAME=my-awesome-app
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_db
SERVER_TIMEOUT=30000
SERVER_MAX_CONNECTIONS=100`,
  },
};

type PresetKey = keyof typeof PRESETS;

export function Playground() {
  const [format, setFormat] = useState<PresetKey>('yaml');
  const [input, setInput] = useState(PRESETS.yaml.code);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const parseConfig = useCallback(() => {
    setError('');
    try {
      let parsed: Record<string, unknown>;

      switch (format) {
        case 'json':
          parsed = JSON.parse(input);
          break;
        case 'yaml':
          // Simple YAML parser simulation
          parsed = parseSimpleYaml(input);
          break;
        case 'toml':
          // Simple TOML parser simulation
          parsed = parseSimpleToml(input);
          break;
        case 'env':
          // Simple ENV parser simulation
          parsed = parseSimpleEnv(input);
          break;
        default:
          parsed = {};
      }

      setOutput(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse error');
      setOutput('');
    }
  }, [input, format]);

  const handleFormatChange = (newFormat: PresetKey) => {
    setFormat(newFormat);
    setInput(PRESETS[newFormat].code);
    setOutput('');
    setError('');
  };

  const handleReset = () => {
    setInput(PRESETS[format].code);
    setOutput('');
    setError('');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-5xl font-bold mb-6">Playground</h1>

      <p className="text-xl text-muted-foreground mb-8">
        Test @oxog/config parsers interactively. Enter your configuration and see the parsed output.
      </p>

      {/* Format Selector */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium">Format:</span>
        <div className="flex gap-2">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleFormatChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                format === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {PRESETS[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Input ({PRESETS[format].name})</h2>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={parseConfig}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Parse
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[400px] p-4 bg-card font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Parsed Output (JSON)</h2>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 h-[400px]">
              <p className="text-red-500 font-mono text-sm">{error}</p>
            </div>
          ) : output ? (
            <CodeBlockIDE
              code={output}
              language="json"
              filename="output.json"
              showLineNumbers={true}
            />
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-4 h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Click "Parse" to see the output</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Example */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Using the Parsed Config</h2>
        <p className="text-muted-foreground mb-4">
          After parsing, you can access values using dot notation:
        </p>

        <CodeBlockIDE
          code={`import { loadConfig } from '@oxog/config';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.${format}'],
});

// Access values
const port = config.get('port');
const dbHost = config.get('database.host');
const features = config.get('features');

// With default values
const timeout = config.get('server.timeout', 5000);

// Check if key exists
if (config.has('database')) {
  console.log('Database configured');
}`}
          language="typescript"
          filename="usage.ts"
        />
      </div>
    </div>
  );
}

// Simple parsers for demo purposes
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  const stack: { obj: Record<string, unknown>; indent: number }[] = [{ obj: result, indent: -1 }];
  let currentArray: unknown[] | null = null;
  let currentArrayKey = '';

  for (const line of lines) {
    const trimmed = line.replace(/#.*$/, '').trimEnd();
    if (!trimmed) continue;

    const indent = line.search(/\S/);
    const content = trimmed.trim();

    // Handle array items
    if (content.startsWith('- ')) {
      if (!currentArray) {
        currentArray = [];
        const parent = stack[stack.length - 1].obj;
        parent[currentArrayKey] = currentArray;
      }
      currentArray.push(parseYamlValue(content.slice(2)));
      continue;
    }

    currentArray = null;

    const colonIndex = content.indexOf(':');
    if (colonIndex === -1) continue;

    const key = content.slice(0, colonIndex).trim();
    const valueStr = content.slice(colonIndex + 1).trim();

    // Pop stack until we find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (valueStr === '' || valueStr.startsWith('#')) {
      // Nested object
      const newObj: Record<string, unknown> = {};
      parent[key] = newObj;
      stack.push({ obj: newObj, indent });
      currentArrayKey = key;
    } else {
      parent[key] = parseYamlValue(valueStr);
    }
  }

  return result;
}

function parseYamlValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(v => parseYamlValue(v.trim()));
  }
  return value;
}

function parseSimpleToml(toml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentSection = result;

  for (const line of toml.split('\n')) {
    const trimmed = line.replace(/#.*$/, '').trim();
    if (!trimmed) continue;

    // Section header
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = trimmed.slice(1, -1);
      result[section] = {};
      currentSection = result[section] as Record<string, unknown>;
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const valueStr = trimmed.slice(eqIndex + 1).trim();
    currentSection[key] = parseTomlValue(valueStr);
  }

  return result;
}

function parseTomlValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map(v => parseTomlValue(v.trim()));
  }
  return value;
}

function parseSimpleEnv(env: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value: string | number = trimmed.slice(eqIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Try to parse as number
    if (/^-?\d+$/.test(value)) {
      result[key] = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      result[key] = parseFloat(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
