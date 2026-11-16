import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicoAPI } from '../services/api';

const initialForm = {
  veiculo_id: '', nome: '', email: '', telefone: '',
  data_saida: '', dias_previsto: 1, aceite_politica: false, website: ''
};

export function PoliticaPrivacidade() {
  return <main className="max-w-3xl mx-auto p-8 space-y-4">
    <h1 className="text-2xl font-bold">Política de privacidade — demonstração acadêmica</h1>
    <p>O formulário coleta nome, e-mail, telefone opcional, veículo desejado, data e duração da locação somente para que a equipe avalie sua solicitação.</p>
    <p>Pedidos públicos não se transformam automaticamente em contratos. Apenas funcionários autenticados acessam as solicitações, e os dados de contato não são enviados ao IBGE.</p>
    <p>Os pedidos recusados podem ser eliminados pela equipe; dados vinculados a contratos exigem análise de obrigações de retenção aplicáveis.</p>
    <p>Para exercício dos direitos de informação, correção e exclusão, contate a locadora responsável. Esta é uma demonstração acadêmica e, antes de uso real, é necessário identificar o controlador, o canal de privacidade e os prazos de retenção.</p>
    <p>Versão: 16/11/2026. Consulte a documentação de LGPD do projeto para detalhes.</p>
    <Link to="/autoatendimento" className="text-blue-700 underline">Voltar ao autoatendimento</Link>
  </main>;
}

export function TermosUso() {
  return <main className="max-w-3xl mx-auto p-8 space-y-4">
    <h1 className="text-2xl font-bold">Termos de uso — demonstração acadêmica</h1>
    <p>A solicitação enviada pelo portal não garante disponibilidade nem confirma a reserva. A equipe verificará os dados e decidirá se aprova ou recusa o pedido.</p>
    <p>Os valores exibidos são estimativas de diárias, não representam cotação contratual final. É necessário fornecer informações corretas e não usar dados pessoais de terceiros sem autorização.</p>
    <p>O sistema é um protótipo acadêmico e não realiza pagamentos. Para uma operação real, o responsável pela locadora deverá completar informações contratuais e canais de atendimento.</p>
    <Link to="/autoatendimento" className="text-blue-700 underline">Voltar ao autoatendimento</Link>
  </main>;
}

export default function Autoatendimento() {
  const [veiculos, setVeiculos] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    publicoAPI.listVeiculos().then(data => setVeiculos(data.items))
      .catch(() => setError('Não foi possível consultar os veículos disponíveis.'));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      const data = await publicoAPI.solicitar({
        ...form, veiculo_id: Number(form.veiculo_id),
        dias_previsto: Number(form.dias_previsto)
      });
      setProtocolo(data.protocolo);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível registrar sua solicitação.');
    } finally {
      setSending(false);
    }
  }

  return <main className="min-h-screen bg-slate-50">
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">AutoLocadora — Autoatendimento</h1>
        <Link to="/login" className="text-blue-700 underline">Acesso da equipe</Link>
      </header>

      <p className="text-slate-700">Consulte os veículos disponíveis e envie uma solicitação de reserva. A confirmação depende de análise da equipe.</p>

      <section className="bg-white shadow-sm rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">Veículos disponíveis</h2>
        {veiculos.length === 0 ? <p>Não há veículos disponíveis no momento.</p> :
          <div className="grid sm:grid-cols-2 gap-3">
            {veiculos.map(v => <div key={v.id} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold">{v.marca} {v.modelo}</h3>
              <p className="text-sm">{v.categoria} • {v.ano_fabricacao}</p>
              <p className="font-medium">Diária: R$ {Number(v.valor_diaria).toFixed(2)}</p>
              <button type="button" className="text-blue-700 underline mt-2"
                onClick={() => setForm(f => ({ ...f, veiculo_id: String(v.id) }))}>
                Solicitar este veículo
              </button>
            </div>)}
          </div>}
      </section>

      <section className="bg-white shadow-sm rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">Solicitação de reserva</h2>
        {protocolo && <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded">
          Solicitação recebida, mas ainda não aprovada. Guarde seu protocolo: <strong>{protocolo}</strong>.
        </div>}
        {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">Veículo *
            <select className="w-full h-10 border rounded px-2" value={form.veiculo_id}
              onChange={e => setForm(f => ({ ...f, veiculo_id: e.target.value }))} required>
              <option value="">Selecione um veículo</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>)}
            </select>
          </label>
          <label className="block">Nome completo *
            <input className="w-full h-10 border rounded px-2" type="text" minLength={3}
              maxLength={120} required value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}/>
          </label>
          <label className="block">E-mail para contato *
            <input className="w-full h-10 border rounded px-2" type="email" maxLength={180}
              required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/>
          </label>
          <label className="block">Telefone (opcional)
            <input className="w-full h-10 border rounded px-2" type="tel" maxLength={20}
              value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}/>
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">Data desejada *
              <input className="w-full h-10 border rounded px-2" type="date" required
                min={new Date().toISOString().split('T')[0]} value={form.data_saida}
                onChange={e => setForm(f => ({ ...f, data_saida: e.target.value }))}/>
            </label>
            <label className="block">Quantidade de dias *
              <input className="w-full h-10 border rounded px-2" type="number" min={1} max={90}
                required value={form.dias_previsto}
                onChange={e => setForm(f => ({ ...f, dias_previsto: e.target.value }))}/>
            </label>
          </div>
          <div className="hidden" aria-hidden="true">
            <label>Website<input tabIndex={-1} autoComplete="off" value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}/></label>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={form.aceite_politica}
              onChange={e => setForm(f => ({ ...f, aceite_politica: e.target.checked }))}/>
            Li as informações de tratamento de dados na <Link to="/politica-privacidade" className="text-blue-700 underline">Política de Privacidade</Link> e os <Link to="/termos-uso" className="text-blue-700 underline">Termos de Uso</Link>.
          </label>
          <button type="submit" disabled={sending}
            className="bg-blue-700 text-white px-5 py-2 rounded hover:bg-blue-800 disabled:opacity-50">
            {sending ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </form>
      </section>
    </div>
  </main>;
}
