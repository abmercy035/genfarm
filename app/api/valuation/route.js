import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import Pen from '@/models/Pen';
import Flock from '@/models/Flock';
import AccountingTransaction from '@/models/AccountingTransaction';
import DailyProductionLog from '@/models/DailyProductionLog';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }

    const pens = await Pen.find({});
    const flocks = await Flock.find({ status: { $ne: 'sold' } });
    const transactions = await AccountingTransaction.find({});
    const productionLogs = await DailyProductionLog.find({});

    // 1. Lifetime Historical Accounting Performance (From Day 1)
    const lifetimeIncome = transactions
      .filter((t) => t.type === 'SALE' || t.type === 'OTHER_INCOME')
      .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);

    const lifetimeExpenses = transactions
      .filter((t) => t.type === 'EXPENSE' || t.type === 'PAYROLL_PAYMENT' || t.type === 'ASSET_PURCHASE')
      .reduce((sum, t) => sum + (t.amountPaid || t.amount || 0), 0);

    const lifetimeNetProfit = lifetimeIncome - lifetimeExpenses;

    // 2. Margin Losses Breakdown (Damaged Eggs & Mortality Value Loss)
    const priceCrateGood = settings.price_crate_good || 3500;
    const priceCrateCracked = settings.price_crate_cracked || 1800;
    const singleEggGoodRate = Math.round(priceCrateGood / 30);
    const singleEggCrackedRate = Math.round(priceCrateCracked / 30);
    const crackMarginLossPerEgg = singleEggGoodRate - singleEggCrackedRate;

    const totalDamagedEggsCount = productionLogs.reduce((sum, l) => sum + (l.damagedEggs || 0), 0);
    const totalDamagedEggsLossVal = totalDamagedEggsCount * crackMarginLossPerEgg;

    const totalMortalityCount = productionLogs.reduce((sum, l) => sum + (l.mortality || 0) + (l.culls || 0), 0);
    const avgBirdCost = 3500;
    const totalMortalityLossVal = totalMortalityCount * avgBirdCost;

    const totalMarginLosses = totalDamagedEggsLossVal + totalMortalityLossVal;

    // 3. Average Production Growth Trend (Compares recent 7 days harvest vs prior 7 days harvest)
    const sortedLogs = productionLogs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent7Logs = sortedLogs.slice(0, 7);
    const prior7Logs = sortedLogs.slice(7, 14);

    const recentAvgHarvest = recent7Logs.length > 0
      ? Math.round(recent7Logs.reduce((sum, l) => sum + (l.goodEggs || 0), 0) / recent7Logs.length)
      : 0;

    const priorAvgHarvest = prior7Logs.length > 0
      ? Math.round(prior7Logs.reduce((sum, l) => sum + (l.goodEggs || 0), 0) / prior7Logs.length)
      : 0;

    let productionGrowthPercentage = 0;
    if (priorAvgHarvest > 0) {
      productionGrowthPercentage = Number((((recentAvgHarvest - priorAvgHarvest) / priorAvgHarvest) * 100).toFixed(1));
    }

    // Helper function to resolve valuation unit rate per bird
    const getUnitValueForFlock = (breedStr) => {
      const breed = (breedStr || '').toLowerCase();
      if (breed.includes('broiler') || breed.includes('cobb')) {
        const match = (settings.birdValuations || []).find(v => v.type.toLowerCase().includes('broiler'));
        return match ? match.unitValue : 2800;
      }
      const layerMatch = (settings.birdValuations || []).find(v => v.type.toLowerCase().includes('layer'));
      return layerMatch ? layerMatch.unitValue : 3500;
    };

    // 4. Live Bird Flock Asset Valuation with Age Depreciation
    let totalFlockValue = 0;
    let totalInitialFlockValue = 0;

    const flockValuationList = flocks.map((f) => {
      const baseUnitValue = getUnitValueForFlock(f.breed);

      let ageDepreciationFactor = 1.0;
      if (f.ageWeeks && f.ageWeeks > 50) {
        const excessWeeks = f.ageWeeks - 50;
        ageDepreciationFactor = Math.max(0.4, 1.0 - (excessWeeks * 0.015));
      }

      const depreciatedUnitValue = Math.round(baseUnitValue * ageDepreciationFactor);
      const currentValue = f.current_bird_count * depreciatedUnitValue;
      const initialValue = (f.initial_bird_count || f.current_bird_count) * baseUnitValue;

      totalFlockValue += currentValue;
      totalInitialFlockValue += initialValue;

      return {
        _id: f._id,
        name: f.name,
        breed: f.breed,
        ageWeeks: f.ageWeeks || 20,
        initial_bird_count: f.initial_bird_count || f.current_bird_count,
        current_bird_count: f.current_bird_count,
        baseUnitValue,
        unitValue: depreciatedUnitValue,
        ageDepreciationFactor: Math.round(ageDepreciationFactor * 100),
        totalValue: currentValue
      };
    });

    // 5. Feed Inventory Asset Worth
    let totalFeedStockValue = 0;
    const feedStockList = (settings.feeds || []).map((f) => {
      const val = (f.inStockBags || 0) * (f.pricePerBag || 0);
      totalFeedStockValue += val;
      return {
        name: f.name,
        inStockBags: f.inStockBags || 0,
        pricePerBag: f.pricePerBag || 0,
        totalValue: val
      };
    });

    // 6. Medication & Supplies Asset Worth
    let totalMedicationStockValue = 0;
    const medicationStockList = (settings.medications || []).map((m) => {
      const val = (m.inStockUnits || 0) * (m.unitPrice || 0);
      totalMedicationStockValue += val;
      return {
        name: m.name,
        inStockUnits: m.inStockUnits || 0,
        unitPrice: m.unitPrice || 0,
        totalValue: val
      };
    });

    // 7. Physical Housing Pen Infrastructure Worth
    const defaultPenStructVal = settings.defaultPenStructureValue || 450000;
    let totalPenInfrastructureValue = pens.length * defaultPenStructVal;

    const penWorthList = pens.map((pen) => {
      const assignedFlocks = flocks.filter((f) => f.penId && f.penId.toString() === pen._id.toString());
      const liveBirds = assignedFlocks.reduce((sum, f) => sum + (f.current_bird_count || 0), 0);

      const birdWorthInPen = assignedFlocks.reduce((sum, f) => {
        const unitVal = getUnitValueForFlock(f.breed);
        return sum + (f.current_bird_count * unitVal);
      }, 0);

      const totalPenWorth = defaultPenStructVal + birdWorthInPen;

      return {
        _id: pen._id,
        name: pen.name,
        location: pen.location,
        type: pen.type,
        capacity: pen.capacity,
        liveBirds,
        assignedFlockCount: assignedFlocks.length,
        structureValue: defaultPenStructVal,
        birdWorthInPen,
        totalPenWorth
      };
    });

    // 8. Total Enterprise Net Liquidation Worth & Seller Enterprise Sale Return Analysis
    const currentAssetLiquidationWorth = totalFlockValue + totalPenInfrastructureValue + totalFeedStockValue + totalMedicationStockValue;
    
    // Total Enterprise Return on Sale = (Current Liquidation Assets + Lifetime Accumulated Net Cash Flow) - Total Historical Capital Expenses
    const sellerLifetimeTotalReturn = (currentAssetLiquidationWorth + lifetimeIncome) - lifetimeExpenses;
    const isSellerProfitableOnSale = sellerLifetimeTotalReturn >= 0;

    return NextResponse.json({
      success: true,
      data: {
        totalEnterpriseWorth: currentAssetLiquidationWorth,
        lifetimePerformance: {
          lifetimeIncome,
          lifetimeExpenses,
          lifetimeNetProfit,
          sellerLifetimeTotalReturn,
          isSellerProfitableOnSale
        },
        marginLosses: {
          totalDamagedEggsCount,
          totalDamagedEggsLossVal,
          totalMortalityCount,
          totalMortalityLossVal,
          totalMarginLosses
        },
        productionTrend: {
          recentAvgHarvest,
          priorAvgHarvest,
          productionGrowthPercentage,
          isGrowing: productionGrowthPercentage >= 0
        },
        breakdown: {
          totalFlockValue,
          totalFeedStockValue,
          totalMedicationStockValue,
          totalPenInfrastructureValue
        },
        penWorthList,
        flockValuationList,
        feedStockList,
        medicationStockList
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
