# Bombay Saree — Omnichannel Saree Studio & Designer Marketplace

> A production-ready, omnichannel retail management system and multi-designer luxury saree marketplace built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase (PostgreSQL, RLS, RPCs)**.

---

## 🏛️ Business Model & Operational Decisions

Bombay Saree operates as a centralized luxury saree studio and multi-designer retail marketplace across two sales channels:
1. **Online E-commerce Storefront**
2. **Physical Flagship Retail Studio with High-Speed POS Billing (Kala Ghoda, Mumbai)**

### Confirmed Core Decisions:
- **Commission Basis**: **Final discounted item price, excluding applicable taxes** (`final_price_ex_tax`).
- **Payout Eligibility**: **After delivery and the configured return window (7 days)** with no pending dispute or return.
- **Physical Inventory Tracking**: **Unique barcode for every physical saree** (one physical piece = one inventory item ID + one unique Code 128 barcode).
- **Mixed Inventory Ownership**: Clear separation between **Bombay-owned inventory** (acquisition cost tracked, profit calculated, no designer liability) and **Designer consignment stock** (settlement allocations and append-only ledger entries).

---

## 🎭 The Four Application Modes

The application features four distinct role-based experiences accessible via the top switcher bar or role authentication:

| Mode | Role | Primary Workflows |
|---|---|---|
| 🛍️ **Customer** | Online Shopper | Browse curated Banarasi, Kanjivaram, Paithani sarees, filter by weave/occasion/ownership, real-time physical stock counts, wishlist, cart with physical piece reservation, coupon engine, Razorpay/Cashfree & COD checkout, order tracking lifecycle, and tax invoice download. |
| 🏪 **Store Staff** | Physical Store POS | High-speed POS billing, hardware USB/Bluetooth keyboard barcode scanner auto-listener, manual catalog search, walk-in customer capture, line & bill discounts, 5% GST calculation, Cash/Card/UPI split payments with change due calculation, hold/resume bills, 80mm thermal receipt printing, and cashier shifts reconciliation. |
| 🎨 **Designer** | Saree Designer / Atelier | Designer onboarding application & status tracking, submit new saree collections with photography/weave details for review, view transparent sales & commission ledger, track wishlist engagement, live consignment stock levels, and payout settlement history. (Strict tenant data isolation). |
| 👑 **Admin** | Business Management | Executive revenue dashboard (POS vs Online sales comparison), designer application approvals with custom commission rates, catalog publishing/archival, deep physical saree inventory management, Code 128 barcode label generator & batch printing, inter-store transfers, returns processing, payout batch creation, audit trails, and CSV reports. |

---

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Indian luxury palette (Ivory `#FDFCF7`, Royal Burgundy `#800020`, Muted Gold `#D4AF37`, Charcoal typography)
- **Barcodes**: JsBarcode (Code 128 standard) + Global hardware keyboard scanner listener hook
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React
- **Data Engine & State**: Dual-engine architecture:
  - Connects to **Supabase** when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
  - Runs in a persistent **Transactional Local Storage & Memory Store** with pre-seeded luxury sarees and designers if credentials are not configured, guaranteeing that every button, barcode scan, POS checkout, and export works 100% out of the box!
- **Celebrations**: `canvas-confetti`

---

## 🗄️ Database Schema & Supabase Migrations

The database migrations are located in `supabase/migrations/`:

1. `20261017000100_bombay_core.sql`: Roles, locations, designers, products, categories, unique physical pieces (`inventory_items`), and movements.
2. `20261017000200_bombay_sales_finance.sql`: Unified `sales` table, 1-piece `sale_items` snapshots, `payments`, `sale_allocations`, immutable `designer_ledger_entries`, `payouts`, `cashier_shifts`, and `returns`.
3. `20261017000300_bombay_security.sql`: Row Level Security (RLS) policies and security definer functions (`private.has_role`, `private.current_designer_id`).
4. `20261017000400_bombay_rpcs.sql`: Transactional database functions:
   - `receive_inventory`: creates physical sarees with unique barcodes.
   - `finalize_pos_sale`: atomic POS billing, stock deduction, and commission allocation.
   - `mark_allocations_eligible`: automated return window check.
   - `create_payout_batch` & `record_payout_result`: payout execution engine.
5. `20261017000500_bombay_seed.sql`: Rich realistic seed dataset.
6. `supabase/tests/bombay_business_rules.test.sql`: Automated pgTAP acceptance test suite.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Insert your Supabase project credentials. The app runs seamlessly with mock data even without Supabase credentials).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📋 Acceptance Testing Scenarios

1. **Physical Saree Barcode Uniqueness**: Every saree has its own barcode (e.g. `BS-KAN-001`, `BS-BAN-001`). Attempting to add a duplicate barcode raises a uniqueness error.
2. **POS Barcode Billing**: Staff can scan barcodes or click quick-add buttons. Selling a saree automatically marks its status as `sold` and removes it from available stock.
3. **Consignment vs. Studio Owned**:
   - Consignment sales calculate the agreed designer share and create an immutable ledger entry.
   - Studio-owned sales record retail revenue without creating a designer commission payable.
4. **Return & Stock Restoration**: Returning an item inspects its condition. Marking it `sellable` restores stock; marking it `damaged` isolates it in `held` status. The designer allocation is reversed atomically.
5. **Cashier Shift Reconciliation**: Staff enter actual cash in drawer at closing, and the system computes the exact variance against expected float + cash sales.

---

© 2026 Bombay Saree Retail Private Limited.
