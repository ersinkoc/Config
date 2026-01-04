import { Link } from 'react-router-dom';
import { Home, Book, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
        <Link
          to="/docs/introduction"
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
        >
          <Book className="w-4 h-4" />
          Read Docs
        </Link>
      </div>

      <button
        onClick={() => window.history.back()}
        className="mt-8 flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back
      </button>
    </div>
  );
}
