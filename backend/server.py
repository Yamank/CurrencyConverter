from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---- Currency master list (code -> name + ISO country code for flag) ----
CURRENCIES: Dict[str, Dict[str, str]] = {
    "USD": {"name": "United States Dollar", "country": "US", "symbol": "$"},
    "EUR": {"name": "Euro", "country": "EU", "symbol": "€"},
    "GBP": {"name": "British Pound", "country": "GB", "symbol": "£"},
    "JPY": {"name": "Japanese Yen", "country": "JP", "symbol": "¥"},
    "AUD": {"name": "Australian Dollar", "country": "AU", "symbol": "A$"},
    "CAD": {"name": "Canadian Dollar", "country": "CA", "symbol": "C$"},
    "CHF": {"name": "Swiss Franc", "country": "CH", "symbol": "Fr"},
    "CNY": {"name": "Chinese Yuan", "country": "CN", "symbol": "¥"},
    "HKD": {"name": "Hong Kong Dollar", "country": "HK", "symbol": "HK$"},
    "NZD": {"name": "New Zealand Dollar", "country": "NZ", "symbol": "NZ$"},
    "SEK": {"name": "Swedish Krona", "country": "SE", "symbol": "kr"},
    "KRW": {"name": "South Korean Won", "country": "KR", "symbol": "₩"},
    "SGD": {"name": "Singapore Dollar", "country": "SG", "symbol": "S$"},
    "NOK": {"name": "Norwegian Krone", "country": "NO", "symbol": "kr"},
    "MXN": {"name": "Mexican Peso", "country": "MX", "symbol": "$"},
    "INR": {"name": "Indian Rupee", "country": "IN", "symbol": "₹"},
    "RUB": {"name": "Russian Ruble", "country": "RU", "symbol": "₽"},
    "ZAR": {"name": "South African Rand", "country": "ZA", "symbol": "R"},
    "TRY": {"name": "Turkish Lira", "country": "TR", "symbol": "₺"},
    "BRL": {"name": "Brazilian Real", "country": "BR", "symbol": "R$"},
    "TWD": {"name": "Taiwan Dollar", "country": "TW", "symbol": "NT$"},
    "DKK": {"name": "Danish Krone", "country": "DK", "symbol": "kr"},
    "PLN": {"name": "Polish Zloty", "country": "PL", "symbol": "zł"},
    "THB": {"name": "Thai Baht", "country": "TH", "symbol": "฿"},
    "IDR": {"name": "Indonesian Rupiah", "country": "ID", "symbol": "Rp"},
    "HUF": {"name": "Hungarian Forint", "country": "HU", "symbol": "Ft"},
    "CZK": {"name": "Czech Koruna", "country": "CZ", "symbol": "Kč"},
    "ILS": {"name": "Israeli Shekel", "country": "IL", "symbol": "₪"},
    "CLP": {"name": "Chilean Peso", "country": "CL", "symbol": "$"},
    "PHP": {"name": "Philippine Peso", "country": "PH", "symbol": "₱"},
    "AED": {"name": "UAE Dirham", "country": "AE", "symbol": "د.إ"},
    "COP": {"name": "Colombian Peso", "country": "CO", "symbol": "$"},
    "SAR": {"name": "Saudi Riyal", "country": "SA", "symbol": "﷼"},
    "MYR": {"name": "Malaysian Ringgit", "country": "MY", "symbol": "RM"},
    "RON": {"name": "Romanian Leu", "country": "RO", "symbol": "lei"},
    "ARS": {"name": "Argentine Peso", "country": "AR", "symbol": "$"},
    "VND": {"name": "Vietnamese Dong", "country": "VN", "symbol": "₫"},
    "EGP": {"name": "Egyptian Pound", "country": "EG", "symbol": "£"},
    "PKR": {"name": "Pakistani Rupee", "country": "PK", "symbol": "₨"},
    "NGN": {"name": "Nigerian Naira", "country": "NG", "symbol": "₦"},
    "BDT": {"name": "Bangladeshi Taka", "country": "BD", "symbol": "৳"},
    "UAH": {"name": "Ukrainian Hryvnia", "country": "UA", "symbol": "₴"},
    "KES": {"name": "Kenyan Shilling", "country": "KE", "symbol": "KSh"},
    "MAD": {"name": "Moroccan Dirham", "country": "MA", "symbol": "د.م."},
    "QAR": {"name": "Qatari Riyal", "country": "QA", "symbol": "﷼"},
    "KWD": {"name": "Kuwaiti Dinar", "country": "KW", "symbol": "د.ك"},
    "BHD": {"name": "Bahraini Dinar", "country": "BH", "symbol": ".د.ب"},
    "OMR": {"name": "Omani Rial", "country": "OM", "symbol": "﷼"},
    "JOD": {"name": "Jordanian Dinar", "country": "JO", "symbol": "د.ا"},
    "LKR": {"name": "Sri Lankan Rupee", "country": "LK", "symbol": "Rs"},
    "ISK": {"name": "Icelandic Krona", "country": "IS", "symbol": "kr"},
    "BGN": {"name": "Bulgarian Lev", "country": "BG", "symbol": "лв"},
    "HRK": {"name": "Croatian Kuna", "country": "HR", "symbol": "kn"},
    "RSD": {"name": "Serbian Dinar", "country": "RS", "symbol": "дин"},
    "DZD": {"name": "Algerian Dinar", "country": "DZ", "symbol": "د.ج"},
    "TND": {"name": "Tunisian Dinar", "country": "TN", "symbol": "د.ت"},
    "LBP": {"name": "Lebanese Pound", "country": "LB", "symbol": "ل.ل"},
    "SYP": {"name": "Syrian Pound", "country": "SY", "symbol": "£"},
    "IQD": {"name": "Iraqi Dinar", "country": "IQ", "symbol": "ع.د"},
    "IRR": {"name": "Iranian Rial", "country": "IR", "symbol": "﷼"},
    "AFN": {"name": "Afghan Afghani", "country": "AF", "symbol": "؋"},
    "NPR": {"name": "Nepalese Rupee", "country": "NP", "symbol": "₨"},
    "MMK": {"name": "Myanmar Kyat", "country": "MM", "symbol": "K"},
    "KHR": {"name": "Cambodian Riel", "country": "KH", "symbol": "៛"},
    "LAK": {"name": "Lao Kip", "country": "LA", "symbol": "₭"},
    "MNT": {"name": "Mongolian Tugrik", "country": "MN", "symbol": "₮"},
    "KZT": {"name": "Kazakhstani Tenge", "country": "KZ", "symbol": "₸"},
    "UZS": {"name": "Uzbekistani Som", "country": "UZ", "symbol": "сўм"},
    "AZN": {"name": "Azerbaijani Manat", "country": "AZ", "symbol": "₼"},
    "GEL": {"name": "Georgian Lari", "country": "GE", "symbol": "₾"},
    "AMD": {"name": "Armenian Dram", "country": "AM", "symbol": "֏"},
    "BYN": {"name": "Belarusian Ruble", "country": "BY", "symbol": "Br"},
    "MDL": {"name": "Moldovan Leu", "country": "MD", "symbol": "L"},
    "ALL": {"name": "Albanian Lek", "country": "AL", "symbol": "L"},
    "MKD": {"name": "Macedonian Denar", "country": "MK", "symbol": "ден"},
    "BAM": {"name": "Bosnia Mark", "country": "BA", "symbol": "KM"},
    "GHS": {"name": "Ghanaian Cedi", "country": "GH", "symbol": "₵"},
    "TZS": {"name": "Tanzanian Shilling", "country": "TZ", "symbol": "TSh"},
    "UGX": {"name": "Ugandan Shilling", "country": "UG", "symbol": "USh"},
    "ETB": {"name": "Ethiopian Birr", "country": "ET", "symbol": "Br"},
    "RWF": {"name": "Rwandan Franc", "country": "RW", "symbol": "FRw"},
    "XOF": {"name": "West African CFA", "country": "SN", "symbol": "Fr"},
    "XAF": {"name": "Central African CFA", "country": "CM", "symbol": "Fr"},
    "MUR": {"name": "Mauritian Rupee", "country": "MU", "symbol": "₨"},
    "BWP": {"name": "Botswana Pula", "country": "BW", "symbol": "P"},
    "NAD": {"name": "Namibian Dollar", "country": "NA", "symbol": "$"},
    "ZMW": {"name": "Zambian Kwacha", "country": "ZM", "symbol": "ZK"},
    "MZN": {"name": "Mozambican Metical", "country": "MZ", "symbol": "MT"},
    "AOA": {"name": "Angolan Kwanza", "country": "AO", "symbol": "Kz"},
    "PEN": {"name": "Peruvian Sol", "country": "PE", "symbol": "S/."},
    "UYU": {"name": "Uruguayan Peso", "country": "UY", "symbol": "$U"},
    "PYG": {"name": "Paraguayan Guarani", "country": "PY", "symbol": "₲"},
    "BOB": {"name": "Bolivian Boliviano", "country": "BO", "symbol": "Bs."},
    "VES": {"name": "Venezuelan Bolívar", "country": "VE", "symbol": "Bs."},
    "GTQ": {"name": "Guatemalan Quetzal", "country": "GT", "symbol": "Q"},
    "HNL": {"name": "Honduran Lempira", "country": "HN", "symbol": "L"},
    "NIO": {"name": "Nicaraguan Córdoba", "country": "NI", "symbol": "C$"},
    "CRC": {"name": "Costa Rican Colón", "country": "CR", "symbol": "₡"},
    "DOP": {"name": "Dominican Peso", "country": "DO", "symbol": "RD$"},
    "JMD": {"name": "Jamaican Dollar", "country": "JM", "symbol": "J$"},
    "TTD": {"name": "Trinidad Dollar", "country": "TT", "symbol": "TT$"},
    "BBD": {"name": "Barbadian Dollar", "country": "BB", "symbol": "Bds$"},
    "BSD": {"name": "Bahamian Dollar", "country": "BS", "symbol": "B$"},
    "BZD": {"name": "Belize Dollar", "country": "BZ", "symbol": "BZ$"},
    "XCD": {"name": "East Caribbean Dollar", "country": "AG", "symbol": "$"},
    "CUP": {"name": "Cuban Peso", "country": "CU", "symbol": "$"},
    "HTG": {"name": "Haitian Gourde", "country": "HT", "symbol": "G"},
    "PAB": {"name": "Panamanian Balboa", "country": "PA", "symbol": "B/."},
    "FJD": {"name": "Fijian Dollar", "country": "FJ", "symbol": "FJ$"},
    "PGK": {"name": "Papua New Guinean Kina", "country": "PG", "symbol": "K"},
    "WST": {"name": "Samoan Tala", "country": "WS", "symbol": "T"},
    "TOP": {"name": "Tongan Paʻanga", "country": "TO", "symbol": "T$"},
    "VUV": {"name": "Vanuatu Vatu", "country": "VU", "symbol": "VT"},
    "SBD": {"name": "Solomon Islands Dollar", "country": "SB", "symbol": "SI$"},
    "XPF": {"name": "CFP Franc", "country": "PF", "symbol": "₣"},
    "BTN": {"name": "Bhutanese Ngultrum", "country": "BT", "symbol": "Nu"},
    "MVR": {"name": "Maldivian Rufiyaa", "country": "MV", "symbol": "Rf"},
    "BND": {"name": "Brunei Dollar", "country": "BN", "symbol": "B$"},
    "MOP": {"name": "Macanese Pataca", "country": "MO", "symbol": "MOP$"},
    "KGS": {"name": "Kyrgyzstani Som", "country": "KG", "symbol": "сом"},
    "TJS": {"name": "Tajikistani Somoni", "country": "TJ", "symbol": "ЅМ"},
    "TMT": {"name": "Turkmenistani Manat", "country": "TM", "symbol": "T"},
    "SDG": {"name": "Sudanese Pound", "country": "SD", "symbol": "ج.س."},
    "SSP": {"name": "South Sudanese Pound", "country": "SS", "symbol": "£"},
    "SOS": {"name": "Somali Shilling", "country": "SO", "symbol": "Sh"},
    "DJF": {"name": "Djiboutian Franc", "country": "DJ", "symbol": "Fdj"},
    "ERN": {"name": "Eritrean Nakfa", "country": "ER", "symbol": "Nfk"},
    "GMD": {"name": "Gambian Dalasi", "country": "GM", "symbol": "D"},
    "GNF": {"name": "Guinean Franc", "country": "GN", "symbol": "FG"},
    "LRD": {"name": "Liberian Dollar", "country": "LR", "symbol": "L$"},
    "LSL": {"name": "Lesotho Loti", "country": "LS", "symbol": "L"},
    "SZL": {"name": "Swazi Lilangeni", "country": "SZ", "symbol": "L"},
    "MWK": {"name": "Malawian Kwacha", "country": "MW", "symbol": "MK"},
    "MGA": {"name": "Malagasy Ariary", "country": "MG", "symbol": "Ar"},
    "KMF": {"name": "Comorian Franc", "country": "KM", "symbol": "CF"},
    "SCR": {"name": "Seychellois Rupee", "country": "SC", "symbol": "₨"},
    "CDF": {"name": "Congolese Franc", "country": "CD", "symbol": "FC"},
    "BIF": {"name": "Burundian Franc", "country": "BI", "symbol": "FBu"},
    "CVE": {"name": "Cape Verdean Escudo", "country": "CV", "symbol": "$"},
    "STN": {"name": "São Tomé Dobra", "country": "ST", "symbol": "Db"},
    "LYD": {"name": "Libyan Dinar", "country": "LY", "symbol": "ل.د"},
    "YER": {"name": "Yemeni Rial", "country": "YE", "symbol": "﷼"},
    "ZWL": {"name": "Zimbabwean Dollar", "country": "ZW", "symbol": "Z$"},
    "ANG": {"name": "Netherlands Antillean Guilder", "country": "CW", "symbol": "ƒ"},
    "AWG": {"name": "Aruban Florin", "country": "AW", "symbol": "ƒ"},
    "SRD": {"name": "Surinamese Dollar", "country": "SR", "symbol": "$"},
    "GYD": {"name": "Guyanese Dollar", "country": "GY", "symbol": "G$"},
    "FKP": {"name": "Falkland Pound", "country": "FK", "symbol": "£"},
    "GIP": {"name": "Gibraltar Pound", "country": "GI", "symbol": "£"},
    "SHP": {"name": "Saint Helena Pound", "country": "SH", "symbol": "£"},
    "JEP": {"name": "Jersey Pound", "country": "JE", "symbol": "£"},
    "GGP": {"name": "Guernsey Pound", "country": "GG", "symbol": "£"},
    "IMP": {"name": "Manx Pound", "country": "IM", "symbol": "£"},
    "KYD": {"name": "Cayman Dollar", "country": "KY", "symbol": "CI$"},
    "BMD": {"name": "Bermudian Dollar", "country": "BM", "symbol": "$"},
    "XDR": {"name": "Special Drawing Rights", "country": "UN", "symbol": "SDR"},
}

# In-memory cache for rates (refreshed on demand)
RATES_CACHE: Dict[str, Dict] = {}
CACHE_TTL_MIN = 30


# ---- Models ----
class CurrencyInfo(BaseModel):
    code: str
    name: str
    country: str
    symbol: str


class RatesResponse(BaseModel):
    base: str
    rates: Dict[str, float]
    updated_at: str
    source: str


class HistoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_code: str
    to_code: str
    amount: float
    result: float
    rate: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class HistoryCreate(BaseModel):
    from_code: str
    to_code: str
    amount: float
    result: float
    rate: float


class FavoriteEntry(BaseModel):
    code: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FavoriteCreate(BaseModel):
    code: str


class TimeseriesPoint(BaseModel):
    date: str
    rate: float


class TimeseriesResponse(BaseModel):
    base: str
    target: str
    points: List[TimeseriesPoint]
    source: str


# ---- Helpers ----
def _fetch_latest_from_api(base: str) -> Dict:
    """Fetch latest rates from open.er-api.com (free, no key)."""
    url = f"https://open.er-api.com/v6/latest/{base}"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()
    if data.get("result") != "success":
        raise RuntimeError(f"Rate provider error: {data.get('error-type', 'unknown')}")
    return {
        "base": data["base_code"],
        "rates": data["rates"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "open.er-api.com",
    }


def _is_cache_fresh(entry: Dict) -> bool:
    try:
        ts = datetime.fromisoformat(entry["updated_at"])
        return datetime.now(timezone.utc) - ts < timedelta(minutes=CACHE_TTL_MIN)
    except Exception:
        return False


# ---- Routes ----
@api_router.get("/")
async def root():
    return {"message": "Currency Converter API", "version": "1.0"}


@api_router.get("/currencies", response_model=List[CurrencyInfo])
async def get_currencies():
    return [CurrencyInfo(code=k, **v) for k, v in CURRENCIES.items()]


@api_router.get("/rates/latest", response_model=RatesResponse)
async def get_latest_rates(base: str = Query("USD"), force: bool = Query(False)):
    base = base.upper()
    cached = RATES_CACHE.get(base)
    if cached and not force and _is_cache_fresh(cached):
        return RatesResponse(**cached)
    try:
        data = _fetch_latest_from_api(base)
        RATES_CACHE[base] = data
        # Also persist a snapshot for trending
        try:
            await db.rate_snapshots.insert_one({
                "base": base,
                "rates": data["rates"],
                "captured_at": datetime.now(timezone.utc),
            })
        except Exception as e:
            logger.warning(f"snapshot persist failed: {e}")
        return RatesResponse(**data)
    except Exception as e:
        logger.error(f"rate fetch failed: {e}")
        if cached:
            return RatesResponse(**cached)
        raise HTTPException(status_code=502, detail=f"Failed to fetch rates: {e}")


@api_router.get("/rates/timeseries", response_model=TimeseriesResponse)
async def get_timeseries(
    base: str = Query("USD"),
    target: str = Query("EUR"),
    days: int = Query(30, ge=2, le=365),
):
    """Historical timeseries via Frankfurter (free ECB-based, ~33 currencies).
    For unsupported pairs returns synthesized smooth series anchored on current rate."""
    base = base.upper()
    target = target.upper()
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    try:
        url = f"https://api.frankfurter.app/{start.isoformat()}..{end.isoformat()}?from={base}&to={target}"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            rates = data.get("rates", {})
            if rates:
                points = sorted(
                    [TimeseriesPoint(date=d, rate=v[target]) for d, v in rates.items() if target in v],
                    key=lambda p: p.date,
                )
                if points:
                    return TimeseriesResponse(base=base, target=target, points=points, source="frankfurter.app")
    except Exception as e:
        logger.warning(f"frankfurter failed: {e}")

    # Fallback: synthesize using current rate with deterministic mild variation
    try:
        latest = await get_latest_rates(base=base)
        current = latest.rates.get(target)
        if current is None:
            raise HTTPException(status_code=404, detail="Target currency not supported")
        import math
        points = []
        for i in range(days + 1):
            d = (start + timedelta(days=i)).isoformat()
            # ±2% smooth oscillation
            offset = math.sin(i / 5.0) * 0.015 + math.cos(i / 11.0) * 0.008
            points.append(TimeseriesPoint(date=d, rate=round(current * (1 + offset), 6)))
        return TimeseriesResponse(base=base, target=target, points=points, source="synthesized")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---- History ----
@api_router.post("/history", response_model=HistoryEntry)
async def add_history(entry: HistoryCreate):
    obj = HistoryEntry(**entry.dict())
    await db.history.insert_one(obj.dict())
    return obj


@api_router.get("/history", response_model=List[HistoryEntry])
async def list_history(limit: int = Query(50, ge=1, le=500)):
    docs = await db.history.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [HistoryEntry(**d) for d in docs]


@api_router.delete("/history/{entry_id}")
async def delete_history(entry_id: str):
    res = await db.history.delete_one({"id": entry_id})
    return {"deleted": res.deleted_count}


@api_router.delete("/history")
async def clear_history():
    res = await db.history.delete_many({})
    return {"deleted": res.deleted_count}


# ---- Favorites ----
@api_router.post("/favorites", response_model=FavoriteEntry)
async def add_favorite(fav: FavoriteCreate):
    code = fav.code.upper()
    if code not in CURRENCIES:
        raise HTTPException(status_code=400, detail="Unknown currency")
    existing = await db.favorites.find_one({"code": code}, {"_id": 0})
    if existing:
        return FavoriteEntry(**existing)
    obj = FavoriteEntry(code=code)
    await db.favorites.insert_one(obj.dict())
    return obj


@api_router.get("/favorites", response_model=List[FavoriteEntry])
async def list_favorites():
    docs = await db.favorites.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [FavoriteEntry(**d) for d in docs]


@api_router.delete("/favorites/{code}")
async def remove_favorite(code: str):
    res = await db.favorites.delete_one({"code": code.upper()})
    return {"deleted": res.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
