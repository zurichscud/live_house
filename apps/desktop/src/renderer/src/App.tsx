import { HashRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { TitleBar } from '@/components/TitleBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { HomePage } from '@/pages/HomePage';
import { MinePage } from '@/pages/MinePage';
import { RoomPage } from '@/pages/RoomPage';
import { SearchPage } from '@/pages/SearchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useTheme } from '@/lib/theme';

export default function App(): React.JSX.Element {
  const theme = useTheme();

  return (
    <TooltipProvider delayDuration={350}>
      <HashRouter>
        <div className="flex h-full flex-col overflow-hidden">
          {/* 标题栏独占一行，导航与内容区都在其下方 */}
          <TitleBar />
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/mine" element={<MinePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/room/:site/:roomId" element={<RoomPage />} />
                <Route path="/search" element={<SearchPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </HashRouter>
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          style: {
            background: 'var(--color-raised)',
            border: '1px solid var(--color-line)',
            color: 'var(--color-ink)',
            fontSize: 'var(--text-label)'
          }
        }}
      />
    </TooltipProvider>
  );
}
