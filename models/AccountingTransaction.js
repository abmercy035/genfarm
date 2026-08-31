import mongoose from 'mongoose';

const AccountingTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['SALE', 'EXPENSE', 'PAYROLL_PAYMENT', 'ASSET_PURCHASE', 'OTHER_INCOME'],
      required: true
    },
    category: {
      type: String,
      enum: [
        'Egg Sales (Good Crates)',
        'Egg Sales (Loose Good)',
        'Egg Sales (Cracked Crates)',
        'Egg Sales (Cracked Loose)',
        'Cull / Spent Hen Sales',
        'Manure / Waste Sales',
        'Flock Purchase / Bird Acquisition',
        'Feed Purchase',
        'Medication & Vaccines',
        'Staff Salary & Wages',
        'Equipment & Maintenance',
        'Utilities & Fuel',
        'Other Operating Expense'
      ],
      required: true
    },
    eggQuantityType: {
      type: String,
      enum: ['CRATES', 'COUNT', 'NONE'],
      default: 'NONE'
    },
    eggQuantityValue: {
      type: Number,
      default: 0
    },
    unitPriceSnapshot: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'],
      default: 'BANK_TRANSFER'
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'PARTIAL'],
      default: 'PAID'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    customerOrVendor: {
      type: String,
      default: 'General Customer'
    },
    referenceNo: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    loggedBy: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    // Audit & Anti-Tampering Flagging fields for Admin / Moderator
    isFlagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: {
      type: String,
      default: null
    },
    adminComment: {
      type: String,
      default: ''
    },
    dateModifiedByAdmin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.models.AccountingTransaction ||
  mongoose.model('AccountingTransaction', AccountingTransactionSchema);
