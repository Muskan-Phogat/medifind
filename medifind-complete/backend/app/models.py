from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Error Models ---
class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail


# --- Medicine Models ---
class MedicineSuggestion(BaseModel):
    id: int
    brand_name: str
    generic_name: str
    strength: str
    form: str
    manufacturer: str
    mrp: float
    requires_prescription: bool
    pack_size: str
    match_score: float

class MedicineDetail(BaseModel):
    id: int
    brand_name: str
    generic_name: str
    strength: str
    form: str
    manufacturer: str
    mrp: float
    requires_prescription: bool
    pack_size: str
    prescription_notice: Optional[str] = None


# --- Search Models ---
class PharmacySearchResult(BaseModel):
    pharmacy_id: int
    pharmacy_name: str
    address: str
    locality: str
    city: str
    phone: str
    owner_name: str
    is_24x7: bool
    opening_hours: str
    lat: float
    lng: float
    distance_km: float
    stock_status: str  # in_stock, low_stock, out_of_stock
    price: float
    stock_quantity: int
    source: str        # ping, manual, csv, unverified
    confirmed_at: str
    minutes_since_confirmation: int
    confidence_score: float
    confidence_label: str  # "Confirmed recently", "Likely available", "Unverified"
    open_now: bool
    is_stale: bool

class SearchResponse(BaseModel):
    search_id: str
    medicine: MedicineDetail
    total_results: int
    results: List[PharmacySearchResult]
    has_unmet_demand: bool


# --- Ping Models ---
class PingItemStatus(BaseModel):
    ping_id: int
    pharmacy_id: int
    pharmacy_name: str
    phone: str
    status: str       # pending, yes, no, expired, waiting, no_reply
    created_at: str
    replied_at: Optional[str] = None
    response_time_seconds: Optional[int] = None

class PingBatchResponse(BaseModel):
    batch_id: str
    search_id: str
    medicine_id: int
    medicine_name: str
    pings_sent: int
    pings: List[PingItemStatus]

class PingStatusResponse(BaseModel):
    batch_id: str
    statuses: List[PingItemStatus]

class PingReplyRequest(BaseModel):
    reply: str  # yes or no

class PingReplyResponse(BaseModel):
    success: bool
    ping_id: int
    status: str
    updated_at: str


# --- Reservation Models ---
class ReservationCreate(BaseModel):
    pharmacy_id: int
    medicine_id: int
    quantity: int = Field(default=1, ge=1)
    customer_name: str = Field(min_length=2)
    customer_phone: str = Field(min_length=8)
    notes: Optional[str] = None

class ReservationResponse(BaseModel):
    id: str
    token: str
    pharmacy_id: int
    pharmacy_name: Optional[str] = None
    medicine_id: int
    medicine_name: Optional[str] = None
    quantity: int
    customer_name: str
    customer_phone: str
    status: str
    notes: Optional[str] = None
    expires_at: str
    created_at: str
    updated_at: str

class ReservationStatusUpdate(BaseModel):
    status: str  # accepted/confirmed, rejected, collected/dispensed, cancelled


# --- Pharmacy Auth & Portal ---
class PharmacyLoginRequest(BaseModel):
    pharmacy_id: int
    pin: str

class PharmacyLoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    pharmacy: Dict[str, Any]

class InventoryUpdateRequest(BaseModel):
    medicine_id: int
    status: str = Field(pattern="^(in_stock|low_stock|out_of_stock)$")
    price: Optional[float] = Field(default=None, ge=0.0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)


# --- Reports ---
class ReportCreate(BaseModel):
    pharmacy_id: int
    medicine_id: int
    reason: str = Field(pattern="^(out_of_stock|price_mismatch|store_closed|other)$")
    user_note: Optional[str] = None

class ReportResponse(BaseModel):
    success: bool
    report_id: int
    message: str


# --- Insights ---
class UnmetDemandItem(BaseModel):
    medicine_id: int
    medicine_name: str
    generic_name: str
    strength: str
    form: str
    search_count: int
    unfulfilled: int
    last_searched_at: Optional[str] = None

class UnmetDemandResponse(BaseModel):
    unmet_demands: List[UnmetDemandItem]
