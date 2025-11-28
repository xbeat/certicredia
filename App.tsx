import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Process } from './components/Process';
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { AIConsultant } from './components/AIConsultant';

function App() {
  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Process />
        <ContactForm />
      </main>
      <Footer />
      <AIConsultant />
    </div>
  );
}

export default App;