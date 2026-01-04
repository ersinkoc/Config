import { Star } from 'lucide-react';

export function GitHubStar() {
  return (
    <a
      href="https://github.com/ersinkoc/config"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
    >
      <Star className="w-4 h-4" />
      <span className="text-sm font-medium">Star</span>
    </a>
  );
}
