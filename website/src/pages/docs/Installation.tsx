import { CodeBlockIDE } from '../../components/code/CodeBlockIDE';

export function Installation() {
  const npmInstall = `npm install @oxog/config`;

  const yarnInstall = `yarn add @oxog/config`;

  const pnpmInstall = `pnpm add @oxog/config`;

  const requirements = `# Node.js 18 or higher
node --version
# v18.0.0 or higher

# TypeScript 5.0 or higher
npm install -D typescript@^5.0.0`;

  const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`;

  const exampleImport = `import { loadConfig } from '@oxog/config';

const config = await loadConfig({
  name: 'myapp',
  paths: ['./config.yaml'],
});

console.log(config.get('port'));`;

  return (
    <div className="py-12 max-w-4xl">
      <h1 className="text-5xl font-bold mb-6">Installation</h1>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-muted-foreground mb-8">
          Install @oxog/config using your favorite package manager.
        </p>

        <h2>Requirements</h2>
        <p>Make sure you have the required versions of Node.js and TypeScript:</p>
        <CodeBlockIDE
          code={requirements}
          language="bash"
          filename="requirements.sh"
          showLineNumbers={false}
        />

        <h2>npm</h2>
        <CodeBlockIDE
          code={npmInstall}
          language="bash"
          filename="terminal"
          showLineNumbers={false}
        />

        <h2>Yarn</h2>
        <CodeBlockIDE
          code={yarnInstall}
          language="bash"
          filename="terminal"
          showLineNumbers={false}
        />

        <h2>pnpm</h2>
        <CodeBlockIDE
          code={pnpmInstall}
          language="bash"
          filename="terminal"
          showLineNumbers={false}
        />

        <h2>TypeScript Configuration</h2>
        <p>Ensure your tsconfig.json is properly configured:</p>
        <CodeBlockIDE
          code={tsconfig}
          language="json"
          filename="tsconfig.json"
        />

        <h2>Verify Installation</h2>
        <p>Create a simple test file to verify the installation:</p>
        <CodeBlockIDE
          code={exampleImport}
          language="typescript"
          filename="test.ts"
        />

        <h2>Next Steps</h2>
        <p>Now that you have @oxog/config installed:</p>
        <ul>
          <li>Read the <a href="/docs/introduction" className="text-primary hover:underline">Introduction</a> to understand the architecture</li>
          <li>Check out <a href="/docs/quick-start" className="text-primary hover:underline">Quick Start</a> for a basic example</li>
          <li>Browse the <a href="/api" className="text-primary hover:underline">API Reference</a> for detailed documentation</li>
          <li>See <a href="/examples" className="text-primary hover:underline">Examples</a> for real-world use cases</li>
        </ul>
      </div>
    </div>
  );
}
