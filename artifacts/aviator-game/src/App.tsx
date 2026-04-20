import { Route, Switch } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { WhatsAppWidget } from '@/components/WhatsAppWidget';
import { Home } from '@/pages/Home';
import { AviatorGame } from '@/pages/AviatorGame';
import { CasinoLobby } from '@/pages/CasinoLobby';
import { VirtualGames } from '@/pages/VirtualGames';
import { SportsLobby } from '@/pages/SportsLobby';
import { SpinWheel } from '@/pages/SpinWheel';
import { ScholarshipPortal } from '@/pages/ScholarshipPortal';
import { VisaPortal } from '@/pages/VisaPortal';

function App() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(220 20% 7%)', color: 'hsl(0 0% 95%)' }}>
      <NavBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/play" component={AviatorGame} />
        <Route path="/casino" component={CasinoLobby} />
        <Route path="/virtual" component={VirtualGames} />
        <Route path="/sports" component={SportsLobby} />
        <Route path="/spin" component={SpinWheel} />
        <Route path="/scholarships" component={ScholarshipPortal} />
        <Route path="/visas" component={VisaPortal} />
        <Route component={Home} />
      </Switch>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}

export default App;
