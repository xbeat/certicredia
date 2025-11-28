import React from 'react';
import { Zap, Globe, ShieldAlert, User, Briefcase, CheckCircle, FileText, LayoutDashboard, Award, GraduationCap, UserCheck, BrainCircuit, Building2, BarChart3, FileJson, TrendingUp, Shield, Users, Lock } from 'lucide-react';
import { Button } from './Button';

export const Services: React.FC = () => {
  const scrollToContact = () => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* PRIMA VERSIONE SEZIONE SPECIALISTI */}
        <section id="specialists" className="mb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-2xl transform rotate-3"></div>
                <img 
                  src="https://picsum.photos/600/400?grayscale" 
                  alt="Specialista Cybersecurity" 
                  className="relative rounded-2xl shadow-2xl border border-slate-700 grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-4">
                <User className="w-6 h-6" />
                <span>PER SPECIALISTI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Diventa un Auditor d'Eccellenza
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Non vendiamo solo un pezzo di carta. Ti forniamo gli strumenti per diventare il consulente di fiducia che ogni azienda cerca. Ottieni l'abilitazione all'uso della nostra suite proprietaria.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Certificazione Auditor Lead SecurCert",
                  "Accesso alla piattaforma di audit riservata",
                  "Network di aziende partner in cerca di consulenti",
                  "Formazione continua su nuovi vettori di attacco"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 mt-1 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline">Candidati Ora</Button>
            </div>
          </div>
        </section>

        {/* Section 2: Specialists Benefits (New Section) */}
        <section className="mb-32">
          <div className="bg-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-700/50">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-white mb-4">Perché scegliere il percorso SecurCert?</h3>
              <p className="text-slate-400 max-w-2xl mx-auto">
                La certificazione non è il traguardo, è l'inizio della tua ascesa professionale.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Tariffe Premium</h4>
                <p className="text-slate-400 text-sm">Gli specialisti certificati SecurCert accedono a tariffe di consulenza medie del +40% rispetto al mercato.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Community Esclusiva</h4>
                <p className="text-slate-400 text-sm">Accesso a canali Slack privati per confronto diretto con i migliori esperti di cybersecurity in Italia.</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-colors">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Incident Response</h4>
                <p className="text-slate-400 text-sm">Partecipa come risorsa ausiliaria nei team di risposta agli incidenti critici dei nostri clienti enterprise.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDA VERSIONE SEZIONE SPECIALISTI */}
        <section id="specialists-2" className="mb-32 scroll-mt-24">
          <div className="flex flex-col md:flex-row gap-12 items-start mb-24">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-4">
                <GraduationCap className="w-6 h-6" />
                <span>PER SPECIALISTI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Diventa Auditor Certificato CPF3
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Le aziende cercano professionisti che vadano oltre la checklist tecnica. La certificazione CertiCredia ti abilita all'uso del framework psicologico per affiancare le aziende.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg h-fit"><UserCheck className="w-6 h-6 text-cyan-500" /></div>
                    <div>
                        <h4 className="text-lg font-semibold text-white">Certificazione Specialist</h4>
                        <p className="text-sm text-slate-400">Ottieni il badge ufficiale e l'iscrizione all'albo degli auditor abilitati all'analisi pre-cognitiva.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg h-fit"><BrainCircuit className="w-6 h-6 text-cyan-500" /></div>
                    <div>
                        <h4 className="text-lg font-semibold text-white">Accesso al Framework</h4>
                        <p className="text-sm text-slate-400">Materiale formativo esclusivo sui 100 indicatori psicologici e accesso agli strumenti di valutazione.</p>
                    </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h5 className="text-white font-semibold mb-2">Requisiti:</h5>
                <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                    <li>Esperienza pregressa in IT/Cybersecurity o Psicologia del Lavoro.</li>
                    <li>Superamento dell'esame teorico CPF3.</li>
                </ul>
              </div>

              <Button variant="outline" className="mt-8" onClick={scrollToContact}>
                Richiedi Syllabus
              </Button>
            </div>
            
            <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-slate-800 p-8 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-6 text-center">Il Kit dello Specialista</h3>
                    <ul className="space-y-4">
                        {['Manuale Operativo CPF3:2025', 'Accesso Dashboard Valutatore', 'Slide Formative per Clienti', 'Badge Digitale Blockchain'].map((item, i) => (
                            <li key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-slate-300">{item}</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>

          {/* BLOCK 2: Career Path Grid (New Added Section) */}
          <div className="bg-slate-800/30 rounded-3xl p-8 md:p-12 border border-slate-700">
             <div className="text-center mb-12">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Percorso di Carriera Auditor</h3>
                <p className="text-slate-400">Da tecnico a consulente strategico: aumenta il tuo valore sul mercato.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all">
                    <div className="text-4xl font-black text-slate-800 mb-4">01</div>
                    <h4 className="text-xl font-bold text-white mb-2">Training</h4>
                    <p className="text-sm text-slate-400 mb-4">Corso intensivo di 40 ore su psicologia cognitiva e sicurezza.</p>
                    <div className="h-1 w-full bg-slate-800 rounded overflow-hidden"><div className="h-full w-1/3 bg-cyan-900"></div></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-bl-lg">POPULAR</div>
                    <div className="text-4xl font-black text-slate-800 mb-4">02</div>
                    <h4 className="text-xl font-bold text-white mb-2">Certification</h4>
                    <p className="text-sm text-slate-400 mb-4">Esame teorico-pratico e rilascio del badge CPF3 Auditor.</p>
                    <div className="h-1 w-full bg-slate-800 rounded overflow-hidden"><div className="h-full w-2/3 bg-cyan-600"></div></div>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition-all">
                    <div className="text-4xl font-black text-slate-800 mb-4">03</div>
                    <h4 className="text-xl font-bold text-white mb-2">Placement</h4>
                    <p className="text-sm text-slate-400 mb-4">Accesso al network CertiCredia per affiancamento su clienti enterprise.</p>
                    <div className="h-1 w-full bg-slate-800 rounded overflow-hidden"><div className="h-full w-full bg-cyan-400"></div></div>
                </div>
             </div>          
        </section>

        {/* PRIMA VERSIONE SEZIONE AZIENDE */}
        <section id="companies">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold mb-4">
                <Briefcase className="w-6 h-6" />
                <span>PER AZIENDE</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                La Security Governance, Semplificata
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Acquista il pacchetto di certificazione completo. Dimentica i fogli Excel infiniti. La nostra piattaforma ti guida passo dopo passo verso la conformità ISO e NIS2.
              </p>
              
              <div className="grid gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
                  <LayoutDashboard className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Dashboard Compliance</h3>
                  <p className="text-slate-400 text-sm">Visualizza il tuo punteggio di sicurezza in tempo reale e monitora i gap.</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors">
                  <FileText className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Matrice di Compilazione</h3>
                  <p className="text-slate-400 text-sm">Template pre-compilati e guidati per policy e procedure aziendali.</p>
                </div>
              </div>

              <Button variant="primary">Richiedi Demo Dashboard</Button>
            </div>
            <div className="relative">
               <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-2xl"></div>
               <img 
                  src="https://picsum.photos/600/401?blur=2" 
                  alt="Dashboard Aziendale" 
                  className="relative rounded-2xl shadow-2xl border border-slate-700"
                />
               {/* Floating Badge */}
               <div className="absolute -bottom-6 -left-6 bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-xl flex items-center gap-4">
                 <div className="bg-green-500/20 p-2 rounded-full">
                   <Award className="w-8 h-8 text-green-400" />
                 </div>
                 <div>
                   <div className="text-white font-bold">Certificato CPF3:2025</div>
                   <div className="text-xs text-green-400">Verificato Oggi</div>
                 </div>
               </div>
            </div>
          </div> 
        </section>

        <section id="companies-2" className="scroll-mt-24 mt-24">
          <div className="flex items-center gap-2 text-blue-400 font-bold mb-8 justify-end md:justify-start">
             <Building2 className="w-6 h-6" />
             <span>PER AZIENDE</span>
          </div>

          {/* BLOCK 1: Intro & Dashboard */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <span className="text-white font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400"/> CPF3 Risk View</span>
                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50 animate-pulse">Critical Level</span>
                    </div>
                    {/* Enhanced Fake Chart */}
                    <div className="space-y-6">
                        {[
                            { label: 'Vulnerabilità Autorità (Cat 1.x)', val: '85%', color: 'bg-red-500' },
                            { label: 'Sovraccarico Cognitivo (Cat 5.x)', val: '62%', color: 'bg-yellow-500' },
                            { label: 'Stress Response (Cat 7.x)', val: '12%', color: 'bg-green-500' }
                        ].map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-xs text-slate-300 mb-2 font-medium">
                                    <span>{item.label}</span>
                                    <span>{item.val}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/50">
                                    <div className={`${item.color} h-full rounded-full shadow-lg`} style={{width: item.val}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                        <span>Last scan: 2 mins ago</span>
                        <span>Auditor: G. Canale</span>
                    </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Certificazione CPF3:2025
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                Ottieni la certificazione che dimostra la tua resilienza psicologica oltre che tecnica. Sostituisci la falsa sicurezza della compliance cartacea (ISO standard) con la predizione attiva del rischio umano.
              </p>
              
              <div className="grid gap-6 mb-8">
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg h-fit"><BarChart3 className="w-6 h-6 text-blue-400" /></div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">Dashboard & Matrice 10x10</h3>
                        <p className="text-slate-400">Visualizza i 100 indicatori psicologici in tempo reale con punteggi semaforici (Verde/Giallo/Rosso).</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg h-fit"><FileJson className="w-6 h-6 text-blue-400" /></div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">Matrice di Compilazione</h3>
                        <p className="text-slate-400">Template guidati per mappare policy aziendali e procedure HR sugli standard psicologici del framework.</p>
                    </div>
                </div>
              </div>

              <Button variant="primary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Richiedi Audit Aziendale
              </Button>
            </div>
          </div>

           {/* BLOCK 2: Strategic Advantages (New Added Section) */}
           <div className="grid md:grid-cols-2 gap-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700">
              <div className="flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Perché abbandonare i vecchi standard?</h3>
                  <p className="text-slate-400 mb-6">
                      Le certificazioni tradizionali (ISO 27001) guardano ai processi statici. Il CPF3:2025 guarda alle persone che li eseguono.
                  </p>
                  <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-slate-300">
                          <Lock className="w-5 h-5 text-red-400" /> 
                          <span className="line-through decoration-red-500/50 decoration-2 text-slate-500">Focus solo su Hardware/Software</span>
                      </li>
                      <li className="flex items-center gap-3 text-white font-medium">
                          <Users className="w-5 h-5 text-green-400" /> 
                          <span>Focus su Stress, Bias e Comportamento</span>
                      </li>
                      <li className="flex items-center gap-3 text-white font-medium">
                          <TrendingUp className="w-5 h-5 text-green-400" /> 
                          <span>Riduzione incidenti del 40% nel primo anno</span>
                      </li>
                  </ul>
              </div>
              <div className="relative h-64 md:h-auto bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
                   <div className="relative z-10 text-center p-6">
                       <div className="text-5xl font-bold text-white mb-2">ROI +200%</div>
                       <div className="text-blue-400 uppercase tracking-widest text-sm">Sull'investimento in sicurezza</div>
                   </div>
              </div>
           </div>

        </section>

        {/* Section 2: Company Strategic Benefits (New Section) */}
        <section>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-3 text-center mb-8">
                <h3 className="text-2xl font-bold text-white">Non solo burocrazia: Vantaggi Reali</h3>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl bg-slate-800 p-8 border border-slate-700 hover:bg-slate-750 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Lock className="w-24 h-24 text-blue-500" />
               </div>
               <div className="relative z-10">
                  <Lock className="w-10 h-10 text-blue-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Protezione Legale</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    La certificazione SecurCert dimostra la "due diligence" nella gestione dei dati, offrendo uno scudo legale fondamentale in caso di data breach secondo le normative GDPR.
                  </p>
               </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-slate-800 p-8 border border-slate-700 hover:bg-slate-750 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="w-24 h-24 text-blue-500" />
               </div>
               <div className="relative z-10">
                  <Globe className="w-10 h-10 text-blue-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Vantaggio Competitivo</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Entra nelle vendor list delle grandi multinazionali. La certificazione è sempre più un requisito bloccante per partecipare a gare d'appalto pubbliche e private.
                  </p>
               </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-slate-800 p-8 border border-slate-700 hover:bg-slate-750 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-24 h-24 text-blue-500" />
               </div>
               <div className="relative z-10">
                  <Zap className="w-10 h-10 text-blue-400 mb-4" />
                  <h4 className="text-xl font-bold text-white mb-2">Riduzione Rischi</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Riduci del 70% la probabilità di attacchi ransomware di successo grazie all'implementazione strutturata dei controlli di sicurezza previsti dal framework.
                  </p>
               </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};