import React from 'react';

export const Process: React.FC = () => {
  const steps = [
    { title: "Analisi Iniziale", desc: "Valutazione del perimetro e delle necessità tramite AI o consulente." },
    { title: "Onboarding Piattaforma", desc: "Accesso alla dashboard e caricamento della matrice documentale." },
    { title: "Intervento Specialist", desc: "Un nostro specialista certificato valida i dati e supporta il team." },
    { title: "Rilascio Certificazione", desc: "Emissione del certificato digitale crittografato e badge pubblico." }
  ];

  return (
    <section id="process" className="py-24 bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Il Nostro Metodo</h2>
          <p className="text-slate-400">Dall'audit alla certificazione in 4 step chiari.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 h-full hover:bg-slate-750 transition-all duration-300 hover:-translate-y-2">
                <div className="text-6xl font-black text-slate-700 absolute top-4 right-4 group-hover:text-cyan-500/10 transition-colors">
                  0{index + 1}
                </div>
                <div className="w-3 h-3 bg-cyan-500 rounded-full mb-6"></div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};