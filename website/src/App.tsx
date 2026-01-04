import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DocsLayout } from './components/layout/DocsLayout';
import { Home } from './pages/Home';
import { Introduction } from './pages/docs/Introduction';
import { Installation } from './pages/docs/Installation';
import { Configuration } from './pages/docs/Configuration';
import { Plugins } from './pages/docs/Plugins';
import { API } from './pages/API';
import { Examples } from './pages/Examples';
import { Playground } from './pages/Playground';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<DocsLayout><Introduction /></DocsLayout>} />
        <Route path="/docs/introduction" element={<DocsLayout><Introduction /></DocsLayout>} />
        <Route path="/docs/installation" element={<DocsLayout><Installation /></DocsLayout>} />
        <Route path="/docs/configuration" element={<DocsLayout><Configuration /></DocsLayout>} />
        <Route path="/docs/plugins" element={<DocsLayout><Plugins /></DocsLayout>} />
        <Route path="/api" element={<DocsLayout><API /></DocsLayout>} />
        <Route path="/examples" element={<DocsLayout><Examples /></DocsLayout>} />
        <Route path="/playground" element={<Playground />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
