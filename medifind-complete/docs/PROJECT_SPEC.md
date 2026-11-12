# MediFind — Project Specification

> **Tagline:** *"We don't list medicines, we verify them."*

MediFind shows which nearby independent pharmacy has a medicine right now, backed by a real-time **Stock Confidence Score**.

---

## 1. Product Overview

MediFind is strictly an **information and reservation-request platform**.
- **What it does:** Empowers patients and caregivers to discover real-time availability of verified medicines at independent chemists nearby, calculate live confidence scores, request 60-minute holds, and trigger live pings to pharmacists when inventory data is stale.
- **What it does NOT do:**
  - MediFind **does not sell, deliver, or recommend medicines**.
  - MediFind **provides no medical advice or diagnostic services**.
- **Prescription Notice:** Every prescription medicine strictly displays a persistent legal warning:  
  *“Prescription Required: The chemist will verify your physical or digital doctor's prescription in person before dispensing.”*

---

## 2. Core Features

1. **Medicine Search with Typo-Tolerant Autocomplete**
   - Instant search across generic salts, trade brands, dosage forms, and strengths.
   - Typo tolerance powered by `rapidfuzz` (e.g., matching "paractamol" to "Paracetamol 500mg").

2. **Nearby Pharmacies Ranking**
   - Chemists ranked by a balanced composite of Availability, Stock Confidence Score, and Distance (km).
   - Distance calculation based on Haversine formula from user coordinates.

3. **Auto-Ping System**
   - When stock records are stale (> 4 hours old or unverified), MediFind can auto-dispatch a ping to the top 3 closest pharmacies asking: *"Do you have [Medicine] in stock right now?"*
   - Real-time card updates when a chemist replies **Yes** or **No**.

4. **Reservation Request (60-Minute Hold)**
   - Patients can request a temporary 60-minute hold on verified medicine.
   - Generates a 4-digit pickup reservation token with countdown timer.
   - Prevents hoarding; auto-expires after 60 minutes if unclaimed.

5. **Pharmacy Portal**
   - Direct web portal for chemist partners using a secure Store ID + 4-digit PIN.
   - One-tap stock toggle (`In Stock` / `Out of Stock` / `Low Stock`).
   - Incoming ping answering interface, reservation acceptance/rejection, and unmet-demand insights.

6. **Pharmacist Simulator**
   - Interactive mobile emulator page (`/simulator`) simulating a chemist's mobile screen.
   - Allows instant testing and live demonstrations of SMS/WhatsApp-style Auto-Ping notifications and one-tap replies without requiring paid WhatsApp Business APIs or external SMS gateways.

7. **"Report Wrong Stock" Community Flagging**
   - Every search result card includes a discrete 1-tap "Report wrong stock" mechanism.
   - Crowd-sourced accuracy signals degrade pharmacy accuracy scores when verified incorrect.

---

## 3. Stock Confidence Score Algorithm

MediFind guarantees objective, un-bribable confidence calculations. **Nothing can be paid to raise a score.**

### Formula

$$\text{Freshness} = \max\left(0, 1 - \frac{\text{minutes\_since\_confirmation}}{240}\right)$$

$$\text{Source Weight} = \begin{cases} 
1.0 & \text{Ping (verified by pharmacist reply)} \\ 
0.7 & \text{Manual (direct portal toggle by chemist)} \\ 
0.5 & \text{CSV (periodic inventory upload)} \\ 
0.2 & \text{Unverified (inferred or stale initial record)} 
\end{cases}$$

$$\text{Score} = 100 \times \left(0.5 \times \text{Freshness} \times \text{Source Weight} + 0.3 \times \text{Pharmacy Accuracy} + 0.2 \times \text{Pharmacy Response Rate}\right)$$

### Confidence Badges

| Score Range | Badge Label | Visual Indicator | Meaning |
| :--- | :--- | :--- | :--- |
| **75 – 100** | **Confirmed recently** | Pine Green Badge | Confirmed via live ping or recent store update within last 4 hours. High accuracy store. |
| **40 – 74** | **Likely available** | Amber / Saffron Badge | Inventory reported recently or store has reliable track record. |
| **< 40** | **Unverified** | Muted Grey Badge | Stale record or low verification history. Auto-Ping recommended. |

---

## 4. Technology Stack (100% Free Tier, No Paid APIs)

- **Backend:** Python 3.11+ with **FastAPI**, **SQLite** with WAL mode, and **rapidfuzz** for fast phonetic & string distance matching.
- **Frontend:** **React 18+**, **Vite**, modern clean CSS Modules or Tailwind CSS.
- **Maps:** **Leaflet** with **OpenStreetMap** tile layers (completely free, no Google Maps API card required).
- **Optional AI Query Understanding:** Google Gemini free API (`gemini-1.5-flash` or `gemini-2.0-flash`) isolated behind an optional feature flag (`ENABLE_GEMINI=true`) for conversational natural-language parsing (e.g., "stomach pain medicine near me"). Falls back 100% gracefully to rapidfuzz salt-lookup when disabled or offline.
- **Local Dev Experience:** The entire stack must run locally with two simple commands (e.g. `npm run dev` in frontend and `uvicorn main:app --reload` in backend).

---

## 5. API Contract (Prefix: `/api`)

All endpoints return JSON. In case of errors, the payload **strictly** conforms to:
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description of the error."
  }
}
```

### Endpoints

| Method | Endpoint | Description | Request Body / Query Params | Response Sample |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health check | None | `{"status": "ok", "timestamp": "..."}` |
| `GET` | `/medicines/suggest` | Typo-tolerant autocomplete | `?q=parac` | `[{"id": 1, "brand_name": "Calpol 650", "generic_name": "Paracetamol", "strength": "650mg", "form": "Tablet", "match_score": 95}]` |
| `GET` | `/search` | Geo & stock search | `?medicine_id=1&lat=26.9124&lng=75.7873&radius_km=5` | `{"search_id": "uuid", "medicine": {...}, "results": [...]}` |
| `POST` | `/search/{search_id}/ping` | Trigger auto-ping to top 3 | None | `{"ping_batch_id": "uuid", "pings_sent": 3}` |
| `GET` | `/pings/{ping_batch_id}/status`| Poll or stream ping status | None | `{"batch_id": "uuid", "statuses": [{"ping_id": 10, "pharmacy_id": 2, "status": "yes"}]}` |
| `POST` | `/pings/{ping_id}/reply` | Chemist replies to ping | `{"reply": "yes" \| "no"}` | `{"success": true, "updated_at": "..."}` |
| `POST` | `/reservations` | Request 60-min hold | `{"pharmacy_id": 1, "medicine_id": 1, "quantity": 1, "customer_name": "...", "customer_phone": "..."}` | `{"id": "uuid", "token": "4921", "status": "pending", "expires_at": "..."}` |
| `GET` | `/reservations/{id}` | Check reservation status | None | `{"id": "uuid", "status": "confirmed", "token": "4921", "expires_at": "..."}` |
| `PATCH`| `/reservations/{id}` | Pharmacist accepts/rejects | `{"status": "confirmed" \| "rejected" \| "dispensed" \| "cancelled"}` | `{"id": "uuid", "status": "confirmed"}` |
| `POST` | `/pharmacy/login` | Chemist portal auth | `{"pharmacy_id": 1, "pin": "1234"}` | `{"token": "session_token", "pharmacy": {...}}` |
| `GET` | `/pharmacy/{id}/dashboard` | Pharmacy inventory & pings | Header Auth / Session | `{"pending_pings": [...], "active_reservations": [...], "inventory": [...]}` |
| `PUT` | `/pharmacy/{id}/inventory` | Update stock & price | `{"medicine_id": 1, "status": "in_stock", "price": 32.50}` | `{"success": true}` |
| `POST` | `/reports` | Community report wrong stock | `{"pharmacy_id": 1, "medicine_id": 1, "reason": "out_of_stock"}` | `{"success": true}` |
| `GET` | `/insights/unmet-demand` | Chemist view of lost sales | `?pharmacy_id=1` | `{"unmet_demands": [{"medicine_name": "Amoxicillin 500mg", "search_count": 42, "unfulfilled": 38}]}` |

---

## 6. Design System & Aesthetics (Anti-AI Aesthetics)

MediFind deliberately rejects cookie-cutter generic tech styles:
- **Prohibited:**
  - ❌ NO generic purple-to-blue linear gradients.
  - ❌ NO translucent frosted glassmorphism (`backdrop-filter: blur(20px)`).
  - ❌ NO emoji as functional icons.
  - ❌ NO Latin `Lorem ipsum` placeholder text.
  - ❌ NO generic 3D floating illustrations or hero stock art.
- **Color Palette:**
  - **Deep Pine Green** (`#1B4332`, `#082F1E`): Anchors credibility, clinical authority, and calm reassurance.
  - **Cream Paper Background** (`#FBF9F5`, `#F4EFE6`): Tactile warmth, reduces clinical glare, reminiscent of a trusted physical prescription pad.
  - **Saffron Accent** (`#E76F51`, `#D97706`): Used with disciplined restraint for badges, urgent action alerts, and live countdowns.
  - **Ink-Black Text** (`#18181B`, `#27272A`): Crisp readability with high contrast.
- **Typography:**
  - Headings: **Fraunces** (Google Fonts) — distinctive, warm, editorial serif with character.
  - Body & UI: **Inter** or **DM Sans** (Google Fonts) — ultra-clean, legible microcopy with tabular number alignment (`font-variant-numeric: tabular-nums`).
- **Tactile Microcopy & Local Flavor:**
  - Microcopy written in simple Indian English.
  - Indian Rupee symbol (`₹`) formatted properly (`₹45.00`).
  - Believable nomenclature: *"Chemist"*, *"Medical Store"*, *"Jan Aushadhi Kendra"*, *"Strip of 10 tablets"*.
  - Clean 1px solid borders (`#E5E0D8`) with subtle paper texture styling.
