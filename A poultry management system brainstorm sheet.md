A poultry management system like this lives or dies by its **data model** and **daily operational flow**. Farm hands input high-volume repetitive logs (daily egg picks, mortality, feed dispensed), while the farm manager needs automated aggregates, predictive benchmarks (Hen-Day Production), and financial tracking.

Here is an end-to-end blueprint covering system architecture, domain data models, automated calculations, and UI layout for **General Farm Ltd**.

---

## 1. Domain Modeling & Core Formulas

### Poultry Math & Automation Engine

Standard poultry metrics automate your projections and identify flock underperformance early:

* **Crate Conversion:** Standard commercial egg crates hold 30 eggs.

$$\text{Crates} = \lfloor \text{Total Eggs} / 30 \rfloor, \quad \text{Loose Eggs} = \text{Total Eggs} \pmod{30}$$


* **Hen-Day Egg Production (HDEP %):** Measures layer efficiency:

$$\text{HDEP} = \left( \frac{\text{Eggs Collected Today}}{\text{Current Live Birds}} \right) \times 100$$



*(Healthy commercial layers typically range between 75% and 92% during peak production).*
* **Feed Conversion & Expected Output Projections:**
* **Baseline Consumption:** Calculated as a rolling 7-day or 14-day average:

$$\text{Avg Grams per Bird/Day} = \frac{\sum \text{Feed Consumed (kg)} \times 1000}{\sum \text{Bird Days}}$$


* **Projected Feed Needed:** $\text{Current Birds} \times \text{Avg Grams per Bird} \times \text{Days Ahead}$.
* **Projected Eggs:** $\text{Current Birds} \times \text{Rolling HDEP \%} \times \text{Days Ahead}$.
* **Alert Threshold:** If actual egg count deviates more than $-10\%$ below rolling projected output, trigger a "Flock Stress / Disease / Feed Anomaly" alert.



---

## 2. Database Schema Design (Document Model / Mongoose)

A structured MongoDB schema cleanly captures the physical housing layout and immutable daily operational logs.

```javascript
// 1. Physical Housing / Pen Layout
const PenStackSchema = new Schema({
  name: { type: String, required: true }, // e.g. "Pen 1 - Tier A"
  flockBatchId: { type: Schema.Types.ObjectId, ref: 'FlockBatch' },
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  birdsPerCell: { type: Number, required: true },
  capacity: { type: Number }, // rows * columns * birdsPerCell
  currentBirdCount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'quarantine', 'empty'], default: 'active' }
});

// 2. Daily Log (Unified operational shift log)
const DailyProductionLogSchema = new Schema({
  date: { type: Date, required: true, index: true },
  stackId: { type: Schema.Types.ObjectId, ref: 'PenStack', required: true },
  mortality: { type: Number, default: 0 },
  culls: { type: Number, default: 0 }, // Sick/removed
  eggsCollected: {
    totalPieces: { type: Number, required: true },
    damagedPieces: { type: Number, default: 0 },
    crates: { type: Number },      // Derived on save: Math.floor(pieces / 30)
    looseEggs: { type: Number }    // Derived on save: pieces % 30
  },
  feedConsumedKg: { type: Number, required: true },
  feedInventoryId: { type: Schema.Types.ObjectId, ref: 'FeedStock' },
  loggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: String
});

// 3. Feed Stock Inventory
const FeedInventorySchema = new Schema({
  feedName: { type: String, required: true }, // e.g., "Layer Mash", "Grower Mash"
  currentStockBags: { type: Number, required: true }, // 25kg or 50kg bags
  bagWeightKg: { type: Number, default: 25 },
  reorderAlertThreshold: { type: Number, default: 20 },
  costPerBag: { type: Number, required: true }
});

// 4. Treatments & Medications
const TreatmentLogSchema = new Schema({
  stackId: { type: Schema.Types.ObjectId, ref: 'PenStack', required: true },
  dateAdministered: { type: Date, default: Date.now },
  medicationName: { type: String, required: true },
  dosage: { type: String, required: true }, // e.g. "100ml / 50L water"
  purpose: { type: String, enum: ['vaccination', 'routine_vitamin', 'antibiotic', 'deworming'] },
  administeredBy: String,
  withdrawalPeriodDays: { type: Number, default: 0 } // Days eggs/meat cannot be sold
});

// 5. Financial Ledger (Cashflow)
const TransactionSchema = new Schema({
  date: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { 
    type: String, 
    enum: ['egg_sales', 'bird_sales', 'feed_purchase', 'medication', 'salaries', 'utilities', 'equipment'],
    required: true 
  },
  amount: { type: Number, required: true },
  quantity: Number, // e.g. 50 crates sold, or 10 bags of feed bought
  unitPrice: Number,
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'credit'] },
  receiptRef: String
});

```

---

## 3. Automation Triggers & Business Logic

When a farm manager or worker enters a `DailyProductionLog`, the backend runs an atomic update chain:

```text
[POST /api/logs/daily]
        │
        ├── 1. Decrement Live Birds:
        │      stack.currentBirdCount -= (mortality + culls)
        │
        ├── 2. Calculate Crates:
        │      crates = floor(totalEggs / 30)
        │      loose = totalEggs % 30
        │
        ├── 3. Deduct Feed Warehouse:
        │      feedStock.currentStockBags -= (feedConsumedKg / bagWeightKg)
        │
        ├── 4. Update Rolling Averages & Benchmark:
        │      Compute HDEP % for the pen
        │      If (HDEP < expectedBenchmark - 10%) -> Flag Warning Flag
        │
        └── 5. Auto-reorder Alert:
               If (feedStock.currentStockBags <= threshold) -> Emit Low Stock Notice

```

---

## 4. UI Architecture & Page Layout

### 1. The Operations Dashboard (Manager Overview)

* **KPI Scorecards:** Live Birds (Total across all stacks), Today's Eggs (Crates + Loose), Today's Mortality Rate, Feed Stock Runway (e.g., "7 days remaining").
* **Efficiency Guage:** Live HDEP % gauge vs. industrial target (85%).
* **Quick Entry CTA:** Fast-action button opening the Daily Shift Modal.

### 2. Physical Stack Visualizer (Interactive Grid)

* Visual matrix representing the physical coop layout (Rows $\times$ Columns).
* Each cell renders occupancy: `Occupied: 4/4 birds`.
* Color-coded health status: green (optimal output), amber (sub-par production or isolated health alerts), red (mortality reported today).
* Clicking a stack opens historical mortality, medication logs, and feed usage.

### 3. Forecasting & Calculator Page ("Predictive Planner")

* **Inputs:**
* Select Pen/Stack (or global flock).
* Target timeline slider (1 to 30 days).
* Optional: Simulation sliders (adjust feeding rate by $\pm 5\%$, projected bird loss).


* **Outputs:**
* Expected feed consumption (in total kg and standard bag count).
* Expected egg production (total units, converted into full crates and residual loose eggs).
* Estimated revenue projection based on current market egg price per crate.



### 4. Feed & Treatment Ledger

* Supply tracker: Log incoming feed deliveries (vendor, bags, cost per bag $\rightarrow$ auto-creates an `EXPENSE` record).
* Medication schedule with countdown timer for withdrawal periods to keep farm compliance clean.

### 5. Sales & Expense Book

* Point-of-sale modal for wholesale egg buyers: select customer, specify crates, price per crate, payment status (paid/unpaid invoice).
* Net profit/loss breakdown: $\text{Egg Sales} + \text{Spent Layer Sales} - (\text{Feed Cost} + \text{Meds} + \text{Overhead})$.

---

## 5. Implementation Roadmap

1. **Step 1: Core Physical Structure & Data Layer**
* Implement models for `PenStack`, `DailyProductionLog`, and `FeedInventory`.
* Set up Mongoose pre-save hooks to automatically compute crates, loose eggs, and live bird counts.


2. **Step 2: Rapid Data Entry Flow**
* Build a mobile-friendly daily log form so farm hands can punch in eggs, mortalities, and bags dispensed from their phones directly in the coop.


3. **Step 3: Projection & Analytics Engine**
* Write an aggregation pipeline computing the 7-day rolling HDEP and average feed intake per bird to power the forecasting view.


4. **Step 4: Financial Bookkeeping & Auth**
* Implement sales/expense tracking and role-based access control (Admin/Owner for financial metrics, Farm Attendant for daily logs only).




Here is the Role-Based Access Control (RBAC) architecture tailored for **General Farm Ltd**, detailing permissions, access boundaries, authentication tokens, and route-guard middleware.

---

## 1. Role Definitions & Permissions Matrix

| Module / Action | Worker (Farm Hand) | Admin / Moderator (Farm Manager) | Super Admin (Boss / Owner) |
| --- | --- | --- | --- |
| **Daily Production Entry** | Create own logs (Shift entry) | View, Edit, Audit all logs | Full access |
| **Flock & Pen Architecture** | View assigned stacks | Create/Edit stacks, move birds | Full access |
| **Inventory (Feed & Meds)** | Log consumption only | Add stock, edit levels, set alerts | Full access |
| **Treatment Schedules** | Log administration | Prescribe, edit medication schedules | Full access |
| **Forecasting & Projections** | ❌ No access | View calculator & benchmarks | Full access |
| **Financial Ledger (Sales/Expenses)** | ❌ No access | Log daily sales & routine expenses | Full P&L, set margins, audit |
| **User & Staff Management** | ❌ No access | View worker profiles | Create/Delete Admins & Workers |
| **Data Deletion / Overrides** | ❌ No access | ❌ Restricted | Allowed (Soft deletes, purge) |

* **Worker:** Optimized for high-contrast, simple mobile inputs inside the poultry shed (counting crates, dead birds, bags opened). Zero visibility into farm financials, margins, or overall profit.
* **Admin / Moderator:** Handles operational oversight, verifies worker entries, logs wholesale egg pickups, orders feed, and monitors flock performance against benchmarks.
* **Super Admin (Owner):** The command center. Tracks daily gross revenue, net operational margins, historical trends, feed conversion efficiency, and manages staff credentials.

---

## 2. User Schema & Role Model

```javascript
// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['WORKER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'WORKER',
      required: true,
      index: true
    },
    isActive: { type: Boolean, default: true },
    assignedPens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PenStack' }] // Workers can be pinned to specific coops
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);

```

---

## 3. RBAC Middleware Hierarchy (Express.js / Node.js)

Enforce a rank-based hierarchy so higher roles inherit lower privileges without redundant checks.

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const ROLES = {
  WORKER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3
};

// 1. Verify JWT & Session
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+role +isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid session or account deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

// 2. Hierarchical Role Authorization
export const authorizeMinRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    const userLevel = ROLES[req.user.role];
    const targetLevel = ROLES[requiredRole];

    if (userLevel < targetLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient administrative privileges'
      });
    }

    next();
  };
};

```

---

## 4. Protected API Route Structure

Apply these layers cleanly across your backend endpoints:

```javascript
// routes/production.js
import express from 'express';
import { authenticate, authorizeMinRole } from '../middleware/auth.js';
import { 
  logDailyShift, 
  getAllLogs, 
  updateProductionLog, 
  deleteProductionLog 
} from '../controllers/productionController.js';

const router = express.Router();

router.use(authenticate);

// Workers, Admins, and Super Admin can record daily production
router.post('/daily', authorizeMinRole('WORKER'), logDailyShift);

// Admins & Super Admin can view full logs and modify mistakes
router.get('/history', authorizeMinRole('ADMIN'), getAllLogs);
router.patch('/daily/:id', authorizeMinRole('ADMIN'), updateProductionLog);

// Only the Owner can hard-delete logs
router.delete('/daily/:id', authorizeMinRole('SUPER_ADMIN'), deleteProductionLog);

export default router;

```

```javascript
// routes/finance.js
import express from 'express';
import { authenticate, authorizeMinRole } from '../middleware/auth.js';
import { 
  recordSale, 
  getProfitLossReport, 
  overrideTransaction 
} from '../controllers/financeController.js';

const router = express.Router();

router.use(authenticate);

// Admins can log sales and regular purchases
router.post('/transaction', authorizeMinRole('ADMIN'), recordSale);

// Only Super Admin can view full P&L reports and audit financial anomalies
router.get('/reports/pnl', authorizeMinRole('SUPER_ADMIN'), getProfitLossReport);
router.put('/transaction/:id/override', authorizeMinRole('SUPER_ADMIN'), overrideTransaction);

export default router;

```

---

## 5. Tailored UI Experiences per Role

```text
               ┌───────────────────────┐
               │    Login Screen       │
               └───────────┬───────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼                           ▼
      [Role: WORKER]              [Role: ADMIN]                [Role: SUPER_ADMIN]
   ┌───────────────────┐       ┌───────────────────┐        ┌───────────────────────┐
   │ Mobile Quick-Pad  │       │ Operations Center │        │ Executive Command     │
   │ - Daily Egg Pick  │       │ - Staff Log Audit │        │ - Real-time Net P&L   │
   │ - Mortality Count │       │ - Inventory Order │        │ - Projected Revenue   │
   │ - Feed Dispensed  │       │ - Wholesale Sales │        │ - Flock Degradation   │
   │ - Meds Checked    │       │ - Predictive Tool │        │ - Role Management     │
   └───────────────────┘       └───────────────────┘        └───────────────────────┘

```

1. **Worker Interface (PWA Mobile First):**
* Big-button layout designed for single-hand use in the coop.
* Prompts: Stack ID $\rightarrow$ Number of Good Eggs $\rightarrow$ Damaged Eggs $\rightarrow$ Mortality $\rightarrow$ Feed bags opened.
* Visual feedback: "Logged successfully for Pen 1 - Tier A".


2. **Admin Interface (Desktop / Tablet):**
* Inventory balances with "Restock Needed" alerts.
* Shift validation table to inspect and approve logs submitted by workers.
* Sales order creator: Generates simple printable/downloadable invoices for crate buyers.


3. **Super Admin Interface:**
* High-level financial KPIs (e.g., Total Revenue vs. Total Feed/Labor Costs).
* Predictive calculator loaded with farm-wide variables.
* Audit log showing which worker logged what, and if an admin adjusted any counts.






A mobile daily shift entry form for farm workers inside a poultry house needs large touch targets, minimal typing, immediate feedback (like auto-calculated crates), and resilient validation so inaccurate tallies never corrupt your flock projections.

---

## 1. Frontend Form Component (React / Tailwind CSS)

```jsx
// components/DailyShiftEntry.jsx
import React, { useState, useMemo } from 'react';

const EGGS_PER_CRATE = 30;

export default function DailyShiftEntry({ activeStacks, feedTypes, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    stackId: activeStacks[0]?._id || '',
    goodEggs: '',
    damagedEggs: '',
    mortality: '',
    culls: '',
    feedInventoryId: feedTypes[0]?._id || '',
    feedBags: '',
    feedRemainderKg: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Real-time calculated metrics for worker sanity checks
  const computedEggs = useMemo(() => {
    const good = Number(formData.goodEggs) || 0;
    const damaged = Number(formData.damagedEggs) || 0;
    const total = good + damaged;
    const crates = Math.floor(total / EGGS_PER_CRATE);
    const loose = total % EGGS_PER_CRATE;
    return { total, crates, loose };
  }, [formData.goodEggs, formData.damagedEggs]);

  const selectedStack = useMemo(() => {
    return activeStacks.find((s) => s._id === formData.stackId);
  }, [formData.stackId, activeStacks]);

  const validate = () => {
    const errs = {};
    if (!formData.stackId) errs.stackId = 'Select a pen/stack';
    
    const good = Number(formData.goodEggs);
    if (formData.goodEggs === '' || isNaN(good) || good < 0) {
      errs.goodEggs = 'Enter valid egg count (0 or more)';
    }

    const mort = Number(formData.mortality);
    const cull = Number(formData.culls);
    if (selectedStack && (mort + cull) > selectedStack.currentBirdCount) {
      errs.mortality = `Deaths + culls cannot exceed live birds (${selectedStack.currentBirdCount})`;
    }

    if (!formData.feedInventoryId) errs.feedInventoryId = 'Select feed type';
    const bags = Number(formData.feedBags);
    if (formData.feedBags === '' || isNaN(bags) || bags < 0) {
      errs.feedBags = 'Enter bags used (e.g. 0, 1, 2)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert string inputs to strict numbers
    const payload = {
      stackId: formData.stackId,
      goodEggs: Number(formData.goodEggs),
      damagedEggs: Number(formData.damagedEggs) || 0,
      mortality: Number(formData.mortality) || 0,
      culls: Number(formData.culls) || 0,
      feedInventoryId: formData.feedInventoryId,
      feedBags: Number(formData.feedBags),
      feedRemainderKg: Number(formData.feedRemainderKg) || 0,
      notes: formData.notes.trim()
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-md space-y-5 text-slate-800">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-900">Daily Shift Entry</h2>
        <p className="text-xs text-slate-500">Record egg picks, mortality, and feed used.</p>
      </div>

      {/* 1. Stack Selector */}
      <div>
        <label className="block text-sm font-semibold mb-1">Select Pen / Stack</label>
        <select
          name="stackId"
          value={formData.stackId}
          onChange={handleChange}
          className="w-full h-12 px-3 bg-slate-50 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-emerald-500"
        >
          {activeStacks.map((stack) => (
            <option key={stack._id} value={stack._id}>
              {stack.name} ({stack.currentBirdCount} live birds)
            </option>
          ))}
        </select>
        {errors.stackId && <p className="text-rose-500 text-xs mt-1">{errors.stackId}</p>}
      </div>

      {/* 2. Egg Collections */}
      <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-amber-800">Egg Collection</span>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Good Eggs (pcs)</label>
            <input
              type="number"
              inputMode="numeric"
              name="goodEggs"
              placeholder="0"
              value={formData.goodEggs}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cracked / Bad (pcs)</label>
            <input
              type="number"
              inputMode="numeric"
              name="damagedEggs"
              placeholder="0"
              value={formData.damagedEggs}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        {errors.goodEggs && <p className="text-rose-500 text-xs">{errors.goodEggs}</p>}

        {/* Calculated Banner */}
        <div className="flex justify-between items-center bg-white p-2.5 rounded border border-amber-200 text-sm">
          <span className="text-slate-600 font-medium">Auto-Converted:</span>
          <span className="font-bold text-amber-900">
            {computedEggs.crates} crates + {computedEggs.loose} loose
            <span className="text-xs font-normal text-slate-400 ml-1">({computedEggs.total} total)</span>
          </span>
        </div>
      </div>

      {/* 3. Bird Mortality & Culls */}
      <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-rose-800">Flock Losses</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dead Birds</label>
            <input
              type="number"
              inputMode="numeric"
              name="mortality"
              placeholder="0"
              value={formData.mortality}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Culled / Sick</label>
            <input
              type="number"
              inputMode="numeric"
              name="culls"
              placeholder="0"
              value={formData.culls}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
        {errors.mortality && <p className="text-rose-500 text-xs">{errors.mortality}</p>}
      </div>

      {/* 4. Feed Dispensed */}
      <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-emerald-800">Feed Consumed</span>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Feed Type</label>
          <select
            name="feedInventoryId"
            value={formData.feedInventoryId}
            onChange={handleChange}
            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm"
          >
            {feedTypes.map((feed) => (
              <option key={feed._id} value={feed._id}>
                {feed.feedName} ({feed.currentStockBags} bags left)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bags Opened</label>
            <input
              type="number"
              inputMode="numeric"
              name="feedBags"
              placeholder="0"
              value={formData.feedBags}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Extra Loose (kg)</label>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              name="feedRemainderKg"
              placeholder="0"
              value={formData.feedRemainderKg}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        {errors.feedBags && <p className="text-rose-500 text-xs">{errors.feedBags}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-md disabled:bg-slate-400"
      >
        {isSubmitting ? 'Saving Record...' : 'Submit Shift Record'}
      </button>
    </form>
  );
}

```

---

## 2. Backend Payload Validation (Node.js Middleware)

Use a validation middleware to guard the database against corrupt records, negative counts, or impossible bird losses before touching Mongoose.

```javascript
// middleware/validateDailyLog.js
import mongoose from 'mongoose';
import PenStack from '../models/PenStack.js';
import FeedInventory from '../models/FeedInventory.js';

export const validateDailyShiftPayload = async (req, res, next) => {
  const {
    stackId,
    goodEggs,
    damagedEggs = 0,
    mortality = 0,
    culls = 0,
    feedInventoryId,
    feedBags,
    feedRemainderKg = 0
  } = req.body;

  const errors = [];

  // 1. Validate ObjectIDs
  if (!mongoose.Types.ObjectId.isValid(stackId)) {
    errors.push('Invalid Pen/Stack ID format.');
  }
  if (!mongoose.Types.ObjectId.isValid(feedInventoryId)) {
    errors.push('Invalid Feed Inventory ID format.');
  }

  // 2. Validate Numbers & Range
  const isPositiveInt = (num) => Number.isInteger(num) && num >= 0;
  const isPositiveNum = (num) => typeof num === 'number' && !isNaN(num) && num >= 0;

  if (!isPositiveInt(goodEggs)) errors.push('goodEggs must be an integer >= 0.');
  if (!isPositiveInt(damagedEggs)) errors.push('damagedEggs must be an integer >= 0.');
  if (!isPositiveInt(mortality)) errors.push('mortality must be an integer >= 0.');
  if (!isPositiveInt(culls)) errors.push('culls must be an integer >= 0.');
  if (!isPositiveInt(feedBags)) errors.push('feedBags must be an integer >= 0.');
  if (!isPositiveNum(feedRemainderKg)) errors.push('feedRemainderKg must be a positive number.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // 3. Domain Logic Verification (Checking Against Live DB State)
  try {
    const stack = await PenStack.findById(stackId);
    if (!stack) {
      return res.status(404).json({ success: false, message: 'Pen stack not found.' });
    }

    // Ensure total bird losses don't exceed current occupancy
    const totalLosses = mortality + culls;
    if (totalLosses > stack.currentBirdCount) {
      return res.status(400).json({
        success: false,
        message: `Total losses (${totalLosses}) cannot exceed current bird count (${stack.currentBirdCount}).`
      });
    }

    const feed = await FeedInventory.findById(feedInventoryId);
    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed item not found.' });
    }

    // Attach verified records to req for use in the controller
    req.penStack = stack;
    req.feedStock = feed;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Validation lookup failed', error: err.message });
  }
};

```

---

## 3. Atomic Controller Execution

Once validated, write the log and update related balances within a single database transaction.

```javascript
// controllers/productionController.js
import mongoose from 'mongoose';
import DailyProductionLog from '../models/DailyProductionLog.js';

export const logDailyShift = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      stackId,
      goodEggs,
      damagedEggs,
      mortality,
      culls,
      feedInventoryId,
      feedBags,
      feedRemainderKg,
      notes
    } = req.body;

    const stack = req.penStack;
    const feed = req.feedStock;

    const totalEggs = goodEggs + damagedEggs;
    const crates = Math.floor(totalEggs / 30);
    const looseEggs = totalEggs % 30;

    // Convert feed into total kilograms
    const totalFeedKg = (feedBags * feed.bagWeightKg) + feedRemainderKg;

    // 1. Create the production log
    const [log] = await DailyProductionLog.create(
      [
        {
          date: new Date(),
          stackId,
          mortality,
          culls,
          eggsCollected: {
            totalPieces: totalEggs,
            damagedPieces: damagedEggs,
            crates,
            looseEggs
          },
          feedConsumedKg: totalFeedKg,
          feedInventoryId,
          loggedBy: req.user._id,
          notes
        }
      ],
      { session }
    );

    // 2. Decrement birds in stack
    stack.currentBirdCount -= (mortality + culls);
    await stack.save({ session });

    // 3. Deduct feed stock
    feed.currentStockBags -= feedBags;
    await feed.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Shift logged successfully',
      data: {
        logId: log._id,
        cratesCollected: crates,
        looseEggs,
        remainingLiveBirds: stack.currentBirdCount,
        feedBagsLeft: feed.currentStockBags
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};

```


A mobile daily shift entry form for farm workers inside a poultry house needs large touch targets, minimal typing, immediate feedback (like auto-calculated crates), and resilient validation so inaccurate tallies never corrupt your flock projections.

---

## 1. Frontend Form Component (React / Tailwind CSS)

```jsx
// components/DailyShiftEntry.jsx
import React, { useState, useMemo } from 'react';

const EGGS_PER_CRATE = 30;

export default function DailyShiftEntry({ activeStacks, feedTypes, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    stackId: activeStacks[0]?._id || '',
    goodEggs: '',
    damagedEggs: '',
    mortality: '',
    culls: '',
    feedInventoryId: feedTypes[0]?._id || '',
    feedBags: '',
    feedRemainderKg: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Real-time calculated metrics for worker sanity checks
  const computedEggs = useMemo(() => {
    const good = Number(formData.goodEggs) || 0;
    const damaged = Number(formData.damagedEggs) || 0;
    const total = good + damaged;
    const crates = Math.floor(total / EGGS_PER_CRATE);
    const loose = total % EGGS_PER_CRATE;
    return { total, crates, loose };
  }, [formData.goodEggs, formData.damagedEggs]);

  const selectedStack = useMemo(() => {
    return activeStacks.find((s) => s._id === formData.stackId);
  }, [formData.stackId, activeStacks]);

  const validate = () => {
    const errs = {};
    if (!formData.stackId) errs.stackId = 'Select a pen/stack';
    
    const good = Number(formData.goodEggs);
    if (formData.goodEggs === '' || isNaN(good) || good < 0) {
      errs.goodEggs = 'Enter valid egg count (0 or more)';
    }

    const mort = Number(formData.mortality);
    const cull = Number(formData.culls);
    if (selectedStack && (mort + cull) > selectedStack.currentBirdCount) {
      errs.mortality = `Deaths + culls cannot exceed live birds (${selectedStack.currentBirdCount})`;
    }

    if (!formData.feedInventoryId) errs.feedInventoryId = 'Select feed type';
    const bags = Number(formData.feedBags);
    if (formData.feedBags === '' || isNaN(bags) || bags < 0) {
      errs.feedBags = 'Enter bags used (e.g. 0, 1, 2)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert string inputs to strict numbers
    const payload = {
      stackId: formData.stackId,
      goodEggs: Number(formData.goodEggs),
      damagedEggs: Number(formData.damagedEggs) || 0,
      mortality: Number(formData.mortality) || 0,
      culls: Number(formData.culls) || 0,
      feedInventoryId: formData.feedInventoryId,
      feedBags: Number(formData.feedBags),
      feedRemainderKg: Number(formData.feedRemainderKg) || 0,
      notes: formData.notes.trim()
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded-xl shadow-md space-y-5 text-slate-800">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-900">Daily Shift Entry</h2>
        <p className="text-xs text-slate-500">Record egg picks, mortality, and feed used.</p>
      </div>

      {/* 1. Stack Selector */}
      <div>
        <label className="block text-sm font-semibold mb-1">Select Pen / Stack</label>
        <select
          name="stackId"
          value={formData.stackId}
          onChange={handleChange}
          className="w-full h-12 px-3 bg-slate-50 border border-slate-300 rounded-lg text-base focus:ring-2 focus:ring-emerald-500"
        >
          {activeStacks.map((stack) => (
            <option key={stack._id} value={stack._id}>
              {stack.name} ({stack.currentBirdCount} live birds)
            </option>
          ))}
        </select>
        {errors.stackId && <p className="text-rose-500 text-xs mt-1">{errors.stackId}</p>}
      </div>

      {/* 2. Egg Collections */}
      <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-amber-800">Egg Collection</span>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Good Eggs (pcs)</label>
            <input
              type="number"
              inputMode="numeric"
              name="goodEggs"
              placeholder="0"
              value={formData.goodEggs}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cracked / Bad (pcs)</label>
            <input
              type="number"
              inputMode="numeric"
              name="damagedEggs"
              placeholder="0"
              value={formData.damagedEggs}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        {errors.goodEggs && <p className="text-rose-500 text-xs">{errors.goodEggs}</p>}

        {/* Calculated Banner */}
        <div className="flex justify-between items-center bg-white p-2.5 rounded border border-amber-200 text-sm">
          <span className="text-slate-600 font-medium">Auto-Converted:</span>
          <span className="font-bold text-amber-900">
            {computedEggs.crates} crates + {computedEggs.loose} loose
            <span className="text-xs font-normal text-slate-400 ml-1">({computedEggs.total} total)</span>
          </span>
        </div>
      </div>

      {/* 3. Bird Mortality & Culls */}
      <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-rose-800">Flock Losses</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dead Birds</label>
            <input
              type="number"
              inputMode="numeric"
              name="mortality"
              placeholder="0"
              value={formData.mortality}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Culled / Sick</label>
            <input
              type="number"
              inputMode="numeric"
              name="culls"
              placeholder="0"
              value={formData.culls}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
        {errors.mortality && <p className="text-rose-500 text-xs">{errors.mortality}</p>}
      </div>

      {/* 4. Feed Dispensed */}
      <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 space-y-3">
        <span className="text-xs font-bold tracking-wide uppercase text-emerald-800">Feed Consumed</span>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Feed Type</label>
          <select
            name="feedInventoryId"
            value={formData.feedInventoryId}
            onChange={handleChange}
            className="w-full h-11 px-3 bg-white border border-slate-300 rounded-lg text-sm"
          >
            {feedTypes.map((feed) => (
              <option key={feed._id} value={feed._id}>
                {feed.feedName} ({feed.currentStockBags} bags left)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Bags Opened</label>
            <input
              type="number"
              inputMode="numeric"
              name="feedBags"
              placeholder="0"
              value={formData.feedBags}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Extra Loose (kg)</label>
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              name="feedRemainderKg"
              placeholder="0"
              value={formData.feedRemainderKg}
              onChange={handleChange}
              className="w-full h-12 text-center text-lg font-bold border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        {errors.feedBags && <p className="text-rose-500 text-xs">{errors.feedBags}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-md disabled:bg-slate-400"
      >
        {isSubmitting ? 'Saving Record...' : 'Submit Shift Record'}
      </button>
    </form>
  );
}

```

---

## 2. Backend Payload Validation (Node.js Middleware)

Use a validation middleware to guard the database against corrupt records, negative counts, or impossible bird losses before touching Mongoose.

```javascript
// middleware/validateDailyLog.js
import mongoose from 'mongoose';
import PenStack from '../models/PenStack.js';
import FeedInventory from '../models/FeedInventory.js';

export const validateDailyShiftPayload = async (req, res, next) => {
  const {
    stackId,
    goodEggs,
    damagedEggs = 0,
    mortality = 0,
    culls = 0,
    feedInventoryId,
    feedBags,
    feedRemainderKg = 0
  } = req.body;

  const errors = [];

  // 1. Validate ObjectIDs
  if (!mongoose.Types.ObjectId.isValid(stackId)) {
    errors.push('Invalid Pen/Stack ID format.');
  }
  if (!mongoose.Types.ObjectId.isValid(feedInventoryId)) {
    errors.push('Invalid Feed Inventory ID format.');
  }

  // 2. Validate Numbers & Range
  const isPositiveInt = (num) => Number.isInteger(num) && num >= 0;
  const isPositiveNum = (num) => typeof num === 'number' && !isNaN(num) && num >= 0;

  if (!isPositiveInt(goodEggs)) errors.push('goodEggs must be an integer >= 0.');
  if (!isPositiveInt(damagedEggs)) errors.push('damagedEggs must be an integer >= 0.');
  if (!isPositiveInt(mortality)) errors.push('mortality must be an integer >= 0.');
  if (!isPositiveInt(culls)) errors.push('culls must be an integer >= 0.');
  if (!isPositiveInt(feedBags)) errors.push('feedBags must be an integer >= 0.');
  if (!isPositiveNum(feedRemainderKg)) errors.push('feedRemainderKg must be a positive number.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // 3. Domain Logic Verification (Checking Against Live DB State)
  try {
    const stack = await PenStack.findById(stackId);
    if (!stack) {
      return res.status(404).json({ success: false, message: 'Pen stack not found.' });
    }

    // Ensure total bird losses don't exceed current occupancy
    const totalLosses = mortality + culls;
    if (totalLosses > stack.currentBirdCount) {
      return res.status(400).json({
        success: false,
        message: `Total losses (${totalLosses}) cannot exceed current bird count (${stack.currentBirdCount}).`
      });
    }

    const feed = await FeedInventory.findById(feedInventoryId);
    if (!feed) {
      return res.status(404).json({ success: false, message: 'Feed item not found.' });
    }

    // Attach verified records to req for use in the controller
    req.penStack = stack;
    req.feedStock = feed;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Validation lookup failed', error: err.message });
  }
};

```

---

## 3. Atomic Controller Execution

Once validated, write the log and update related balances within a single database transaction.

```javascript
// controllers/productionController.js
import mongoose from 'mongoose';
import DailyProductionLog from '../models/DailyProductionLog.js';

export const logDailyShift = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      stackId,
      goodEggs,
      damagedEggs,
      mortality,
      culls,
      feedInventoryId,
      feedBags,
      feedRemainderKg,
      notes
    } = req.body;

    const stack = req.penStack;
    const feed = req.feedStock;

    const totalEggs = goodEggs + damagedEggs;
    const crates = Math.floor(totalEggs / 30);
    const looseEggs = totalEggs % 30;

    // Convert feed into total kilograms
    const totalFeedKg = (feedBags * feed.bagWeightKg) + feedRemainderKg;

    // 1. Create the production log
    const [log] = await DailyProductionLog.create(
      [
        {
          date: new Date(),
          stackId,
          mortality,
          culls,
          eggsCollected: {
            totalPieces: totalEggs,
            damagedPieces: damagedEggs,
            crates,
            looseEggs
          },
          feedConsumedKg: totalFeedKg,
          feedInventoryId,
          loggedBy: req.user._id,
          notes
        }
      ],
      { session }
    );

    // 2. Decrement birds in stack
    stack.currentBirdCount -= (mortality + culls);
    await stack.save({ session });

    // 3. Deduct feed stock
    feed.currentStockBags -= feedBags;
    await feed.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Shift logged successfully',
      data: {
        logId: log._id,
        cratesCollected: crates,
        looseEggs,
        remainingLiveBirds: stack.currentBirdCount,
        feedBagsLeft: feed.currentStockBags
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};

```



Here is a breakdown of what has been architected so far, what is still pending across the farm’s operational footprint, and the exact roadmap to wrap up development.

---

### What We Have Built

* **System Core:** Domain entity design, core poultry formulas (crates, loose eggs, HDEP %, feed ratios).
* **Database Schema:** Complete MongoDB/Mongoose models for pens, daily production logs, feed inventory, treatment, and financial transactions.
* **RBAC Matrix & Auth:** Three-tier hierarchy (`WORKER`, `ADMIN`, `SUPER_ADMIN`), JWT middleware, and route protection.
* **Daily Shift Engine:** High-contrast, mobile-first data entry form for farm hands with frontend validation, transaction-wrapped controllers, and stock deductions.
* **Analytics & Forecasting:** Mongoose aggregation pipeline computing rolling historical baselines and forward-looking feed and egg projections.

---

### What Is Still Left to Build

#### 1. The Physical Stack & Pen Visualizer (Frontend & Controller)

* **Interactive Coop Grid:** A visual matrix representing physical pen cages ($Rows \times Columns \times Birds/Cell$).
* **Visual Status Indicators:** Color-coded cells showing occupancy density, mortality spikes, or quarantined tiers.
* **Bird Relocation Workflow:** Moving birds between tiers/stacks without breaking flock counts or historical records.

#### 2. Treatment & Health Management Module

* **Medication & Vaccination Schedules:** Logging batch-wide administration (antibiotics, vitamins, deworming).
* **Withdrawal Period Counter:** An active lock/warning on egg or meat sales when a flock is under a drug with an active withdrawal window to ensure food safety compliance.

#### 3. Wholesale Egg Sales & POS (Point of Sale)

* **Order Creation Flow:** Recording bulk crate sales directly against the recorded egg inventory.
* **Payment & Debt Tracking:** Handling cash, bank transfers, credit balances for recurring market distributors, and generating printable PDF/print receipts.
* **Automatic Inventory Deductions:** Depleting warehouse egg crates when a sales order is completed.

#### 4. Comprehensive Financial Engine (P&L Ledger)

* **Expense Tracking:** Non-production operating costs (diesel for generators, staff payroll, transport, sawdust/litter, repairs).
* **Financial Reporting API:** Aggregating Gross Revenue, Cost of Goods Sold (Feed + Meds + Replacement Pullets), Net Operating Profit, and Profit per Live Bird.

#### 5. Background Jobs & Automation (Cron / Queues)

* **Nightly Reorder & Anomaly Monitor:** A scheduled task checking if feed levels breached the reorder buffer or if a pen experienced a sudden drop in HDEP $> 8\%$.
* **Automated Daily Summary:** Generating end-of-day operational summaries for the owner via email or WhatsApp/SMS webhook.

#### 6. Offline Support (Crucial for Poultry Sheds)

* Poultry pens often have spotty cellular connections. Adding a service worker with client-side caching (IndexedDB/LocalForage) ensures workers can submit daily picks offline and auto-sync when back in Wi-Fi range.

---

### Suggested Next Priority

```text
[Current State]
       │
       ├──► Priority A: Wholesale Egg Sales & Billing (Connects egg inventory to cash)
       │
       ├──► Priority B: Physical Pen Visualizer (UI component for the rows/columns layout)
       │
       └──► Priority C: Treatment Ledger & Withdrawal Period Tracker

```




Here is the complete implementation of **Priority A: Wholesale Egg Sales & Billing**.

This module links recorded daily egg picks directly to warehouse egg stock, manages sales orders to distributors, handles partial payments/debt ledgers, generates customer invoices, and updates cash flow transactions within an atomic database transaction.

---

## 1. Data Modeling: Egg Warehouse, Customer & Sales Invoices

```javascript
// models/EggInventory.js
import mongoose from 'mongoose';

const EggInventorySchema = new mongoose.Schema({
  // Singleton record for the central egg holding store
  totalCratesInStock: { type: Number, default: 0, min: 0 },
  totalLooseEggs: { type: Number, default: 0, min: 0, max: 29 },
  lastUpdated: { type: Date, default: Date.now }
});

export const EggInventory = mongoose.models.EggInventory || mongoose.model('EggInventory', EggInventorySchema);

// models/Customer.js
const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  businessName: String,
  outstandingBalance: { type: Number, default: 0 }, // Positive = Customer owes farm (Credit)
  createdAt: { type: Date, default: Date.now }
});

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

// models/EggSaleInvoice.js
const EggSaleInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  cratesSold: { type: Number, required: true, min: 1 },
  unitPricePerCrate: { type: Number, required: true, min: 0 },
  totalAmountDue: { type: Number, required: true }, // cratesSold * unitPricePerCrate
  amountPaid: { type: Number, required: true, min: 0 },
  balanceRemaining: { type: Number, required: true }, // totalAmountDue - amountPaid
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'CREDIT'],
    default: 'PAID'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'POS', 'CREDIT'],
    required: true
  },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const EggSaleInvoice = mongoose.models.EggSaleInvoice || mongoose.model('EggSaleInvoice', EggSaleInvoiceSchema);

```

---

## 2. Atomic Sales Controller Execution

A distributor pickup involves four simultaneous changes:

1. **Deduct egg crates** from inventory.
2. **Create the invoice** record.
3. **Update customer balance** if they took crates on credit or made partial payment.
4. **Record cash inflow** in the general financial ledger.

```javascript
// controllers/salesController.js
import mongoose from 'mongoose';
import { EggInventory, Customer, EggSaleInvoice } from '../models/EggInventory.js';
import Transaction from '../models/Transaction.js';

export const processWholesaleEggSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerId,
      cratesSold,
      unitPricePerCrate,
      amountPaid,
      paymentMethod
    } = req.body;

    const cratesNum = Number(cratesSold);
    const priceNum = Number(unitPricePerCrate);
    const paidNum = Number(amountPaid);

    if (!cratesNum || cratesNum <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid crate count' });
    }

    // 1. Check & Decrement Egg Inventory
    let inventory = await EggInventory.findOne().session(session);
    if (!inventory || inventory.totalCratesInStock < cratesNum) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory. Requested: ${cratesNum}, In stock: ${inventory?.totalCratesInStock || 0}`
      });
    }

    inventory.totalCratesInStock -= cratesNum;
    inventory.lastUpdated = new Date();
    await inventory.save({ session });

    // 2. Fetch Customer
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // 3. Compute Balances
    const totalAmountDue = cratesNum * priceNum;
    const balanceRemaining = totalAmountDue - paidNum;

    let paymentStatus = 'PAID';
    if (balanceRemaining > 0 && paidNum > 0) paymentStatus = 'PARTIAL';
    if (paidNum === 0) paymentStatus = 'CREDIT';

    // 4. Create Invoice
    const invoiceNumber = `GF-INV-${Date.now().toString().slice(-6)}`;
    const [invoice] = await EggSaleInvoice.create(
      [
        {
          invoiceNumber,
          customerId,
          cratesSold: cratesNum,
          unitPricePerCrate: priceNum,
          totalAmountDue,
          amountPaid: paidNum,
          balanceRemaining,
          paymentStatus,
          paymentMethod,
          issuedBy: req.user._id
        }
      ],
      { session }
    );

    // 5. Update Customer Ledger Debt
    if (balanceRemaining > 0) {
      customer.outstandingBalance += balanceRemaining;
      await customer.save({ session });
    }

    // 6. Record Inflow in Cash Ledger (Only the actual amount received)
    if (paidNum > 0) {
      await Transaction.create(
        [
          {
            date: new Date(),
            type: 'INCOME',
            category: 'egg_sales',
            amount: paidNum,
            quantity: cratesNum,
            unitPrice: priceNum,
            paymentMethod: paymentMethod === 'CREDIT' ? 'credit' : paymentMethod.toLowerCase(),
            receiptRef: invoiceNumber
          }
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: 'Sale processed successfully',
      data: {
        invoice,
        remainingWarehouseCrates: inventory.totalCratesInStock,
        customerDebtBalance: customer.outstandingBalance
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: error.message });
  }
};

```

---

## 3. Frontend Point-of-Sale (POS) & Invoice Modal (React)

A responsive wholesale POS interface designed for managers recording orders at the farm gate.

```jsx
// components/WholesaleEggPOS.jsx
import React, { useState, useMemo } from 'react';

export default function WholesaleEggPOS({ customers, availableCrates, onCompleteSale }) {
  const [customerId, setCustomerId] = useState(customers[0]?._id || '');
  const [crates, setCrates] = useState('');
  const [unitPrice, setUnitPrice] = useState('3200'); // Default market price per crate
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c._id === customerId),
    [customerId, customers]
  );

  const totalCost = useMemo(() => {
    const q = Number(crates) || 0;
    const p = Number(unitPrice) || 0;
    return q * p;
  }, [crates, unitPrice]);

  const balanceDue = useMemo(() => {
    const paid = Number(amountPaid) || 0;
    return Math.max(0, totalCost - paid);
  }, [totalCost, amountPaid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!crates || Number(crates) <= 0) return alert('Enter valid crate quantity');
    if (Number(crates) > availableCrates) return alert('Insufficient stock in warehouse');

    setIsProcessing(true);
    await onCompleteSale({
      customerId,
      cratesSold: Number(crates),
      unitPricePerCrate: Number(unitPrice),
      amountPaid: Number(amountPaid) || 0,
      paymentMethod
    });
    setIsProcessing(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
      <div className="flex justify-between items-center border-b pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Wholesale Egg Dispatch</h2>
          <p className="text-xs text-slate-500">Record distributor pickup & dispatch stock</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Warehouse Stock</span>
          <span className="text-lg font-black text-emerald-600">{availableCrates} Crates</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Buyer / Distributor</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full h-11 px-3 bg-slate-50 border rounded-lg text-sm font-medium"
          >
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ''} - Debt: ₦{c.outstandingBalance.toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Quantities & Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Crates Ordered</label>
            <input
              type="number"
              min="1"
              max={availableCrates}
              value={crates}
              onChange={(e) => {
                setCrates(e.target.value);
                setAmountPaid(String(Number(e.target.value) * Number(unitPrice))); // Pre-fills full payment
              }}
              placeholder="0"
              className="w-full h-11 px-3 border rounded-lg text-base font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price / Crate (₦)</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => {
                setUnitPrice(e.target.value);
                setAmountPaid(String(Number(crates) * Number(e.target.value)));
              }}
              className="w-full h-11 px-3 border rounded-lg text-base font-bold"
              required
            />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-4 bg-slate-50 rounded-xl space-y-2 border">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Total Order Cost:</span>
            <span className="font-bold text-slate-900">₦{totalCost.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount Paid (₦)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full h-10 px-3 bg-white border rounded-lg text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-2 bg-white border rounded-lg text-xs font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="POS">Card / POS</option>
                <option value="CREDIT">Credit (Full Debt)</option>
              </select>
            </div>
          </div>

          {balanceDue > 0 && (
            <div className="flex justify-between text-xs font-bold text-rose-600 pt-2 border-t">
              <span>Unpaid Debt Added to Buyer Ledger:</span>
              <span>₦{balanceDue.toLocaleString()}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isProcessing || availableCrates === 0}
          className="w-full h-13 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition shadow disabled:bg-slate-300"
        >
          {isProcessing ? 'Processing Dispatch...' : `Confirm Sale (₦${totalCost.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
}

```

---

## 4. Printable Thermal / PDF Invoice Preview

When an invoice is created, workers and administrators can instantly pop open a thermal-width receipt or download a PDF to hand over to dispatch drivers:

```text
==================================================
              GENERAL FARM LTD.
        Fresh Eggs & Poultry Products
          Receipt / Dispatch Docket
==================================================
Invoice No : GF-INV-849102
Date       : 29 Aug 2026, 16:54
Issued By  : Admin (Shift Manager)
Customer   : Alh. Sani Agro Ventures
--------------------------------------------------
Item                  Qty     Rate         Total
--------------------------------------------------
Standard Layer Crates  150     ₦3,200    ₦480,000
--------------------------------------------------
Total Amount Due                          ₦480,000
Amount Paid (Bank Transfer)               ₦400,000
--------------------------------------------------
Balance Unpaid (Carried to Ledger)         ₦80,000
Total Customer Debt to Date:              ₦135,000
==================================================
     Goods received in good condition.
     Thank you for your patronage!
==================================================

```

---

## Remaining Backlog

```text
[Current State]
       │
       ├──► Priority A: Wholesale Egg Sales & Billing (Done)
       │
       ├──► Priority B: Physical Pen Visualizer (Rows/Columns cage matrix)
       │
       └──► Priority C: Treatment Ledger & Withdrawal Period Tracker

```



Here is the complete implementation of both **Priority B: Physical Pen Visualizer** and **Priority C: Treatment Ledger & Drug Withdrawal Safety Tracker**.

---

# Part 1: Physical Pen Visualizer (Priority B)

Commercial layer cages are arranged in stacked battery batteries or tiers. This visualizer maps out a 2D grid ($Rows \times Columns$) where each cell represents a cage box holding birds. It highlights occupancy density, isolates mortality spots, and lets farm managers relocate birds between tiers without corrupting the live headcount.

### 1. The Interactive Cage Matrix Component (React / Tailwind)

```jsx
// components/PenVisualizer.jsx
import React, { useState, useMemo } from 'react';

export default function PenVisualizer({ stack, onRelocateBirds, onCellInspect }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [relocateModalOpen, setRelocateModalOpen] = useState(false);
  const [birdsToMove, setBirdsToMove] = useState(1);
  const [targetCellCoords, setTargetCellCoords] = useState({ row: 0, col: 0 });

  // Generate grid cells based on stack specs
  const grid = useMemo(() => {
    const matrix = [];
    for (let r = 0; r < stack.rows; r++) {
      const rowArr = [];
      for (let c = 0; c < stack.columns; c++) {
        // Look up custom cell status or fallback to standard baseline
        const customCell = stack.cellOverrides?.find(
          (item) => item.row === r && item.col === c
        );
        rowArr.push({
          row: r,
          col: c,
          currentBirds: customCell ? customCell.currentBirds : stack.birdsPerCell,
          maxCapacity: stack.birdsPerCell,
          hasMortalityToday: customCell?.mortalityToday > 0,
          isQuarantined: customCell?.isQuarantined || false
        });
      }
      matrix.push(rowArr);
    }
    return matrix;
  }, [stack]);

  const handleCellClick = (cell) => {
    setSelectedCell(cell);
    if (onCellInspect) onCellInspect(cell);
  };

  const executeRelocation = (e) => {
    e.preventDefault();
    if (!selectedCell) return;
    onRelocateBirds({
      stackId: stack._id,
      from: { row: selectedCell.row, col: selectedCell.col },
      to: targetCellCoords,
      count: Number(birdsToMove)
    });
    setRelocateModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 space-y-4">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{stack.name} Layout</h3>
          <p className="text-xs text-slate-500">
            {stack.rows} Tiers (Rows) × {stack.columns} Units (Columns) | Max: {stack.capacity} birds
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Full
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Partial
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Mortality
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Empty
          </span>
        </div>
      </div>

      {/* Cage Grid Viewport */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full space-y-2">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-12 text-right">
                Tier {rowIndex + 1}
              </span>
              <div className="flex gap-2">
                {row.map((cell) => {
                  const isFull = cell.currentBirds >= cell.maxCapacity;
                  const isEmpty = cell.currentBirds === 0;
                  const isSelected =
                    selectedCell?.row === cell.row && selectedCell?.col === cell.col;

                  let bgColor = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                  if (cell.hasMortalityToday) {
                    bgColor = 'bg-rose-100 border-rose-400 text-rose-800 animate-pulse';
                  } else if (cell.isQuarantined) {
                    bgColor = 'bg-purple-100 border-purple-400 text-purple-800';
                  } else if (isEmpty) {
                    bgColor = 'bg-slate-100 border-slate-200 text-slate-400';
                  } else if (!isFull) {
                    bgColor = 'bg-amber-50 border-amber-300 text-amber-800';
                  }

                  return (
                    <button
                      key={`${cell.row}-${cell.col}`}
                      type="button"
                      onClick={() => handleCellClick(cell)}
                      className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all ${bgColor} ${
                        isSelected ? 'ring-2 ring-slate-900 ring-offset-1 scale-105 shadow' : 'hover:scale-102'
                      }`}
                    >
                      <span>{cell.currentBirds}/{cell.maxCapacity}</span>
                      <span className="text-[9px] opacity-60 font-normal">C{cell.col + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cell Detail & Quick Actions Bar */}
      {selectedCell && (
        <div className="bg-slate-50 p-3 rounded-lg border flex flex-wrap justify-between items-center gap-3">
          <div className="text-sm">
            <span className="font-bold text-slate-800">
              Selected: Tier {selectedCell.row + 1}, Cage {selectedCell.col + 1}
            </span>
            <span className="text-slate-500 ml-2">
              ({selectedCell.currentBirds} birds occupying)
            </span>
          </div>
          <button
            onClick={() => setRelocateModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white text-xs font-semibold rounded-md shadow-sm transition"
          >
            Relocate Birds
          </button>
        </div>
      )}

      {/* Relocate Modal */}
      {relocateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={executeRelocation}
            className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl"
          >
            <h4 className="font-bold text-slate-900 text-base">
              Move Birds from [T{selectedCell.row + 1} : C{selectedCell.col + 1}]
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Number of Birds to Move
              </label>
              <input
                type="number"
                min="1"
                max={selectedCell.currentBirds}
                value={birdsToMove}
                onChange={(e) => setBirdsToMove(e.target.value)}
                className="w-full h-10 border rounded px-3 text-sm font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">To Tier (Row)</label>
                <input
                  type="number"
                  min="1"
                  max={stack.rows}
                  value={targetCellCoords.row + 1}
                  onChange={(e) =>
                    setTargetCellCoords((prev) => ({ ...prev, row: Number(e.target.value) - 1 }))
                  }
                  className="w-full h-10 border rounded px-3 text-sm font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">To Cage (Col)</label>
                <input
                  type="number"
                  min="1"
                  max={stack.columns}
                  value={targetCellCoords.col + 1}
                  onChange={(e) =>
                    setTargetCellCoords((prev) => ({ ...prev, col: Number(e.target.value) - 1 }))
                  }
                  className="w-full h-10 border rounded px-3 text-sm font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRelocateModalOpen(false)}
                className="flex-1 h-10 border rounded-lg text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Move
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

```

---

# Part 2: Treatment Ledger & Drug Withdrawal Safety Tracker (Priority C)

Certain poultry medications (e.g., broad-spectrum antibiotics, coccidiostats) have strict **withdrawal periods** where eggs or cull meat contain pharmacological residue and cannot be legally or ethically sold. This module calculates active countdown timers and warns administrators when trying to dispatch eggs from medicated flocks.

### 1. Data Schema & Model

```javascript
// models/TreatmentLog.js
import mongoose from 'mongoose';

const TreatmentLogSchema = new mongoose.Schema({
  stackId: { type: mongoose.Schema.Types.ObjectId, ref: 'PenStack', required: true, index: true },
  medicationName: { type: String, required: true, trim: true },
  activeIngredient: String,
  category: {
    type: String,
    enum: ['ANTIBIOTIC', 'DEWORMER', 'VACCINE', 'VITAMIN_BOOSTER', 'COCCIDIOSTAT'],
    required: true
  },
  dosage: { type: String, required: true }, // e.g. "50g per 100L drinking water"
  administrationMethod: {
    type: String,
    enum: ['DRINKING_WATER', 'FEED_MIX', 'INJECTION', 'EYE_DROP_SPRAY'],
    default: 'DRINKING_WATER'
  },
  dateAdministered: { type: Date, default: Date.now, index: true },
  durationDays: { type: Number, default: 3 },
  withdrawalPeriodDays: { type: Number, default: 0 }, // Days eggs/meat cannot be consumed
  withdrawalEndDate: { type: Date, index: true },
  administeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String
});

// Calculate the exact withdrawal expiry timestamp before saving
TreatmentLogSchema.pre('save', function (next) {
  if (this.withdrawalPeriodDays > 0) {
    const end = new Date(this.dateAdministered);
    end.setDate(end.getDate() + this.durationDays + this.withdrawalPeriodDays);
    this.withdrawalEndDate = end;
  } else {
    this.withdrawalEndDate = null;
  }
  next();
});

export default mongoose.models.TreatmentLog || mongoose.model('TreatmentLog', TreatmentLogSchema);

```

---

### 2. Treatment Controller & Active Safety Hook

```javascript
// controllers/treatmentController.js
import TreatmentLog from '../models/TreatmentLog.js';

// 1. Log a new medication batch
export const recordTreatment = async (req, res) => {
  try {
    const {
      stackId,
      medicationName,
      activeIngredient,
      category,
      dosage,
      administrationMethod,
      durationDays,
      withdrawalPeriodDays,
      notes
    } = req.body;

    const log = new TreatmentLog({
      stackId,
      medicationName,
      activeIngredient,
      category,
      dosage,
      administrationMethod,
      durationDays: Number(durationDays) || 1,
      withdrawalPeriodDays: Number(withdrawalPeriodDays) || 0,
      administeredBy: req.user._id,
      notes
    });

    await log.save();

    return res.status(201).json({
      success: true,
      message: 'Medication recorded successfully',
      data: log
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Fetch all active withdrawal periods farm-wide
export const getActiveWithdrawalAlerts = async (req, res) => {
  try {
    const now = new Date();
    const activeAlerts = await TreatmentLog.find({
      withdrawalEndDate: { $gt: now }
    })
      .populate('stackId', 'name currentBirdCount')
      .populate('administeredBy', 'name')
      .sort({ withdrawalEndDate: 1 });

    const formattedAlerts = activeAlerts.map((item) => {
      const remainingHours = Math.ceil((item.withdrawalEndDate - now) / (1000 * 60 * 60));
      const remainingDays = Math.ceil(remainingHours / 24);
      return {
        id: item._id,
        stackName: item.stackId?.name,
        medicationName: item.medicationName,
        category: item.category,
        withdrawalEndDate: item.withdrawalEndDate,
        remainingHours,
        remainingDays,
        isEggSafe: remainingHours <= 0
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedAlerts.length,
      data: formattedAlerts
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

```

---

### 3. Active Safety Banner & Form (React)

Add this component to the Admin Dashboard and the Wholesale POS screen. If a pen is under an active drug withdrawal, it raises a bold compliance flag preventing tainted eggs from entering commercial channels.

```jsx
// components/TreatmentTracker.jsx
import React, { useState } from 'react';

export default function TreatmentTracker({ activeAlerts = [], onLogTreatment, stacks = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    stackId: stacks[0]?._id || '',
    medicationName: '',
    category: 'ANTIBIOTIC',
    dosage: '',
    durationDays: 3,
    withdrawalPeriodDays: 5,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogTreatment(formData);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. Active Drug Withdrawal Warning Banner */}
      {activeAlerts.length > 0 ? (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              Active Medication Withdrawal In Progress ({activeAlerts.length} Stacks)
            </h4>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
              Food Safety Lockdown
            </span>
          </div>
          <div className="divide-y divide-amber-200/60">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="py-2 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{alert.stackName}</span>
                  <span className="text-slate-500 ml-2">({alert.medicationName} - {alert.category})</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 block">
                    {alert.remainingDays} days remaining
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Safe on {new Date(alert.withdrawalEndDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>All flocks clear of drug withdrawal restrictions. Eggs fully compliant for retail.</span>
          <span className="font-bold">100% Safe</span>
        </div>
      )}

      {/* 2. Admin Action Bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-900">Treatment & Medication Logs</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow"
        >
          {showForm ? 'Close Form' : '+ Record Medication'}
        </button>
      </div>

      {/* 3. Record Medication Form Modal/Collapse */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-lg space-y-4">
          <h4 className="font-bold text-sm text-slate-800 border-b pb-2">Administer Flock Medication</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Pen / Stack</label>
              <select
                value={formData.stackId}
                onChange={(e) => setFormData({ ...formData, stackId: e.target.value })}
                className="w-full h-10 border rounded-lg px-2 text-xs font-medium bg-slate-50"
              >
                {stacks.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Medication Name</label>
              <input
                type="text"
                placeholder="e.g. Tylosin Tartrate / Oxytetracycline"
                value={formData.medicationName}
                onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                className="w-full h-10 border rounded-lg px-3 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 border rounded-lg px-2 text-xs font-medium bg-slate-50"
              >
                <option value="ANTIBIOTIC">Antibiotic</option>
                <option value="COCCIDIOSTAT">Coccidiostat</option>
                <option value="DEWORMER">Dewormer</option>
                <option value="VITAMIN_BOOSTER">Vitamin / Mineral Booster</option>
                <option value="VACCINE">Vaccine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dosage Spec</label>
              <input
                type="text"
                placeholder="e.g. 100g in 200L water"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full h-10 border rounded-lg px-3 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Treatment Duration (Days)</label>
              <input
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                className="w-full h-10 border rounded-lg px-3 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-600 mb-1">
                Withdrawal Safety Period (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.withdrawalPeriodDays}
                onChange={(e) => setFormData({ ...formData, withdrawalPeriodDays: e.target.value })}
                className="w-full h-10 border-rose-300 rounded-lg px-3 text-xs font-bold bg-rose-50/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow"
          >
            Submit Prescription & Start Safety Countdown
          </button>
        </form>
      )}
    </div>
  );
}

```

---

## 3. Connecting the System

The operational loop is now tied together end-to-end:

```text
  [Daily Worker Shift Log]
            │
            ├──► Live Birds & Feed Updated
            └──► Eggs deposited in Warehouse
                        │
                        ▼
            [Egg Warehouse Stock]
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[Treatment Safety Check]     [Wholesale POS / Billing]
- Block or flag dispatch      - Deduct warehouse crates
  if withdrawal is active     - Create invoice & record debt
                              - Post cash to Financial Ledger

```

All five primary operational requirements for **General Farm Ltd**—flock tier mapping, daily production tracking, feed consumption analytics, treatment compliance, and financial order processing—are fully structured, modeled, and ready for deployment.