import React, { useEffect, useState } from 'react';
import { auditoriaAPI } from '../services/api';

export default function Auditoria() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    auditoriaAPI.list().then(data => setEvents(data.items))
      .catch(() => setError('Não foi possível carregar os eventos de auditoria'));
  }, []);
  return <section className="space-y-5">
    <header>
      <h1 className="text-xl font-semibold">Auditoria das operações</h1>
      <p className="text-sm text-slate-500">Últimas 100 operações. O registro não armazena senhas, tokens ou corpos de requisição.</p>
    </header>
    {error && <p className="text-red-700" role="alert">{error}</p>}
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr>
          {['Data', 'Usuário', 'Método', 'Recurso', 'Código HTTP'].map(h =>
            <th key={h} className="p-3 text-left">{h}</th>)}
        </tr></thead>
        <tbody>{events.map(e => <tr key={e.id} className="border-t">
          <td className="p-3">{new Date(e.created_at).toLocaleString('pt-BR')}</td>
          <td className="p-3">{e.usuario || 'Público'}</td>
          <td className="p-3">{e.evento}</td>
          <td className="p-3">{e.recurso}</td>
          <td className="p-3">{e.codigo_http}</td>
        </tr>)}</tbody>
      </table>
      {!events.length && !error && <p className="p-6">Nenhum evento registrado.</p>}
    </div>
  </section>;
}
