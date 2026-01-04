export function Stats() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-muted-foreground">Runtime Dependencies</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">&lt;5KB</div>
          <div className="text-sm text-muted-foreground">Gzipped</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">5</div>
          <div className="text-sm text-muted-foreground">Config Formats</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold mb-1">100%</div>
          <div className="text-sm text-muted-foreground">TypeScript</div>
        </div>
      </div>
    </section>
  );
}
