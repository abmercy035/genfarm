import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import AccountingTransaction from '@/models/AccountingTransaction';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }

    // Fetch official posted accounting transactions (sales & expenses)
    const transactions = await AccountingTransaction.find({}).sort({ date: 1 });

    // Calculate actual sales revenue from completed/partial sales invoices
    const salesTransactions = transactions.filter(t => t.type === 'SALE' || t.type === 'OTHER_INCOME');
    const totalGrossRevenue = salesTransactions.reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    // Calculate actual operating expenses (Feed, Supplies, Maintenance, etc.)
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE' || t.type === 'ASSET_PURCHASE');
    const totalOperatingExpenses = expenseTransactions.reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    // Calculate payroll payments
    const payrollTransactions = transactions.filter(t => t.type === 'PAYROLL_PAYMENT');
    const totalMonthlyPayroll = payrollTransactions.length > 0
      ? payrollTransactions.reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0)
      : (settings.staffPayroll || []).reduce((acc, p) => acc + (p.monthlySalary || 0), 0);

    const estTax = (totalGrossRevenue * (settings.taxRatePercentage || 7.5)) / 100;
    const totalExpenses = totalOperatingExpenses + totalMonthlyPayroll + estTax;
    const netProfit = totalGrossRevenue - totalExpenses;

    // Timeline Chart Data (Grouped by date)
    const timelineMap = {};

    transactions.forEach((t) => {
      const dateStr = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { date: dateStr, revenue: 0, expenses: 0, profit: 0 };
      }

      const val = t.amountPaid || t.amount || 0;
      if (t.type === 'SALE' || t.type === 'OTHER_INCOME') {
        timelineMap[dateStr].revenue += val;
      } else {
        timelineMap[dateStr].expenses += val;
      }
    });

    const chartData = Object.values(timelineMap).map(item => ({
      ...item,
      profit: item.revenue - item.expenses
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalGrossRevenue,
          totalFeedCost: totalOperatingExpenses,
          totalMonthlyPayroll,
          estTax,
          totalExpenses,
          netProfit
        },
        chartData
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
