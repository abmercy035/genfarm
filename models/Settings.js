import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    // Egg & Harvest Pricing (in Naira ₦)
    price_single_egg: { type: Number, default: 120 },
    price_crate_good: { type: Number, default: 3500 },
    price_single_cracked: { type: Number, default: 60 },
    price_crate_cracked: { type: Number, default: 1800 },

    // Feed Catalog & Unit Pricing
    feeds: [
      {
        name: { type: String, required: true },
        bagWeightKg: { type: Number, default: 25 },
        pricePerBag: { type: Number, default: 12500 },
        inStockBags: { type: Number, default: 100 }
      }
    ],

    // Medication & Supplies Catalog
    medications: [
      {
        name: { type: String, required: true },
        unitPrice: { type: Number, default: 2500 },
        inStockUnits: { type: Number, default: 50 }
      }
    ],

    // Bird Replacement & Valuation Rates (₦ per bird)
    birdValuations: [
      {
        type: { type: String, required: true }, // e.g. Layers, Broilers, Pullets
        unitValue: { type: Number, default: 3500 }
      }
    ],

    // Fixed Pen Infrastructure Worth (₦ per pen structure)
    defaultPenStructureValue: { type: Number, default: 450000 },

    // Payroll & Overhead (Monthly in ₦)
    staffPayroll: [
      {
        staffName: { type: String, required: true },
        roleTitle: { type: String, default: 'Attendant' },
        monthlySalary: { type: Number, default: 85000 }
      }
    ],

    // Tax rate percentage (e.g. 7.5% VAT / Corporate Tax)
    taxRatePercentage: { type: Number, default: 7.5 }
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
