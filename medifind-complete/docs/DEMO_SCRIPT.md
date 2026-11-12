# MediFind — 3-Minute Competition Demo Script & Judge Q&A Guide

> **Tagline:** *"We don't list medicines, we verify them."*  
> **Target Audience:** Hackathon Judges, Product Evaluators, HealthTech Investors  
> **Demo Setup:** Laptop (Patient App) + Smartphone on the same Wi-Fi (Pharmacist Simulator)  

---

## 1. Setup & Pre-Flight Checklist (30 seconds before demo)

1. On Laptop, run `.\run.ps1` from the project root.
2. Note your detected LAN IP (e.g., `http://10.16.228.173:5173`).
3. On Laptop browser: Open [http://localhost:5173](http://localhost:5173).
4. On Mobile Phone (connected to the same Wi-Fi): Open `http://<YOUR_LAN_IP>:5173/pharmacist-sim` (or keep side-by-side in a separate mobile tab).
5. Ensure database is clean. (Optional: hit [http://localhost:5173/demo-reset](http://localhost:5173/demo-reset) to reset in 1.4s).

---

## 2. Timed 3-Minute Demo Walkthrough

### ⏱️ Minute 0:00 – 1:00: The Problem & Live Verified Search

* **Speaker (Hook):**  
  > *"Every month in India, millions of people walk into three different medical stores trying to find an urgent antibiotic or inhaler, only to hear: 'Bhaiya, stock khatam ho gaya.' Existing delivery apps either take 4 hours, require a minimum cart value, or cancel 40 minutes after ordering because their catalog is a stale spreadsheet.*  
  > *MediFind solves this with one core thesis: We don't list medicines, we verify them."*

* **Action:**  
  1. Show laptop screen on [http://localhost:5173](http://localhost:5173).
  2. In search box, type with intentional typo: `augmntin` (Augmentin 625 Duo) or `paractamol`.
  3. Show typo-tolerant autocomplete rendering salt composition (*Amoxicillin 500mg + Clavulanic Acid 125mg*).
  4. Select **Augmentin 625 Duo Tablet**.

* **Speaker:**  
  > *"Notice the ranking. We don't rank pharmacies by who paid for ads. We rank them by distance and our mathematical Stock Confidence Score. Sanjivani Chemist shows 84% 'Likely Available' because their stock was confirmed 3 hours ago."*

---

### ⏱️ Minute 1:00 – 2:00: The Live Auto-Ping Loop (Two-Device Magic)

* **Speaker:**  
  > *"When a patient needs a medicine urgently, 'likely available' isn't good enough. Watch this."*

* **Action:**  
  1. Click **"Verify Right Now (Auto-Ping)"** on the results banner.
  2. Banner immediately shifts: *"Checking with 3 nearby pharmacies in real-time... Waiting for pharmacists to reply."*
  3. Pick up the **Smartphone** (or switch to the Pharmacist Simulator window).
  4. Show the incoming ping on the phone:  
     **"Customer checking stock: Augmentin 625 Duo Tablet. Do you have it right now?"**
  5. Tap the large green button: **"YES, IN STOCK"**.
  6. Direct judges' eyes back to the Laptop screen.

* **Speaker:**  
  > *"Within 2 seconds, with zero page reloads, Central Health Chemist flashes green, jumps to the #1 spot, and its score jumps to 99.4 — 'Confirmed recently'. The patient now knows with 99% certainty that the medicine is physically in that drawer right now."*

---

### ⏱️ Minute 2:00 – 3:00: 60-Minute Pickup Hold & Chemist Empowerment

* **Speaker:**  
  > *"Now that the medicine is verified, how do we guarantee it isn't sold before the patient reaches the shop? We offer a 60-minute pickup reservation."*

* **Action:**  
  1. Click **"Reserve 60m Hold"** on Central Health Chemist.
  2. Fill in Name (*"Pooja Sharma"*) and Phone (*"9829012345"*). Note the prescription disclaimer.
  3. Submit. Instantly show the **4-digit pickup code (`4829`)** and live countdown timer on `/reservation/:id`.
  4. Switch to Chemist Partner Portal at [http://localhost:5173/pharmacy](http://localhost:5173/pharmacy).
  5. Log in with Demo PIN `1234`.
  6. Click **"Accept Hold"** or **"Mark Collected"**.
  7. Click the **"Unmet Market Demand"** tab to reveal the local demand analytics chart.

* **Speaker (Closing):**  
  > *"For neighborhood chemists, MediFind is not an aggregator trying to kill their business—it's their digital lifeline. Our Unmet Demand view shows them exactly which medicines patients searched for nearby that were out of stock this week, helping them restock intelligently.*  
  > *MediFind is 100% free-tier ready, requires zero paid APIs, protects patient privacy with coarse coordinates, and never dispenses prescription drugs without in-person pharmacist verification."*

---

## 3. Judge Q&A Cheat Sheet (Short, Punchy Answers)

### Q1: How do you compare with Tata 1mg, Apollo 24/7, PharmEasy, or Blinkit?
* **Answer:**  
  *"1mg and PharmEasy are centralized e-commerce warehouses with 4-to-48-hour delivery windows and high delivery fees. Quick-commerce (Blinkit/Zepto) only stocks ~200 top FMCG OTC products, not critical antibiotics or specialized chronic medicines.*  
  *MediFind doesn't deliver or sell medicines. We connect you to the independent chemist 400 meters away who already has the medicine on the shelf right now, verified via Auto-Ping, with a 60-minute hold."*

### Q2: Where does the initial stock data come from?
* **Answer:**  
  *"Independent chemists update inventory through three zero-friction channels: (1) replying 'Yes/No' to 1-tap WhatsApp pings (source weight: 1.0), (2) a mobile portal with 1-tap stock toggles (source weight: 0.7), and (3) weekly billing CSV exports from existing POS software like Marg or Busy (source weight: 0.5).*  
  *Crucially, if data is stale, our freshness formula decays over 240 minutes, degrading the score until re-verified."*

### Q3: What is your monetization / business model?
* **Answer:**  
  *"MediFind is strictly free for patients and free for basic chemist listings to maximize community coverage. Monetization comes from two B2B channels:*  
  1. *Chemist Premium Portal (₹499/month): Advanced neighborhood unmet-demand intelligence, reorder forecasting, and priority hold processing.*  
  2. *Pharma Distributor Insights: Anonymized macro-demand deficit heatmaps sold to regional pharmaceutical stockists to optimize supply chain delivery routes."*

### Q4: What about drug regulation, Schedule H/X drugs, and patient privacy?
* **Answer:**  
  *"MediFind is fully compliant with Indian Drugs and Cosmetics Act & NDPS rules because **MediFind does not sell or dispense medicines**. It is an information and reservation platform. All prescription drugs explicitly display a mandatory disclaimer, and the licensed pharmacist must physically verify the doctor's prescription in person before dispensing.*  
  *For privacy, user searches are logged only with coarse coordinates (rounded to 3 decimal places, ~1.1km precision) and never store patient identity, prescriptions, or medical histories in search logs."*

### Q5: What if pharmacists don't reply to pings?
* **Answer:**  
  *"We incentivize replies through our algorithm. A pharmacy's Stock Confidence Score directly incorporates its historical response rate (20% weight) and accuracy (30% weight). Pharmacists who answer pings promptly rank at the top of their neighborhood's search results and receive high-margin pickup customers. Furthermore, our pings timeout automatically after 90 seconds so patients are never left hanging."*
