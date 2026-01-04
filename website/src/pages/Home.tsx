import { Hero } from '../components/home/Hero';
import { Features } from '../components/home/Features';
import { QuickStart } from '../components/home/QuickStart';
import { Stats } from '../components/home/Stats';
import { Comparison } from '../components/home/Comparison';

export function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <Comparison />
      <QuickStart />
    </>
  );
}
