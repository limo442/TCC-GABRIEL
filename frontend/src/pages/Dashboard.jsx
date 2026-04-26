import React, { useEffect, useState } from 'react';
import { Car, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { veiculosAPI, clientesAPI, alugueisAPI } from '../services/api';

function StatCard({ icon: Icon, label, value, color, bg, testid }) {
  return (
    <div
      data-testid={testid}
      className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-3xl font-bold font-heading text-slate-900 leading-tight">{value ?? <span className="skeleton inline-block w-10 h-7" />}</p>
      </div>
    </div>
  );
}

function RecentRow({ rental }) {
  const statusMap = {
    reservado: { label: 'Reservado', cls: 'bg-amber-100 text-amber-700' },
    ativo: { label: 'Ativo', cls: 'bg-blue-100 text-blue-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
    concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
  };
  const s = statusMap[rental.status] || { label: rental.status, cls: 'bg-slate-100 text-slate-600' };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-slate-700 font-medium">#{rental.id}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{rental.cliente_nome || `Cliente #${rental.cliente_id}`}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{rental.marca} {rental.modelo}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{rental.data_saida ? new Date(rental.data_saida).toLocaleDateString('pt-BR') : '-'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
        {rental.valor_realizado
          ? `R$ ${parseFloat(rental.valor_realizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : `R$ ${parseFloat(rental.valor_previsto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [veiculos, clientes, alugueis] = await Promise.all([
          veiculosAPI.list(),
          clientesAPI.list(),
          alugueisAPI.list(),
        ]);

        const v = veiculos.items;
        const a = alugueis.items;

        const receita = a
          .filter(r => r.status === 'concluido' && r.valor_realizado)
          .reduce((sum, r) => sum + parseFloat(r.valor_realizado), 0);

        setStats({
          totalVeiculos: v.length,
          disponiveis: v.filter(x => x.disponivel).length,
          ativos: a.filter(x => x.status === 'ativo').length,
          reservados: a.filter(x => x.status === 'reservado').length,
          concluidos: a.filter(x => x.status === 'concluido').length,
          cancelados: a.filter(x => x.status === 'cancelado').length,
          totalClientes: clientes.items.length,
          receita,
        });
        setRecentRentals(a.slice(0, 8));
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard - Locação</h1>
        <p className="text-slate-600 mt-2">TCC - Gabriel Paulosi</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard testid="stat-total-veiculos" icon={Car} label="Total Veículos" value={stats.totalVeiculos} color="text-blue-600" bg="bg-blue-50" />
        <StatCard testid="stat-disponiveis" icon={CheckCircle} label="Disponíveis" value={stats.disponiveis} color="text-green-600" bg="bg-green-50" />
        <StatCard testid="stat-ativos" icon={Clock} label="Aluguéis Ativos" value={stats.ativos} color="text-amber-600" bg="bg-amber-50" />
        <StatCard testid="stat-receita" icon={DollarSign} label="Receita Total"
          value={stats.receita !== undefined ? `R$ ${stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : undefined}
          color="text-purple-600" bg="bg-purple-50"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard testid="stat-reservados" icon={FileText} label="Reservados" value={stats.reservados} color="text-amber-600" bg="bg-amber-50" />
        <StatCard testid="stat-concluidos" icon={TrendingUp} label="Concluídos" value={stats.concluidos} color="text-green-600" bg="bg-green-50" />
        <StatCard testid="stat-cancelados" icon={XCircle} label="Cancelados" value={stats.cancelados} color="text-red-600" bg="bg-red-50" />
        <StatCard testid="stat-clientes" icon={Users} label="Clientes" value={stats.totalClientes} color="text-slate-600" bg="bg-slate-100" />
      </div>

      {/* Recent rentals */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden" data-testid="recent-rentals">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold text-slate-900">Aluguéis Recentes</h3>
          <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{recentRentals.length} registros</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 w-full rounded" />)}
          </div>
        ) : recentRentals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Nenhum aluguel registrado ainda</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['#', 'Cliente', 'Veículo', 'Saída', 'Status', 'Valor'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRentals.map(r => <RecentRow key={r.id} rental={r} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}