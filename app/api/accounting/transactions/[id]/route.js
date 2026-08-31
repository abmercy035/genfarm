import dbConnect from '@/lib/db';
import AccountingTransaction from '@/models/AccountingTransaction';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const user = await authenticate(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const transaction = await AccountingTransaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaction record not found.' }, { status: 404 });
    }

    // Admin can update date, notes, flag status, and adminComment
    if (body.date) {
      transaction.date = new Date(body.date);
      transaction.dateModifiedByAdmin = new Date();
    }
    if (body.notes !== undefined) transaction.notes = body.notes;
    if (body.isFlagged !== undefined) {
      transaction.isFlagged = body.isFlagged;
      transaction.flaggedBy = body.isFlagged ? user.name : null;
    }
    if (body.adminComment !== undefined) transaction.adminComment = body.adminComment;
    if (body.amount !== undefined) transaction.amount = Number(body.amount);
    if (body.paymentStatus !== undefined) transaction.paymentStatus = body.paymentStatus;
    if (body.amountPaid !== undefined) transaction.amountPaid = Number(body.amountPaid);

    await transaction.save();

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const user = await authenticate(request);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    await AccountingTransaction.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Transaction record deleted by Admin.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
