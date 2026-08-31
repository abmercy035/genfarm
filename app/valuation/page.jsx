'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Landmark, Home, Users, Wheat, Pill, Award, ArrowUpRight } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ValuationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchValuation();
  }, []);

  const fetchValuation = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/valuation');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to load asset valuation', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col pt-14 lg:pt-0">
        <Navbar title="Poultry Enterprise Worth & Asset Valuation" />
        <div className="p-8 text-center text-slate-400 text-xs">Computing full poultry farm asset valuation...</div>
      </div>
    );
  }

  const {
    totalEnterpriseWorth,
    depreciationSummary,
    lifetimePerformance,
    marginLosses,
    productionTrend,
    breakdown,
    penWorthList,
    flockValuationList,
    feedStockList,
    medicationStockList
  } = data;

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Poultry Enterprise Evaluation & Asset Liquidation Worth" />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Net Worth & Seller Liquidation ROI Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Enterprise Valuation & Sale Analysis
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Total Poultry Enterprise Liquidation Worth</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive evaluation of current physical assets, lifetime historical net cash flow (from Day 1), and seller return on sale.
              </p>
            </div>

            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl hidden sm:block">
              <Landmark className="w-8 h-8" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <span className="text-xs text-slate-400 font-semibold">Total Estimated Farm Net Worth:</span>
              <h3 className="text-3xl font-black text-emerald-400 mt-0.5">
                ₦{totalEnterpriseWorth.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400">Physical coops, live birds & inventory</p>
            </div>

            {lifetimePerformance && (
              <div>
                <span className="text-xs text-slate-400 font-semibold">Seller Return On Farm Sale (From Day 1):</span>
                <h3 className={`text-2xl font-black mt-0.5 ${
                  lifetimePerformance.isSellerProfitableOnSale ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  ₦{lifetimePerformance.sellerLifetimeTotalReturn.toLocaleString()}
                </h3>
                <p className="text-[10px] text-slate-400">Current Liquidation Worth + Lifetime Net Income - Expenses</p>
              </div>
            )}

            {lifetimePerformance && (
              <div className="flex md:justify-end">
                <span className={`px-4 py-2 font-black text-xs rounded-xl border flex items-center gap-1.5 uppercase ${
                  lifetimePerformance.isSellerProfitableOnSale
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {lifetimePerformance.isSellerProfitableOnSale ? 'Seller Net Gain on Sale' : 'Seller Loss on Sale'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enterprise Evaluation Metrics Cards (Profit, Margin Losses & Produce Growth) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Lifetime Income vs Expense */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Lifetime Net Profit (Day 1 to Date)
            </span>
            <h3 className={`text-2xl font-black ${
              (lifetimePerformance?.lifetimeNetProfit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              ₦{(lifetimePerformance?.lifetimeNetProfit || 0).toLocaleString()}
            </h3>
            <div className="text-[10px] text-slate-500 font-medium space-y-0.5 pt-1 border-t border-slate-100">
              <p>Total Sales Income: <span className="font-bold text-emerald-800">₦{(lifetimePerformance?.lifetimeIncome || 0).toLocaleString()}</span></p>
              <p>Total Capital Expenses: <span className="font-bold text-rose-700">₦{(lifetimePerformance?.lifetimeExpenses || 0).toLocaleString()}</span></p>
            </div>
          </div>

          {/* Margin Losses Breakdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-rose-700">
              Accumulated Margin Losses
            </span>
            <h3 className="text-2xl font-black text-rose-600">
              -₦{(marginLosses?.totalMarginLosses || 0).toLocaleString()}
            </h3>
            <div className="text-[10px] text-slate-500 font-medium space-y-0.5 pt-1 border-t border-slate-100">
              <p>Egg Cracks Loss: <span className="font-bold text-slate-800">{marginLosses?.totalDamagedEggsCount || 0} eggs (-₦{(marginLosses?.totalDamagedEggsLossVal || 0).toLocaleString()})</span></p>
              <p>Mortality Loss: <span className="font-bold text-rose-700">{marginLosses?.totalMortalityCount || 0} dead (-₦{(marginLosses?.totalMortalityLossVal || 0).toLocaleString()})</span></p>
            </div>
          </div>

          {/* Average Increase in Produce Trend */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-blue-700">
              Produce Yield Growth Trend
            </span>
            <h3 className={`text-2xl font-black ${
              (productionTrend?.productionGrowthPercentage || 0) >= 0 ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {(productionTrend?.productionGrowthPercentage || 0) >= 0 ? '+' : ''}
              {productionTrend?.productionGrowthPercentage || 0}% Growth
            </h3>
            <div className="text-[10px] text-slate-500 font-medium space-y-0.5 pt-1 border-t border-slate-100">
              <p>Recent Avg Daily Harvest: <span className="font-bold text-slate-900">{productionTrend?.recentAvgHarvest || 0} eggs/day</span></p>
              <p>Prior Avg Daily Harvest: <span className="font-bold text-slate-600">{productionTrend?.priorAvgHarvest || 0} eggs/day</span></p>
            </div>
          </div>
        </div>

        {/* 4 Asset Category Worth Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              Live Flock Valuation
            </span>
            <h3 className="text-xl font-black text-purple-900">₦{breakdown.totalFlockValue.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500">Valuation adjusted for flock age & count</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              Housing Infrastructure
            </span>
            <h3 className="text-xl font-black text-emerald-800">₦{breakdown.totalPenInfrastructureValue.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500">Physical coops & shed structures</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Wheat className="w-3.5 h-3.5 text-amber-600" />
              Feed Stock Valuation
            </span>
            <h3 className="text-xl font-black text-amber-900">₦{breakdown.totalFeedStockValue.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500">Value of feed bags in inventory</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              Medical Supplies Worth
            </span>
            <h3 className="text-xl font-black text-blue-900">₦{breakdown.totalMedicationStockValue.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-500">Vaccines & pharmaceuticals</p>
          </div>
        </div>

        {/* Flock Age & Depreciation Breakdown Table */}
        {flockValuationList && flockValuationList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Flock Asset Valuation & Depreciation Curve</span>
                </h3>
                <p className="text-[11px] text-slate-500">Live flock worth adjusted for age degradation and mortality loss.</p>
              </div>

              {depreciationSummary?.totalMortalityDepreciationLoss > 0 && (
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-200">
                  Mortality Valuation Loss: -₦{depreciationSummary.totalMortalityDepreciationLoss.toLocaleString()}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Flock Batch</th>
                    <th className="pb-2">Breed</th>
                    <th className="pb-2">Age</th>
                    <th className="pb-2">Live Count</th>
                    <th className="pb-2">Base Rate</th>
                    <th className="pb-2">Age Value Rate</th>
                    <th className="pb-2 text-right">Total Asset Worth (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {flockValuationList.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3 text-slate-600">{f.breed}</td>
                      <td className="py-3 font-semibold text-slate-800">{f.ageWeeks} wks</td>
                      <td className="py-3 font-bold text-slate-900">{f.current_bird_count} birds</td>
                      <td className="py-3 text-slate-400 line-through">₦{f.baseUnitValue?.toLocaleString()}</td>
                      <td className="py-3 font-extrabold text-purple-800">
                        ₦{f.unitValue?.toLocaleString()}
                        {f.ageDepreciationFactor < 100 && (
                          <span className="ml-1 text-[10px] text-rose-600 font-bold">
                            ({f.ageDepreciationFactor}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-black text-purple-950">
                        ₦{f.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Individual Housing Pen Worth Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Housing Pen Individual Asset Valuation</h3>
            <p className="text-[11px] text-slate-500">Worth per pen enclosure combining structure value and housed bird stock.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {penWorthList.map((pen) => (
              <div key={pen._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-start border-b border-slate-200/80 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pen.name}</h4>
                    <p className="text-[10px] text-slate-500">{pen.location} • {pen.type}</p>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ₦{pen.totalPenWorth.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pen Structure Value:</span>
                    <span className="font-bold text-slate-800">₦{pen.structureValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Housed Birds:</span>
                    <span className="font-bold text-slate-900">{pen.liveBirds} / {pen.capacity} birds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bird Stock Value:</span>
                    <span className="font-extrabold text-purple-900">₦{pen.birdWorthInPen.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Stock Asset Valuation Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feed Stock Valuation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Wheat className="w-4 h-4 text-amber-600" />
              <span>Feed Inventory Stock Worth</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Feed Formula</th>
                    <th className="pb-2">Bags in Stock</th>
                    <th className="pb-2 text-right">Value (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {feedStockList.map((f, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-bold text-slate-800">{f.name}</td>
                      <td className="py-2.5">{f.inStockBags} Bags</td>
                      <td className="py-2.5 text-right font-extrabold text-amber-900">
                        ₦{f.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Supplies Valuation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Medical Supplies Stock Worth</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Medicine / Vaccine</th>
                    <th className="pb-2">Stock Units</th>
                    <th className="pb-2 text-right">Value (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {medicationStockList.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-bold text-slate-800">{m.name}</td>
                      <td className="py-2.5">{m.inStockUnits} Units</td>
                      <td className="py-2.5 text-right font-extrabold text-blue-900">
                        ₦{m.totalValue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
