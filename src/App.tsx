/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Roster } from './pages/Roster';
import { MatchSetup } from './pages/MatchSetup';
import { MatchView } from './pages/MatchView';
import { Stats } from './pages/Stats';

import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter basename="/LigaDV/">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="roster" element={<Roster />} />
            <Route path="setup" element={<MatchSetup />} />
            <Route path="match/:matchId" element={<MatchView />} />
            <Route path="stats" element={<Stats />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FirebaseProvider>
  );
}
