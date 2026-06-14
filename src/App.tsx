import { useGameStore } from './store/useGameStore';
import Setup from './views/Setup';
import Dashboard from './views/Dashboard';
import DraftRoom from './views/DraftRoom';
import MatchViewer from './views/MatchViewer';
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground font-sans antialiased">
        {gameState === 'SETUP' && <Setup />}
        {gameState === 'OFFICE' && <Dashboard />}
        {gameState === 'DRAFT' && <DraftRoom />}
        {(gameState === 'MATCH' || gameState === 'SUMMARY') && <MatchViewer />}
      </main>
    </TooltipProvider>
  );
}
