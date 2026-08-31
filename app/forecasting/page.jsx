'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Calculator, Egg, Wheat, DollarSign, TrendingUp, Sliders } from 'lucide-react';

export default function PredictiveCalculatorPage() {
  const [liveBirds, setLiveBirds] = useState(1500);
  const [daysAhead, setDaysAhead] = useState(7);
  const [hdepPct, setHdepPct] = useState(86);
  const [gramsPerBird, setGramsPerBird] = useState(115); // avg daily feed grams
  const [cratePrice, setCratePrice] = useState(3500); // e.g. local currency per crate
  const [bagCost, setBagCost] = useState(12500); // cost per 25kg bag

  // Calculated Outputs
  const projections = useMemo(() => {
    const totalBirdDays = liveBirds * daysAhead;
    
    // Total eggs
    const totalEggs = Math.floor(liveBirds * (hdepPct / 100) * daysAhead);
    const crates = Math.floor(totalEggs / 30);
    const looseEggs = totalEggs % 30;

    // Projected Feed Consumption
    const totalFeedGrams = totalBirdDays * gramsPerBird;
    const totalFeedKg = (totalFeedGrams / 1000).toFixed(1);
    const bagsNeeded = Math.ceil(totalFeedKg / 25);

    // Revenue & Feed Expenses
    const estimatedRevenue = crates * cratePrice;
    const estimatedFeedCost = bagsNeeded * bagCost;
    const projectedMargin = estimatedRevenue - estimatedFeedCost;

    return {
      totalEggs,
      crates,
      looseEggs,
      totalFeedKg,
      bagsNeeded,
      estimatedRevenue,
      estimatedFeedCost,
      projectedMargin
    };
  }, [liveBirds, daysAhead, hdepPct, gramsPerBird, cratePrice, bagCost]);

  return (
    <div className="flex-1 flex flex-col pt-14 lg:pt-0">
      <Navbar title="Predictive Production & Feed Calculator" />

      <main className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-700" />
              <span>Flock Projections & Feed Conversion Planner</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Simulate feed consumption, expected egg harvests, and gross revenue based on rolling Hen-Day production.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b pb-3">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Simulation Parameters</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Birds & Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Active Flock Birds</label>
                  <input
                    type="number"
                    value={liveBirds}
                    onChange={(e) => setLiveBirds(Number(e.target.value) || 0)}
                    className="w-full h-11 text-center font-extrabold text-base border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timeline (Days)</label>
                  <input
                    type="number"
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(Number(e.target.value) || 1)}
                    className="w-full h-11 text-center font-extrabold text-base border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
              </div>

              {/* HDEP & Grams */}
              <div className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-amber-900">Expected HDEP % Yield: {hdepPct}%</label>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={hdepPct}
                  onChange={(e) => setHdepPct(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="space-y-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-emerald-900">Avg Grams Feed / Bird / Day: {gramsPerBird}g</label>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={gramsPerBird}
                  onChange={(e) => setGramsPerBird(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>

              {/* Pricing Assumptions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-600">Egg Price / Crate (₦)</label>
                  <input
                    type="number"
                    value={cratePrice}
                    onChange={(e) => setCratePrice(Number(e.target.value) || 0)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600">Feed Price / Bag (₦)</label>
                  <input
                    type="number"
                    value={bagCost}
                    onChange={(e) => setBagCost(Number(e.target.value) || 0)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Forecast Output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center justify-between">
                <span>Projected Yield ({daysAhead} Days)</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full">
                  Automated Projections
                </span>
              </h3>

              {/* Egg Yield Banner */}
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Projected Egg Production</p>
                  <h4 className="text-3xl font-black text-amber-950">
                    {projections.crates.toLocaleString()} Crates + {projections.looseEggs} loose
                  </h4>
                  <p className="text-xs text-amber-700 font-medium">
                    Total: {projections.totalEggs.toLocaleString()} individual eggs collected
                  </p>
                </div>
                <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-xl">
                  <Egg className="w-8 h-8" />
                </div>
              </div>

              {/* Feed Requirements Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Feed Required</p>
                  <h4 className="text-3xl font-black text-emerald-950">
                    {projections.bagsNeeded} Bags <span className="text-base font-semibold">({projections.totalFeedKg} kg)</span>
                  </h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    Based on standard 25kg layer bags @ {gramsPerBird}g/bird daily intake
                  </p>
                </div>
                <div className="p-4 bg-emerald-700 text-white rounded-2xl font-black text-xl">
                  <Wheat className="w-8 h-8" />
                </div>
              </div>

              {/* Financial Margin Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Gross Margin</span>
                  <span className="text-xs font-semibold text-emerald-400">Egg Revenue - Feed Expenses</span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[11px] text-slate-400">Egg Revenue</p>
                    <p className="text-lg font-extrabold text-amber-400">₦{projections.estimatedRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Feed Cost</p>
                    <p className="text-lg font-extrabold text-rose-400">₦{projections.estimatedFeedCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Est. Profit Margin</p>
                    <p className="text-xl font-black text-emerald-400">₦{projections.projectedMargin.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
