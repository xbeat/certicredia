import React from 'react';
import { Button } from './Button';
import { ChevronRight, Shield } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-slate-900">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-30"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-cyan-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Shield className="w-4 h-4" />
          <span>Nuovo Framework Cybersecurity 2025</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
          La sicurezza non è un'opzione.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            È una Certificazione.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
          CertiCredia Italia è il partner strategico per specialisti che vogliono eccellere e aziende che esigono conformità. Un ecosistema unico per la Cybersecurity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="primary" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 group"
            onClick={() => document.getElementById('companies')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Per le Aziende
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => document.getElementById('specialists')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Per gli Specialisti
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-slate-800 pt-12">
          {[
            { label: 'Aziende Certificate', value: '1.2k' },
            { label: 'Specialisti Attivi', value: '100%' },
            { label: 'Compliance', value: 'CPF3' },
            { label: 'Supporto', value: '24/7' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-cyan-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};