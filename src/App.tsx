import { MotionConfig } from 'framer-motion';
import Hero from '@/components/hero/Hero';
import IntroSection from '@/components/intro/IntroSection';
import { InsideTheMachine } from '@/components/inside/InsideTheMachine';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="bg-[#0a0d0a]">
        <Hero />
        <IntroSection />
        <InsideTheMachine />
      </main>
    </MotionConfig>
  );
}

export default App;
