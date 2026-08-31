import dbConnect from '@/lib/db';
import AccountingTransaction from '@/models/AccountingTransaction';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const transactions = await AccountingTransaction.find({}).sort({ date: -1 });

    // Financial calculations summary
    const totalSales = transactions
      .filter((t) => t.type === 'SALE' || t.type === 'OTHER_INCOME')
      .reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'EXPENSE' || t.type === 'PAYROLL_PAYMENT' || t.type === 'ASSET_PURCHASE')
      .reduce((acc, t) => acc + (t.amountPaid || t.amount || 0), 0);

    const pendingReceivables = transactions
      .filter((t) => (t.type === 'SALE' || t.type === 'OTHER_INCOME') && t.paymentStatus !== 'PAID')
      .reduce((acc, t) => acc + (t.amount - (t.amountPaid || 0)), 0);

    const pendingPayables = transactions
      .filter((t) => (t.type === 'EXPENSE' || t.type === 'ASSET_PURCHASE') && t.paymentStatus !== 'PAID')
      .reduce((acc, t) => acc + (t.amount - (t.amountPaid || 0)), 0);

    const netCashFlow = totalSales - totalExpenses;

    return NextResponse.json({
      success: true,
      data: transactions,
      summary: {
        totalSales,
        totalExpenses,
        pendingReceivables,
        pendingPayables,
        netCashFlow
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const user = await authenticate(request);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      category, 
      amount, 
      paymentMethod, 
      paymentStatus, 
      amountPaid, 
      customerOrVendor, 
      notes, 
      date,
      eggQuantityType,
      eggQuantityValue,
      unitPriceSnapshot
    } = body;

    if (!type || !category || !amount) {
      return NextResponse.json({ success: false, error: 'Type, category and amount are required.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    const numPaid = paymentStatus === 'PAID' ? numAmount : Number(amountPaid || 0);

    const refPrefix = type === 'SALE' ? 'INV' : 'EXP';
    const referenceNo = `${refPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Anti-Tampering Security Guard:
    let transactionDate = new Date();

    // Only Admin / Moderator can override the transaction date
    if (date && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      transactionDate = new Date(date);
    }

    const transaction = await AccountingTransaction.create({
      type,
      category,
      amount: numAmount,
      eggQuantityType: eggQuantityType || 'NONE',
      eggQuantityValue: eggQuantityValue ? Number(eggQuantityValue) : 0,
      unitPriceSnapshot: unitPriceSnapshot ? Number(unitPriceSnapshot) : 0,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      paymentStatus: paymentStatus || 'PAID',
      amountPaid: numPaid,
      customerOrVendor: customerOrVendor || 'General Client',
      referenceNo,
      date: transactionDate,
      loggedBy: user.name || 'Farm Accountant',
      notes
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
