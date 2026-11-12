#!/usr/bin/env python3
"""
MediFind Database Seeder
Creates and populates database/medifind.db with:
- 14 Fictional pharmacies (3 are 24x7) around configurable city center
- 70 Real-world medicines (generic salts & top Indian brands)
- Inventory with realistic status spread, confirmation freshness & sources
- Realistic searches, pings, and reports to drive the unmet demand view

Usage:
    python database/seed.py [--reset]
"""

import os
import sys
import math
import random
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta

# Script & Database Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "medifind.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "database", "schema.sql")

# Configurable City Center via Environment Variables
CITY_NAME = os.getenv("CITY_NAME", "Jaipur")
CITY_LAT = float(os.getenv("CITY_LAT", "26.9124"))
CITY_LNG = float(os.getenv("CITY_LNG", "75.7873"))

# Seed reproducibility
random.seed(42)

# 14 Believable Fictional Pharmacies
PHARMACIES_DATA = [
    {
        "name": "Sharma Medical & General Store",
        "address": "Shop 12, Shopping Centre, Sector 3, Raja Park",
        "locality": "Raja Park",
        "city": CITY_NAME,
        "lat_offset": 0.0092, "lng_offset": 0.0210,
        "phone": "+91 98290 55501",
        "owner_name": "Ramesh Sharma",
        "pin_code": "302004",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "08:30 - 22:30",
        "accuracy": 0.94,
        "response_rate": 0.90,
    },
    {
        "name": "Sanjivani Chemist & 24x7 Medicos",
        "address": "Opp. SMS Hospital Emergency Gate, Tonk Road",
        "locality": "Tonk Road",
        "city": CITY_NAME,
        "lat_offset": -0.0150, "lng_offset": 0.0050,
        "phone": "+91 98290 55502",
        "owner_name": "Dr. Alok Sanjiv",
        "pin_code": "302005",
        "login_pin": "1234",
        "is_24x7": 1,
        "opening_hours": "Open 24 Hours",
        "accuracy": 0.97,
        "response_rate": 0.96,
    },
    {
        "name": "Aarogya Kendra & General Chemist",
        "address": "Plot 45, Madhyam Marg, Mansarovar",
        "locality": "Mansarovar",
        "city": CITY_NAME,
        "lat_offset": -0.0520, "lng_offset": -0.0310,
        "phone": "+91 98290 55503",
        "owner_name": "Sunita Meena",
        "pin_code": "302020",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "09:00 - 21:00",
        "accuracy": 0.91,
        "response_rate": 0.83,
    },
    {
        "name": "Central Health Chemist - C-Scheme",
        "address": "G-4, Crystal Palm Road, Sardar Patel Marg, C-Scheme",
        "locality": "C-Scheme",
        "city": CITY_NAME,
        "lat_offset": 0.0025, "lng_offset": -0.0120,
        "phone": "+91 98290 55504",
        "owner_name": "Vikramaditya Singhania",
        "pin_code": "302001",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "07:00 - 23:00",
        "accuracy": 0.96,
        "response_rate": 0.93,
    },
    {
        "name": "LifeCare 24x7 Emergency Chemist",
        "address": "Near Trauma Centre, Sawai Man Singh Rd, Ashok Nagar",
        "locality": "Ashok Nagar",
        "city": CITY_NAME,
        "lat_offset": -0.0080, "lng_offset": 0.0040,
        "phone": "+91 98290 55505",
        "owner_name": "Harish Chawla",
        "pin_code": "302001",
        "login_pin": "1234",
        "is_24x7": 1,
        "opening_hours": "Open 24 Hours",
        "accuracy": 0.98,
        "response_rate": 0.97,
    },
    {
        "name": "Gupta Drug Store",
        "address": "Lane 4, Near University Main Gate, Bapu Nagar",
        "locality": "Bapu Nagar",
        "city": CITY_NAME,
        "lat_offset": -0.0220, "lng_offset": 0.0150,
        "phone": "+91 98290 55506",
        "owner_name": "Rajesh Gupta",
        "pin_code": "302015",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "08:00 - 22:00",
        "accuracy": 0.88,
        "response_rate": 0.85,
    },
    {
        "name": "Noble Chemist & Healthcare",
        "address": "Calgiri Marg, Opp. District Hospital, Malviya Nagar",
        "locality": "Malviya Nagar",
        "city": CITY_NAME,
        "lat_offset": -0.0580, "lng_offset": 0.0280,
        "phone": "+91 98290 55507",
        "owner_name": "Anil Pareek",
        "pin_code": "302017",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "09:00 - 22:30",
        "accuracy": 0.93,
        "response_rate": 0.89,
    },
    {
        "name": "City Health Medical Hall",
        "address": "Shop 88, Near Ajmeri Gate, MI Road",
        "locality": "MI Road",
        "city": CITY_NAME,
        "lat_offset": 0.0110, "lng_offset": -0.0050,
        "phone": "+91 98290 55508",
        "owner_name": "Mahendra Agarwal",
        "pin_code": "302001",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "09:30 - 21:30",
        "accuracy": 0.89,
        "response_rate": 0.80,
    },
    {
        "name": "Pink City 24-Hour Medicos",
        "address": "Opp. Metro Pillar 92, New Sanganer Road, Sodala",
        "locality": "Sodala",
        "city": CITY_NAME,
        "lat_offset": -0.0180, "lng_offset": -0.0240,
        "phone": "+91 98290 55509",
        "owner_name": "Devendra Rathore",
        "pin_code": "302006",
        "login_pin": "1234",
        "is_24x7": 1,
        "opening_hours": "Open 24 Hours",
        "accuracy": 0.95,
        "response_rate": 0.94,
    },
    {
        "name": "Shree Krishna Chemist",
        "address": "Amrapali Circle, Vaishali Nagar",
        "locality": "Vaishali Nagar",
        "city": CITY_NAME,
        "lat_offset": 0.0040, "lng_offset": -0.0480,
        "phone": "+91 98290 55510",
        "owner_name": "Gopal Verma",
        "pin_code": "302021",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "08:00 - 23:00",
        "accuracy": 0.91,
        "response_rate": 0.87,
    },
    {
        "name": "Gopalpura Medicos & Healthcare",
        "address": "Main Gopalpura Bypass, Near Riddhi Siddhi Chauraha",
        "locality": "Gopalpura",
        "city": CITY_NAME,
        "lat_offset": -0.0420, "lng_offset": -0.0120,
        "phone": "+91 98290 55511",
        "owner_name": "Neeraj Mathur",
        "pin_code": "302018",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "09:00 - 22:00",
        "accuracy": 0.87,
        "response_rate": 0.84,
    },
    {
        "name": "Marwar Chemists",
        "address": "Shop 104, Haldiyon Ka Rasta, Johari Bazaar",
        "locality": "Johari Bazaar",
        "city": CITY_NAME,
        "lat_offset": 0.0210, "lng_offset": 0.0180,
        "phone": "+91 98290 55512",
        "owner_name": "Bhanwar Lal Jain",
        "pin_code": "302003",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "09:30 - 20:30",
        "accuracy": 0.93,
        "response_rate": 0.82,
    },
    {
        "name": "Rajasthan Health Mart",
        "address": "Near Mahal Road, Jagatpura",
        "locality": "Jagatpura",
        "city": CITY_NAME,
        "lat_offset": -0.0750, "lng_offset": 0.0450,
        "phone": "+91 98290 55513",
        "owner_name": "Jitendra Sharma",
        "pin_code": "302025",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "08:30 - 22:00",
        "accuracy": 0.86,
        "response_rate": 0.81,
    },
    {
        "name": "Goyal Medicine Corner",
        "address": "Sector 2 Central Spine, Vidyadhar Nagar",
        "locality": "Vidyadhar Nagar",
        "city": CITY_NAME,
        "lat_offset": 0.0650, "lng_offset": -0.0150,
        "phone": "+91 98290 55514",
        "owner_name": "Suresh Goyal",
        "pin_code": "302039",
        "login_pin": "1234",
        "is_24x7": 0,
        "opening_hours": "08:00 - 22:30",
        "accuracy": 0.92,
        "response_rate": 0.88,
    },
]

# 70 Believable Indian Market Medicines
MEDICINES_DATA = [
    # Analgesics & Antipyretics
    ("Calpol 650", "Paracetamol", "650mg", "Tablet", "GSK Consumer Healthcare", 32.50, 0, "Strip of 15 tablets"),
    ("Dolo 650", "Paracetamol", "650mg", "Tablet", "Micro Labs", 34.00, 0, "Strip of 15 tablets"),
    ("Crocin 500 Advance", "Paracetamol", "500mg", "Tablet", "Haleon India", 22.00, 0, "Strip of 20 tablets"),
    ("Combiflam", "Ibuprofen 400mg + Paracetamol 325mg", "400mg/325mg", "Tablet", "Sanofi India", 48.00, 0, "Strip of 20 tablets"),
    ("Meftal-Spas", "Mefenamic Acid 250mg + Dicyclomine 10mg", "250mg/10mg", "Tablet", "Blue Cross Laboratories", 52.00, 1, "Strip of 10 tablets"),
    ("Zerodol-P", "Aceclofenac 100mg + Paracetamol 325mg", "100mg/325mg", "Tablet", "Ipca Laboratories", 65.00, 1, "Strip of 10 tablets"),
    ("Zerodol-SP", "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", "100mg/325mg/15mg", "Tablet", "Ipca Laboratories", 118.00, 1, "Strip of 10 tablets"),
    ("Voveran 50 GE", "Diclofenac Sodium", "50mg", "Tablet", "Novartis India", 82.00, 1, "Strip of 15 tablets"),
    ("Volini Gel", "Diclofenac Diethylamine + Methyl Salicylate", "30g", "Ointment", "Sun Pharma", 145.00, 0, "Tube of 30g"),
    ("Moov Pain Relief Specialist", "Turpentine Oil + Eucalyptus Oil", "50g", "Ointment", "Reckitt Benckiser", 185.00, 0, "Tube of 50g"),

    # Gastrointestinal & Antacids
    ("Pan 40", "Pantoprazole", "40mg", "Tablet", "Alkem Laboratories", 155.00, 1, "Strip of 15 tablets"),
    ("Pantocid 40", "Pantoprazole", "40mg", "Tablet", "Sun Pharma", 168.00, 1, "Strip of 15 tablets"),
    ("Pan-D", "Pantoprazole 40mg + Domperidone 30mg SR", "40mg/30mg", "Capsule", "Alkem Laboratories", 199.00, 1, "Strip of 15 capsules"),
    ("Omez 20", "Omeprazole", "20mg", "Capsule", "Dr. Reddy's Laboratories", 64.00, 1, "Strip of 20 capsules"),
    ("Rantac 150", "Ranitidine Hydrochloride", "150mg", "Tablet", "J.B. Chemicals", 42.00, 1, "Strip of 30 tablets"),
    ("Digene Mint Gel", "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone", "200ml", "Syrup", "Abbott Healthcare", 142.00, 0, "Bottle of 200ml"),
    ("Gelusil MPS Liquid", "Aluminium Hydroxide + Magnesium + Dimethicone", "200ml", "Syrup", "Pfizer Limited", 136.00, 0, "Bottle of 200ml"),
    ("Pudin Hara Active", "Spearmint & Peppermint Essential Oils", "30ml", "Drops", "Dabur India", 60.00, 0, "Bottle of 30ml"),
    ("Eno Fruit Salt Regular", "Sodium Bicarbonate + Citric Acid", "100g", "Sachet", "Haleon India", 95.00, 0, "Bottle of 100g"),
    ("Electral ORS", "Oral Rehydration Salts (WHO Formula)", "21.8g", "Sachet", "FDC Limited", 23.50, 0, "Sachet of 21.8g"),
    ("Prolyte ORS Orange", "WHO Oral Rehydration Ready Drink", "200ml", "Syrup", "Cipla Limited", 35.00, 0, "Tetrapack of 200ml"),
    ("Sporlac DS", "Lactic Acid Bacillus 120 Million Spores", "120M Spores", "Tablet", "Sanzyme Biogen", 98.00, 0, "Strip of 10 tablets"),
    ("Econorm 250", "Saccharomyces boulardii", "250mg", "Sachet", "Dr. Reddy's Laboratories", 310.00, 0, "Box of 6 sachets"),
    ("Vomikind 4 MD", "Ondansetron (Mouth Dissolving)", "4mg", "Tablet", "Mankind Pharma", 44.00, 1, "Strip of 10 tablets"),
    ("Emeset 4", "Ondansetron Hydrochloride", "4mg", "Tablet", "Cipla Limited", 46.00, 1, "Strip of 10 tablets"),
    ("Domstal 10", "Domperidone", "10mg", "Tablet", "Torrent Pharmaceuticals", 39.00, 1, "Strip of 10 tablets"),

    # Cardiovascular & Blood Pressure
    ("Amlong 5", "Amlodipine Besylate", "5mg", "Tablet", "Micro Labs", 46.00, 1, "Strip of 15 tablets"),
    ("Telma 40", "Telmisartan", "40mg", "Tablet", "Glenmark Pharmaceuticals", 240.00, 1, "Strip of 30 tablets"),
    ("Telma-H", "Telmisartan 40mg + Hydrochlorothiazide 12.5mg", "40mg/12.5mg", "Tablet", "Glenmark Pharmaceuticals", 165.00, 1, "Strip of 15 tablets"),
    ("Cilacar 10", "Cilnidipine", "10mg", "Tablet", "J.B. Chemicals", 112.00, 1, "Strip of 15 tablets"),
    ("Atorva 10", "Atorvastatin Calcium", "10mg", "Tablet", "Zydus Lifesciences", 115.00, 1, "Strip of 15 tablets"),
    ("Rosuvas 10", "Rosuvastatin Calcium", "10mg", "Tablet", "Sun Pharma", 195.00, 1, "Strip of 15 tablets"),
    ("Ecosprin 75", "Aspirin (Enteric Coated)", "75mg", "Tablet", "USV Private Limited", 11.50, 1, "Strip of 14 tablets"),
    ("Ecosprin AV 75/20", "Aspirin 75mg + Atorvastatin 20mg", "75mg/20mg", "Capsule", "USV Private Limited", 78.00, 1, "Strip of 15 capsules"),
    ("Clopilet 75", "Clopidogrel", "75mg", "Tablet", "Sun Pharma", 110.00, 1, "Strip of 15 tablets"),

    # Diabetes Management
    ("Glycomet 500 SR", "Metformin Hydrochloride Sustained Release", "500mg", "Tablet", "USV Private Limited", 44.00, 1, "Strip of 20 tablets"),
    ("Glycomet GP 1", "Metformin 500mg + Glimepiride 1mg", "500mg/1mg", "Tablet", "USV Private Limited", 132.00, 1, "Strip of 15 tablets"),
    ("Glycomet GP 2", "Metformin 500mg + Glimepiride 2mg", "500mg/2mg", "Tablet", "USV Private Limited", 168.00, 1, "Strip of 15 tablets"),
    ("Janumet 50/500", "Sitagliptin 50mg + Metformin 500mg", "50mg/500mg", "Tablet", "MSD Pharmaceuticals", 420.00, 1, "Strip of 15 tablets"),
    ("Galvus Met 50/500", "Vildagliptin 50mg + Metformin 500mg", "50mg/500mg", "Tablet", "Novartis India", 310.00, 1, "Strip of 15 tablets"),

    # Antibiotics & Anti-Infectives
    ("Azithral 500", "Azithromycin", "500mg", "Tablet", "Alembic Pharmaceuticals", 128.00, 1, "Strip of 5 tablets"),
    ("Azee 500", "Azithromycin", "500mg", "Tablet", "Cipla Limited", 130.00, 1, "Strip of 5 tablets"),
    ("Augmentin 625 Duo", "Amoxicillin 500mg + Clavulanic Acid 125mg", "625mg", "Tablet", "GSK Pharmaceuticals", 215.00, 1, "Strip of 10 tablets"),
    ("Moxikind-CV 625", "Amoxicillin 500mg + Clavulanic Acid 125mg", "625mg", "Tablet", "Mankind Pharma", 175.00, 1, "Strip of 10 tablets"),
    ("Cifran 500", "Ciprofloxacin", "500mg", "Tablet", "Sun Pharma", 46.00, 1, "Strip of 10 tablets"),
    ("Mahacef 200", "Cefixime Trihydrate", "200mg", "Tablet", "Mankind Pharma", 112.00, 1, "Strip of 10 tablets"),
    ("Taxim-O 200", "Cefixime", "200mg", "Tablet", "Alkem Laboratories", 120.00, 1, "Strip of 10 tablets"),
    ("Monocef 1g", "Ceftriaxone Sodium", "1g", "Injection", "Aristo Pharmaceuticals", 68.00, 1, "Vial with sterile water"),
    ("Metrogyl 400", "Metronidazole", "400mg", "Tablet", "J.B. Chemicals", 24.00, 1, "Strip of 15 tablets"),
    ("Norflox-TZ", "Norfloxacin 400mg + Tinidazole 600mg", "400mg/600mg", "Tablet", "Cipla Limited", 92.00, 1, "Strip of 10 tablets"),

    # Respiratory, Antiallergics & Cough
    ("Okacet", "Cetirizine Hydrochloride", "10mg", "Tablet", "Cipla Limited", 21.00, 0, "Strip of 10 tablets"),
    ("Cetzine", "Cetirizine Dihydrochloride", "10mg", "Tablet", "Dr. Reddy's Laboratories", 22.00, 0, "Strip of 10 tablets"),
    ("Allegra 120", "Fexofenadine Hydrochloride", "120mg", "Tablet", "Sanofi India", 218.00, 0, "Strip of 10 tablets"),
    ("Montair-LC", "Montelukast Sodium 10mg + Levocetirizine 5mg", "10mg/5mg", "Tablet", "Cipla Limited", 280.00, 1, "Strip of 15 tablets"),
    ("Montek-LC", "Montelukast Sodium 10mg + Levocetirizine 5mg", "10mg/5mg", "Tablet", "Sun Pharma", 275.00, 1, "Strip of 15 tablets"),
    ("Ascoril D Plus", "Dextromethorphan + Phenylephrine + Chlorpheniramine", "100ml", "Syrup", "Glenmark Pharmaceuticals", 128.00, 0, "Bottle of 100ml"),
    ("Benadryl Cough Formula", "Diphenhydramine + Ammonium Chloride", "100ml", "Syrup", "Johnson & Johnson", 132.00, 0, "Bottle of 100ml"),
    ("Grilinctus Syrup", "Dextromethorphan + Chlorpheniramine + Guaifenesin", "100ml", "Syrup", "Franco-Indian Pharmaceuticals", 122.00, 0, "Bottle of 100ml"),
    ("Asthalin Inhaler", "Salbutamol (100mcg per puff)", "100mcg", "Inhaler", "Cipla Limited", 158.00, 1, "Device of 200 actuations"),
    ("Budecort 200 Inhaler", "Budesonide (200mcg per actuation)", "200mcg", "Inhaler", "Cipla Limited", 365.00, 1, "Device of 200 actuations"),

    # Thyroid & Hormones
    ("Thyronorm 50mcg", "Levothyroxine Sodium", "50mcg", "Tablet", "Abbott India", 145.00, 1, "Bottle of 120 tablets"),
    ("Thyronorm 100mcg", "Levothyroxine Sodium", "100mcg", "Tablet", "Abbott India", 175.00, 1, "Bottle of 120 tablets"),
    ("Eltroxin 25mcg", "Levothyroxine Sodium", "25mcg", "Tablet", "GSK India", 130.00, 1, "Bottle of 120 tablets"),

    # Vitamins, Minerals & Supplements
    ("Shelcal 500", "Calcium 500mg + Vitamin D3 250IU", "500mg/250IU", "Tablet", "Torrent Pharmaceuticals", 131.00, 0, "Strip of 15 tablets"),
    ("Becosules Z", "B-Complex Forte with Vitamin C and Zinc", "Capsule", "Capsule", "Pfizer Limited", 51.00, 0, "Strip of 20 capsules"),
    ("Neurobion Forte", "Vitamin B1, B6 and Vitamin B12", "Tablet", "Tablet", "Procter & Gamble", 42.50, 0, "Strip of 30 tablets"),
    ("Calcirol 60000 IU", "Cholecalciferol (Vitamin D3)", "60000 IU", "Sachet", "Cadila Pharmaceuticals", 52.00, 0, "Sachet of 1g"),
    ("Uprise-D3 60K", "Cholecalciferol (Vitamin D3 Soft Gel)", "60000 IU", "Capsule", "Alkem Laboratories", 138.00, 0, "Strip of 4 capsules"),
    ("Limcee 500 Chewable", "Vitamin C (Ascorbic Acid)", "500mg", "Tablet", "Abbott Healthcare", 24.50, 0, "Strip of 15 tablets"),
    ("Zincovit", "Multivitamin & Multimineral with Grape Seed Extract", "Tablet", "Tablet", "Apex Laboratories", 110.00, 0, "Strip of 15 tablets"),

    # Dermatology & Antifungals
    ("Betadine 10% Solution", "Povidone-Iodine 10% w/v", "100ml", "Solution", "Win-Medicare", 130.00, 0, "Bottle of 100ml"),
    ("Soframycin Skin Cream", "Framycetin Sulphate 1% w/w", "30g", "Cream", "Sanofi India", 62.00, 0, "Tube of 30g"),
    ("Candid Dusting Powder", "Clotrimazole 1% w/w", "100g", "Powder", "Glenmark Pharmaceuticals", 160.00, 0, "Dispenser of 100g"),
    ("Canditral 200", "Itraconazole", "200mg", "Capsule", "Glenmark Pharmaceuticals", 245.00, 1, "Strip of 10 capsules"),
]


def init_db(conn):
    """Executes schema.sql to ensure clean tables and views exist."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)


def hash_pin(pin: str, salt: str = None) -> str:
    """Generate salted PBKDF2-SHA256 hash for pharmacy login PIN."""
    if not salt:
        salt = secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()
    return f"{salt}:{h}"


def seed_pharmacies(conn):
    """Inserts 14 fictional pharmacies around city coordinates."""
    cursor = conn.cursor()
    pharmacy_ids = []
    
    for p in PHARMACIES_DATA:
        lat = round(CITY_LAT + p["lat_offset"], 6)
        lng = round(CITY_LNG + p["lng_offset"], 6)
        pin_hash = hash_pin(p.get("login_pin", "1234"))
        
        cursor.execute("""
            INSERT INTO pharmacies (
                name, address, locality, city, lat, lng, phone,
                owner_name, pin_code, login_pin, pin_hash, is_24x7, opening_hours,
                accuracy, response_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["name"], p["address"], p["locality"], p["city"], lat, lng, p["phone"],
            p["owner_name"], p["pin_code"], p["login_pin"], pin_hash, p["is_24x7"], p["opening_hours"],
            p["accuracy"], p["response_rate"]
        ))
        pharmacy_ids.append(cursor.lastrowid)
        
    return pharmacy_ids


def seed_medicines(conn):
    """Inserts 70 popular Indian medicines."""
    cursor = conn.cursor()
    medicine_ids = []
    
    for med in MEDICINES_DATA:
        cursor.execute("""
            INSERT INTO medicines (
                brand_name, generic_name, strength, form, manufacturer,
                mrp, requires_prescription, pack_size
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, med)
        medicine_ids.append(cursor.lastrowid)
        
    return medicine_ids


def seed_inventory(conn, pharmacy_ids, medicine_ids):
    """
    Creates realistic inventory distribution across pharmacies:
    - Status: ~72% in_stock, ~14% low_stock, ~14% out_of_stock
    - Confirmation time: spread from 2 minutes ago to 3 days ago (4320 mins)
    - Source: ping (15%), manual (45%), csv (30%), unverified (10%)
    """
    cursor = conn.cursor()
    sources = ["ping", "manual", "csv", "unverified"]
    source_weights = [0.15, 0.45, 0.30, 0.10]
    
    statuses = ["in_stock", "low_stock", "out_of_stock"]
    status_weights = [0.72, 0.14, 0.14]
    
    now = datetime.utcnow()
    total_inventory = 0
    
    # Pre-fetch mrps
    cursor.execute("SELECT id, mrp FROM medicines")
    mrp_map = dict(cursor.fetchall())
    
    for pharmacy_id in pharmacy_ids:
        # Each pharmacy carries between 45 and 68 medicines
        carry_count = random.randint(48, 66)
        selected_medicines = random.sample(medicine_ids, carry_count)
        
        for medicine_id in selected_medicines:
            mrp = mrp_map[medicine_id]
            # Realistic discount of 0% to 15% off MRP
            discount = random.choice([0.0, 0.05, 0.08, 0.10, 0.12, 0.15])
            price = round(mrp * (1.0 - discount), 2)
            
            status = random.choices(statuses, weights=status_weights)[0]
            source = random.choices(sources, weights=source_weights)[0]
            
            # Minutes ago: some confirmed very recently, some hours ago, some 2-3 days ago
            if source == "ping":
                # Pings are usually recent (2 mins to 6 hours)
                minutes_ago = random.randint(2, 360)
            elif source == "manual":
                # Manual edits in last 12 hours
                minutes_ago = random.randint(15, 720)
            elif source == "csv":
                # CSV uploads 12 to 48 hours ago
                minutes_ago = random.randint(720, 2880)
            else:
                # Unverified 1 to 3 days ago
                minutes_ago = random.randint(1440, 4320)
                
            confirmed_dt = now - timedelta(minutes=minutes_ago)
            confirmed_at_str = confirmed_dt.strftime("%Y-%m-%d %H:%M:%S")
            
            quantity = 0 if status == "out_of_stock" else (random.randint(1, 4) if status == "low_stock" else random.randint(8, 40))
            
            cursor.execute("""
                INSERT INTO inventory (
                    pharmacy_id, medicine_id, status, price, stock_quantity,
                    source, confirmed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pharmacy_id, medicine_id, status, price, quantity,
                source, confirmed_at_str, confirmed_at_str
            ))
            total_inventory += 1
            
    return total_inventory


def seed_demo_activity(conn, pharmacy_ids, medicine_ids):
    """
    Inserts initial realistic searches, pings, reports and reservations
    to populate unmet-demand analytics, history, and pharmacist demo views.
    """
    cursor = conn.cursor()
    now = datetime.utcnow()
    
    # 1. Searches & unmet demand activity
    demo_searches = [
        ("Amoxicillin 500mg", 43, 20),      # Augmentin / Moxikind
        ("Paracetamol 650", 1, 35),         # Calpol 650
        ("Azithromycin 500", 41, 18),       # Azithral 500
        ("Cetirizine 10mg", 51, 24),        # Okacet
        ("Pantoprazole 40mg", 11, 28),      # Pan 40
        ("Salbutamol Inhaler", 59, 15),     # Asthalin Inhaler
        ("Oral Rehydration Salts", 20, 19), # Electral
    ]
    
    for term, med_idx, count in demo_searches:
        med_id = medicine_ids[med_idx - 1]
        for i in range(count):
            search_id = f"search-seed-{med_id}-{i+1}"
            delta_mins = random.randint(10, 1440)
            s_time = (now - timedelta(minutes=delta_mins)).strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("""
                INSERT OR IGNORE INTO searches (id, medicine_id, query_text, lat, lng, radius_km, results_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (search_id, med_id, term, CITY_LAT, CITY_LNG, 5.0, random.randint(3, 10), s_time))

    # 2. Pings (some answered 'yes', some answered 'no', some pending)
    sample_med = medicine_ids[0]  # Calpol 650
    batch_uuid = "batch-demo-4920"
    sample_search_id = f"search-seed-{sample_med}-1"
    for i in range(3):
        p_id = pharmacy_ids[i]
        status = ["yes", "yes", "no"][i]
        resp_sec = [45, 92, 120][i]
        created = (now - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
        replied = (now - timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO pings (batch_id, search_id, pharmacy_id, medicine_id, status, response_time_seconds, created_at, replied_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (batch_uuid, sample_search_id, p_id, sample_med, status, resp_sec, created, replied))

    # 3. Community Reports for wrong stock (to give realistic unmet demand)
    for i in range(5):
        p_id = pharmacy_ids[random.randint(0, 13)]
        m_id = medicine_ids[random.randint(0, 15)]
        cursor.execute("""
            INSERT INTO reports (pharmacy_id, medicine_id, reason, user_note, resolved, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (p_id, m_id, "out_of_stock", "Chemist said finished this morning", 0, (now - timedelta(hours=random.randint(2, 24))).strftime("%Y-%m-%d %H:%M:%S")))

    # 4. Active sample reservation (60-minute hold demonstration)
    res_id = "res-demo-001"
    res_expires = (now + timedelta(minutes=48)).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT OR IGNORE INTO reservations (id, token, pharmacy_id, medicine_id, quantity, customer_name, customer_phone, status, notes, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        res_id, "4829", pharmacy_ids[1], medicine_ids[0], 2,
        "Pooja Verma", "+91 98765 43210", "confirmed",
        "Urgent hold for elderly father", res_expires, now.strftime("%Y-%m-%d %H:%M:%S")
    ))


def run_seeder(reset=False, target_db_path=None):
    """Executes the seeding process."""
    effective_db = target_db_path or DB_PATH
    os.makedirs(os.path.dirname(effective_db), exist_ok=True)

    conn = sqlite3.connect(effective_db, timeout=30.0)
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 15000;")
    
    # Clear existing data cleanly in child-to-parent order
    if reset:
        cursor = conn.cursor()
        for tbl in ["reports", "reservations", "pings", "searches", "inventory", "medicines", "pharmacies"]:
            cursor.execute(f"DELETE FROM {tbl};")
        try:
            cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('pharmacies', 'medicines', 'inventory', 'pings', 'reports');")
        except Exception:
            pass
        conn.commit()

    conn.execute("PRAGMA foreign_keys = ON;")
    
    print("[*] Initializing database schema from schema.sql...")
    init_db(conn)
    
    # Check if already seeded
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM pharmacies")
    existing_p = cursor.fetchone()[0]
    
    if existing_p > 0 and not reset:
        print(f"[i] Database already contains {existing_p} pharmacies. Run with --reset to re-seed.")
        conn.close()
        return

    print("[*] Seeding 14 fictional pharmacies...")
    pharmacy_ids = seed_pharmacies(conn)
    
    print("[*] Seeding 70 Indian market medicines...")
    medicine_ids = seed_medicines(conn)
    
    print("[*] Seeding inventory rows with confidence spread...")
    inventory_count = seed_inventory(conn, pharmacy_ids, medicine_ids)
    
    print("[*] Seeding demo activity (searches, pings, unmet demand, reservations)...")
    seed_demo_activity(conn, pharmacy_ids, medicine_ids)
    
    conn.commit()
    
    # Verification query
    cursor.execute("SELECT COUNT(*) FROM pharmacies")
    p_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM pharmacies WHERE is_24x7 = 1")
    p_24x7_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM medicines")
    m_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM medicines WHERE requires_prescription = 1")
    rx_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM inventory")
    inv_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM view_unmet_demand WHERE search_count > 0")
    unmet_count = cursor.fetchone()[0]

    conn.close()
    
    print("\n" + "=" * 50)
    print(" MediFind Database Seed Complete")
    print("=" * 50)
    print(f" City Center       : {CITY_NAME} (Lat: {CITY_LAT}, Lng: {CITY_LNG})")
    print(f" Total Pharmacies  : {p_count} ({p_24x7_count} open 24x7)")
    print(f" Total Medicines   : {m_count} ({rx_count} prescription required, {m_count - rx_count} OTC)")
    print(f" Total Inventory   : {inv_count} tracked stock entries")
    print(f" Unmet Demand Items: {unmet_count} actively tracked in view")
    print(f" Database Location : {DB_PATH}")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    do_reset = "--reset" in sys.argv
    run_seeder(reset=do_reset)
