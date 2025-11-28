import React from 'react';
import { ShieldCheck, Linkedin, Twitter, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                <span className="text-lg font-bold text-white">SECUR<span className="text-cyan-400">CERT</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ente certificatore leader nella sicurezza informatica. Proteggiamo il presente per garantire il futuro.
              </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Certificazioni</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400">CPF3:2025</a></li>
              <li><a href="#" className="hover:text-cyan-400">NIS 2 Compliance</a></li>
              <li><a href="#" className="hover:text-cyan-400">GDPR Audit</a></li>
              <li><a href="#" className="hover:text-cyan-400">TISAX</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Azienda</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-cyan-400">Chi Siamo</a></li>
              <li><a href="#" className="hover:text-cyan-400">Il Nostro Team</a></li>
              <li><a href="#" className="hover:text-cyan-400">Lavora con Noi</a></li>
              <li><a href="#" className="hover:text-cyan-400">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contatti</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@securcert.it</li>
              <li className="flex gap-4 mt-4">
                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-cyan-500 hover:text-slate-900 transition-colors"><Linkedin className="w-4 h-4" /></a>
                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-cyan-500 hover:text-slate-900 transition-colors"><Twitter className="w-4 h-4" /></a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-sm">© 2025 CertiCredia Italia S.r.l. - P.IVA 12345678901</p>
          <div className="flex gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};