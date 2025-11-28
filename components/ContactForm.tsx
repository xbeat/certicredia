import React, { useState } from 'react';
import { Button } from './Button';
import { UserType } from '../types';

export const ContactForm: React.FC = () => {
  const [userType, setUserType] = useState<UserType>(UserType.COMPANY);

  return (
    <section id="contact" className="py-24 bg-slate-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Inizia il Percorso</h2>
          <p className="text-slate-400">Compila il form. Il nostro team (o un nostro Specialist) ti contatterà entro 24h.</p>
        </div>

        <div className="bg-slate-900 p-8 md:p-10 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setUserType(UserType.COMPANY)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                userType === UserType.COMPANY ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              Sono un'Azienda
            </button>
            <button
              onClick={() => setUserType(UserType.SPECIALIST)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                userType === UserType.SPECIALIST ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              Sono uno Specialista
            </button>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" placeholder="Mario Rossi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email Aziendale</label>
                <input type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" placeholder="mario@azienda.it" />
              </div>
            </div>

            {userType === UserType.COMPANY ? (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome Azienda & P.IVA</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Link LinkedIn o CV</label>
                <input type="url" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" placeholder="https://linkedin.com/in/..." />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Messaggio</label>
              <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all" placeholder="Come possiamo aiutarti?"></textarea>
            </div>

            <Button className="w-full">
              {userType === UserType.COMPANY ? 'Richiedi Preventivo Certificazione' : 'Invia Candidatura'}
            </Button>
            
            <p className="text-xs text-center text-slate-500 mt-4">
              Cliccando su invia accetti la nostra Privacy Policy. I tuoi dati sono trattati secondo GDPR.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};