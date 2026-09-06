"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  FileText,
  Edit3,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  X,
  Sliders,
  Receipt,
  ChevronDown,
  ChevronUp,
  Zap,
  Droplets,
  Gauge,
  Mail,
  Wifi,
  Flame,
  ParkingSquare,
  PackagePlus,
  Loader2,
  Info,
  ArrowRight,
  Printer,
  Repeat,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { BillingRecord, BillingTypeRecord, BillingFrequency } from "@/lib/billingsStore";

function formatBillingCycle(cycle?: string): string {
  if (!cycle) return "Monthly";
  const trimmed = cycle.trim();
  switch (trimmed.toLowerCase()) {
    case "quarterly": return "Quarterly";
    case "annually":
    case "annual": return "Annually";
    case "one_time":
    case "one-time": return "One-time";
    case "monthly": return "Monthly";
    default: return trimmed;
  }
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const QUARTER_OPTIONS = [
  { value: "Q1", label: "Q1 (Jan – Mar)" },
  { value: "Q2", label: "Q2 (Apr – Jun)" },
  { value: "Q3", label: "Q3 (Jul – Sep)" },
  { value: "Q4", label: "Q4 (Oct – Dec)" },
];

function getCycleMultiplier(cycle?: string): number {
  if (!cycle) return 1;
  const c = cycle.toLowerCase().trim();
  if (c === "quarterly" || c.startsWith("q1") || c.startsWith("q2") || c.startsWith("q3") || c.startsWith("q4") || c.includes("quarter")) return 3;
  if (c === "annually" || c === "annual" || /^\d{4}$/.test(c) || c.startsWith("year")) return 12;
  return 1;
}

function computeCycleValue(
  freq: BillingFrequency,
  month: string,
  quarter: string,
  year: string
): string {
  switch (freq) {
    case "monthly":
      return `${month} ${year}`;
    case "quarterly":
      return `${quarter} ${year}`;
    case "annually":
      return `${year}`;
    case "one_time":
      return "One-time";
    default:
      return `${month} ${year}`;
  }
}

function parseCycleState(cycleStr?: string, defaultFrequency: BillingFrequency = "monthly") {
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonthIndex = now.getMonth();
  const defaultMonth = MONTH_NAMES[currentMonthIndex] || "January";
  const defaultQuarter = `Q${Math.floor(currentMonthIndex / 3) + 1}`;

  if (!cycleStr) {
    return {
      frequency: defaultFrequency,
      month: defaultMonth,
      quarter: defaultQuarter,
      year: currentYear,
    };
  }

  const str = cycleStr.trim();
  const lower = str.toLowerCase();

  if (lower === "one_time" || lower === "one-time" || lower === "onetime" || lower === "one time") {
    return { frequency: "one_time" as BillingFrequency, month: defaultMonth, quarter: defaultQuarter, year: currentYear };
  }

  if (lower === "quarterly") {
    return { frequency: "quarterly" as BillingFrequency, month: defaultMonth, quarter: defaultQuarter, year: currentYear };
  }

  if (lower === "annually" || lower === "annual") {
    return { frequency: "annually" as BillingFrequency, month: defaultMonth, quarter: defaultQuarter, year: currentYear };
  }

  if (lower === "monthly") {
    return { frequency: "monthly" as BillingFrequency, month: defaultMonth, quarter: defaultQuarter, year: currentYear };
  }

  // Check Quarter: e.g. "Q1 2026" or "Q3 2025"
  const qMatch = str.match(/^(Q[1-4])\s+(\d{4})$/i);
  if (qMatch) {
    return {
      frequency: "quarterly" as BillingFrequency,
      quarter: qMatch[1].toUpperCase(),
      year: qMatch[2],
      month: defaultMonth,
    };
  }

  // Check Annual: e.g. "2026" or "Year 2026"
  const yrMatch = str.match(/^(?:Year\s+)?(\d{4})$/i);
  if (yrMatch) {
    return {
      frequency: "annually" as BillingFrequency,
      year: yrMatch[1],
      quarter: defaultQuarter,
      month: defaultMonth,
    };
  }

  // Check Monthly: e.g. "September 2026" or "Sep 2026"
  const mMatch = str.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (mMatch) {
    const foundMonth = MONTH_NAMES.find((m) => m.toLowerCase().startsWith(mMatch[1].toLowerCase()));
    if (foundMonth) {
      return {
        frequency: "monthly" as BillingFrequency,
        month: foundMonth,
        year: mMatch[2],
        quarter: defaultQuarter,
      };
    }
  }

  return {
    frequency: defaultFrequency,
    month: defaultMonth,
    quarter: defaultQuarter,
    year: currentYear,
  };
}

interface TenantUnitOption {
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  unit_id: number;
  unit_number: string;
  building_name: string;
  monthly_rent?: number;
}

// Extra Charge Types (for flexible additional charges, NOT electricity/water which are structured)
type ExtraChargeType = "flat" | "meter";
type ExtraChargeIcon = "wifi" | "gas" | "parking" | "other";

interface ExtraCharge {
  id: string;
  name: string;
  icon: ExtraChargeIcon;
  type: ExtraChargeType;
  // Flat charge
  amount: string;
  // Meter-based charge
  previous: string;
  current: string;
  rate: string;
  unit_label: string;
}

// Presets for additional charges (electricity/water are handled separately via meterReadings)
const CHARGE_PRESETS: Array<{ name: string; icon: ExtraChargeIcon; type: ExtraChargeType; unit_label: string; rate: string }> = [
  { name: "WiFi / Internet", icon: "wifi", type: "flat", unit_label: "month", rate: "0" },
  { name: "Gas / LPG", icon: "gas", type: "meter", unit_label: "kg", rate: "85.00" },
  { name: "Parking Fee", icon: "parking", type: "flat", unit_label: "month", rate: "0" },
  { name: "Other Charge", icon: "other", type: "flat", unit_label: "units", rate: "0" },
];

function ChargeIconComponent({ icon, className }: { icon: ExtraChargeIcon; className?: string }) {
  const colorMap: Record<ExtraChargeIcon, string> = {
    wifi: "text-indigo-600",
    gas: "text-orange-600",
    parking: "text-slate-600",
    other: "text-gray-600",
  };
  const base = `w-4 h-4 ${colorMap[icon]} ${className || ""}`;
  switch (icon) {
    case "wifi": return <Wifi className={base} />;
    case "gas": return <Flame className={base} />;
    case "parking": return <ParkingSquare className={base} />;
    default: return <DollarSign className={base} />;
  }
}

function makeCharge(overrides: Partial<ExtraCharge> = {}): ExtraCharge {
  return {
    id: `charge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    icon: "other",
    type: "flat",
    amount: "0",
    previous: "0",
    current: "0",
    rate: "0",
    unit_label: "units",
    ...overrides,
  };
}

function computeExtraChargeAmount(c: ExtraCharge): number {
  if (c.type === "flat") return Math.max(0, Number(c.amount) || 0);
  const consumption = Math.max(0, Number(c.current) - Number(c.previous));
  return Math.round(consumption * (Number(c.rate) || 0) * 100) / 100;
}

// Compute meter reading charge amount
function computeMeterAmount(previous: string, current: string, rate: string): number {
  const consumption = Math.max(0, Number(current) - Number(previous));
  return Math.round(consumption * (Number(rate) || 0) * 100) / 100;
}

export default function BillingsPage() {
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'draft' | 'posted' | 'all'
  const [activeTab, setActiveTab] = useState<"draft" | "posted" | "all">(
    "draft",
  );

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal Control States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPostConfirmModalOpen, setIsPostConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingBilling, setEditingBilling] = useState<BillingRecord | null>(
    null,
  );
  const [viewingBilling, setViewingBilling] = useState<BillingRecord | null>(
    null,
  );
  const [postingBilling, setPostingBilling] = useState<BillingRecord | null>(
    null,
  );
  const [deletingBilling, setDeletingBilling] = useState<BillingRecord | null>(
    null,
  );

  // Toast State & Email Sending States
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSendStatementEmail = async (billingId: number, tenantEmail?: string) => {
    setSendingEmailId(billingId);
    try {
      const res = await fetch(`/api/admin/billings/${billingId}/send-statement`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to dispatch statement email");
      showToast(data.message || `Statement PDF emailed to ${tenantEmail || "tenant"}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to dispatch email", "error");
    } finally {
      setSendingEmailId(null);
    }
  };

  // Form Reference Options
  const [tenantsUnits, setTenantsUnits] = useState<TenantUnitOption[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingTypeRecord[]>([]);

  // Form Inputs
  const [formData, setFormData] = useState({
    tenant_id: "",
    unit_id: "",
    billing_type_id: "",
    billing_cycle: "monthly",
    base_amount: "0",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    late_fee_applied: "0",
  });

  // Dedicated Cycle Selection State
  const [cycleFrequency, setCycleFrequency] = useState<BillingFrequency>("monthly");
  const [cycleMonth, setCycleMonth] = useState<string>(() => {
    return MONTH_NAMES[new Date().getMonth()] || "January";
  });
  const [cycleQuarter, setCycleQuarter] = useState<string>(() => {
    return `Q${Math.floor(new Date().getMonth() / 3) + 1}`;
  });
  const [cycleYear, setCycleYear] = useState<string>(() => {
    return new Date().getFullYear().toString();
  });

  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => (currentY - 1 + i).toString());
  }, []);

  // STRUCTURED METER READINGS: Electricity & Water (driven by billing type config)
  const [meterReadings, setMeterReadings] = useState({
    electricity: {
      enabled: false,
      previous: "0",
      current: "0",
      rate: "12.50",
    },
    water: {
      enabled: false,
      previous: "0",
      current: "0",
      rate: "45.00",
    },
  });

  // DYNAMIC ADDITIONAL CHARGES STATE (WiFi, Gas, Parking, custom — not electricity/water)
  const [isChargesAccordionOpen, setIsChargesAccordionOpen] = useState(false);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);
  const [loadingPrevReadings, setLoadingPrevReadings] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live Server-Side Calculation State for Receipt Preview in Form
  const [serverCalculation, setServerCalculation] = useState<{
    base_amount: number;
    raw_base_amount?: number;
    cycle_base_amount?: number;
    cycle_multiplier?: number;
    meter_charges_total?: number;
    extra_charges_total?: number;
    effective_base_amount?: number;
    tax_percentage: number;
    tax_amount: number;
    transfer_fee: number;
    late_fee_applied: number;
    meter_readings?: any;
    total_amount: number;
    due_date: string;
    billing_type_name: string;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Fetch Data
  const fetchBillings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/billings");
      const data = await res.json();
      if (data.success) {
        setBillings(data.billings);
      } else {
        setError(data.error || "Failed to fetch billings");
      }
    } catch (err: any) {
      setError(err.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [tuRes, btRes] = await Promise.all([
        fetch("/api/admin/tenants-units"),
        fetch("/api/admin/billing-types"),
      ]);
      const tuData = await tuRes.json();
      const btData = await btRes.json();

      if (tuData.success) setTenantsUnits(tuData.tenantsUnits || []);
      if (btData.success) setBillingTypes(btData.billingTypes || []);
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  useEffect(() => {
    fetchBillings();
    fetchOptions();
  }, []);

  // Local meter reading helpers
  const localMeterElectricityCharge = useMemo(() => {
    if (!meterReadings.electricity.enabled) return 0;
    return computeMeterAmount(meterReadings.electricity.previous, meterReadings.electricity.current, meterReadings.electricity.rate);
  }, [meterReadings.electricity]);

  const localMeterWaterCharge = useMemo(() => {
    if (!meterReadings.water.enabled) return 0;
    return computeMeterAmount(meterReadings.water.previous, meterReadings.water.current, meterReadings.water.rate);
  }, [meterReadings.water]);

  const localMeterChargesTotal = useMemo(() => {
    return localMeterElectricityCharge + localMeterWaterCharge;
  }, [localMeterElectricityCharge, localMeterWaterCharge]);

  // Extra charge helpers
  const extraChargesTotal = useMemo(() =>
    extraCharges.reduce((sum, c) => sum + computeExtraChargeAmount(c), 0),
    [extraCharges]
  );

  // Total billed amount: base unit rate + submeters + extra charges + fees associated with billing type
  const computedTotalBilled = useMemo(() => {
    if (serverCalculation) {
      // serverCalculation.total_amount already includes cycle base amount, meter charges, taxes, and fees
      return serverCalculation.total_amount + extraChargesTotal;
    }
    const mult = getCycleMultiplier(formData.billing_cycle);
    return (Number(formData.base_amount || 0) * mult) + localMeterChargesTotal + extraChargesTotal;
  }, [serverCalculation, formData.base_amount, formData.billing_cycle, localMeterChargesTotal, extraChargesTotal]);

  const updateExtraCharge = (id: string, patch: Partial<ExtraCharge>, chargesOverride?: ExtraCharge[]) => {
    const next = (chargesOverride || extraCharges).map((c) => c.id === id ? { ...c, ...patch } : c);
    setExtraCharges(next);
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, undefined, formData.billing_cycle);
  };

  const removeExtraCharge = (id: string) => {
    const next = extraCharges.filter((c) => c.id !== id);
    setExtraCharges(next);
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, undefined, formData.billing_cycle);
  };

  const addPresetCharge = (preset: typeof CHARGE_PRESETS[0]) => {
    const newCharge = makeCharge({
      name: preset.name,
      icon: preset.icon,
      type: preset.type,
      unit_label: preset.unit_label,
      rate: preset.rate,
    });
    const next = [...extraCharges, newCharge];
    setExtraCharges(next);
    setIsChargesAccordionOpen(true);
    setShowPresetPicker(false);
  };

  // Fetch previous meter readings for a tenant from their last posted billing
  const fetchPreviousReadingsForTenant = async (tenantId: string) => {
    if (!tenantId) return;
    setLoadingPrevReadings(true);
    try {
      const res = await fetch(`/api/admin/billings`);
      const data = await res.json();
      if (!data.success) return;

      // Find the most recent posted billing for this tenant that has meter readings
      const tenantBillings: BillingRecord[] = (data.billings || [])
        .filter((b: BillingRecord) =>
          b.tenant_id === Number(tenantId) &&
          b.meter_readings_json &&
          (b.status === "posted" || b.status === "overdue" || b.status === "paid")
        )
        .sort((a: BillingRecord, b: BillingRecord) => (b.id || 0) - (a.id || 0));

      if (tenantBillings.length === 0) return;
      const lastBilling = tenantBillings[0];
      let readings: any = lastBilling.meter_readings_json;
      if (typeof readings === "string") {
        try { readings = JSON.parse(readings); } catch { return; }
      }
      if (!readings) return;

      // Auto-fill "previous" in meterReadings from last billing's "current" values
      setMeterReadings((prev) => ({
        electricity: readings.electricity
          ? { ...prev.electricity, previous: String(readings.electricity.current ?? prev.electricity.previous) }
          : prev.electricity,
        water: readings.water
          ? { ...prev.water, previous: String(readings.water.current ?? prev.water.previous) }
          : prev.water,
      }));
    } catch (err) {
      console.error("Failed to fetch previous readings:", err);
    } finally {
      setLoadingPrevReadings(false);
    }
  };

  // Trigger Live Server-Side Calculations for Receipt Preview in Form
  const triggerCalculation = async (
    typeId: string,
    baseAmtStr: string,
    customDueDate?: string,
    readingsOverride?: typeof meterReadings,
    cycleOverride?: string,
  ) => {
    if (!typeId || !baseAmtStr || isNaN(Number(baseAmtStr))) return;
    setCalculating(true);
    const readings = readingsOverride ?? meterReadings;
    const cycle = cycleOverride || formData.billing_cycle || undefined;
    try {
      // Build meter_readings payload from structured meterReadings state
      const readingsPayload: any = {};
      if (readings.electricity.enabled) {
        readingsPayload.electricity = {
          previous: Number(readings.electricity.previous || 0),
          current: Number(readings.electricity.current || 0),
          rate: Number(readings.electricity.rate || 12.5),
        };
      }
      if (readings.water.enabled) {
        readingsPayload.water = {
          previous: Number(readings.water.previous || 0),
          current: Number(readings.water.current || 0),
          rate: Number(readings.water.rate || 45.0),
        };
      }

      const res = await fetch("/api/admin/billings/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_type_id: Number(typeId),
          base_amount: Number(baseAmtStr),
          billing_cycle: cycle,
          custom_due_date: customDueDate || undefined,
          meter_readings: Object.keys(readingsPayload).length > 0 ? readingsPayload : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.calculation) {
        setServerCalculation(data.calculation);
        if (!customDueDate && data.calculation.due_date) {
          setFormData((prev) => ({ ...prev, due_date: data.calculation.due_date }));
        }
      }
    } catch (err) {
      console.error("Server calculation error", err);
    } finally {
      setCalculating(false);
    }
  };

  // Legacy alias
  const updateServerCalculation = triggerCalculation;

  // Filtered Billings
  const filteredBillings = useMemo(() => {
    return billings.filter((item) => {
      // Primary Tab Filter
      if (activeTab === "draft" && item.status !== "draft") return false;
      if (activeTab === "posted" && item.status === "draft") return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          item.id.toString().includes(q) ||
          item.tenant_name?.toLowerCase().includes(q) ||
          item.tenant_email?.toLowerCase().includes(q) ||
          item.unit_number?.toLowerCase().includes(q) ||
          item.building_name?.toLowerCase().includes(q) ||
          item.billing_type_name?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Sub Status Filter
      if (selectedSubStatus !== "all" && item.status !== selectedSubStatus)
        return false;

      // Billing Type filter
      if (
        selectedType !== "all" &&
        item.billing_type_id.toString() !== selectedType
      )
        return false;

      return true;
    });
  }, [billings, activeTab, searchQuery, selectedSubStatus, selectedType]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let draftCount = 0;
    let draftAmount = 0;
    let postedCount = 0;
    let postedAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;

    billings.forEach((item) => {
      const amt = Number(item.amount || 0);
      totalBilled += amt;

      if (item.status === "draft") {
        draftCount++;
        draftAmount += amt;
      } else if (item.status === "posted") {
        postedCount++;
        postedAmount += amt;
      } else if (item.status === "overdue") {
        overdueCount++;
        overdueAmount += amt;
      } else if (item.status === "paid") {
        paidCount++;
        paidAmount += amt;
      }
    });

    const activePostedTotalCount = postedCount + overdueCount + paidCount;

    return {
      totalCount: billings.length,
      totalBilled,
      draftCount,
      draftAmount,
      activePostedTotalCount,
      postedCount,
      postedAmount,
      overdueCount,
      overdueAmount,
      paidCount,
      paidAmount,
    };
  }, [billings]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBilling(null);
    const defaultTenant = tenantsUnits[0];
    const defaultType = billingTypes[0];

    const initialTenantId = defaultTenant
      ? defaultTenant.tenant_id.toString()
      : "";
    const initialUnitId = defaultTenant ? defaultTenant.unit_id.toString() : "";
    const initialTypeId = defaultType ? defaultType.id.toString() : "";
    const initialBaseAmt = defaultTenant?.monthly_rent !== undefined ? defaultTenant.monthly_rent.toString() : "0";
    
    const now = new Date();
    const currMonth = MONTH_NAMES[now.getMonth()] || "January";
    const currQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
    const currYear = now.getFullYear().toString();
    const initialFreq = (defaultType?.frequency || "monthly") as BillingFrequency;
    const initialCycle = computeCycleValue(initialFreq, currMonth, currQuarter, currYear);

    setCycleFrequency(initialFreq);
    setCycleMonth(currMonth);
    setCycleQuarter(currQuarter);
    setCycleYear(currYear);

    setFormData({
      tenant_id: initialTenantId,
      unit_id: initialUnitId,
      billing_type_id: initialTypeId,
      billing_cycle: initialCycle,
      base_amount: initialBaseAmt,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      late_fee_applied: "0",
    });

    // Reset both meter readings and extra charges
    const resetReadings = {
      electricity: {
        enabled: Boolean(defaultType?.has_electricity ?? (defaultType?.has_meter_reading && (defaultType?.electricity_rate_per_unit || defaultType?.name.toLowerCase().includes("electric")))),
        previous: "0",
        current: "0",
        rate: (defaultType?.electricity_rate_per_unit || 12.5).toString(),
      },
      water: {
        enabled: Boolean(defaultType?.has_water ?? (defaultType?.has_meter_reading && (defaultType?.water_rate_per_unit || defaultType?.name.toLowerCase().includes("water")))),
        previous: "0",
        current: "0",
        rate: (defaultType?.water_rate_per_unit || 45).toString(),
      },
    };
    setMeterReadings(resetReadings);

    const hasAnyMeterReading = resetReadings.electricity.enabled || resetReadings.water.enabled;
    setIsChargesAccordionOpen(hasAnyMeterReading);
    setExtraCharges([]);
    setShowPresetPicker(false);
    setFormError(null);
    setIsFormModalOpen(true);
    setServerCalculation(null);

    if (initialTenantId && hasAnyMeterReading) {
      fetchPreviousReadingsForTenant(initialTenantId);
    }

    if (initialTypeId) {
      triggerCalculation(initialTypeId, initialBaseAmt, undefined, resetReadings, initialCycle);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (billing: BillingRecord) => {
    setEditingBilling(billing);
    const baseAmt = (billing.base_amount || billing.amount || 0).toString();
    const billingType = billingTypes.find((bt) => bt.id === billing.billing_type_id);
    const defaultFreq = (billingType?.frequency || "monthly") as BillingFrequency;

    const parsed = parseCycleState(billing.billing_cycle, defaultFreq);
    setCycleFrequency(parsed.frequency);
    setCycleMonth(parsed.month);
    setCycleQuarter(parsed.quarter);
    setCycleYear(parsed.year);

    const currentCycle = billing.billing_cycle || computeCycleValue(parsed.frequency, parsed.month, parsed.quarter, parsed.year);

    setFormData({
      tenant_id: billing.tenant_id.toString(),
      unit_id: billing.unit_id.toString(),
      billing_type_id: billing.billing_type_id.toString(),
      billing_cycle: currentCycle,
      base_amount: baseAmt,
      due_date: billing.due_date,
      late_fee_applied: (billing.late_fee_applied || 0).toString(),
    });

    // Restore meter readings from stored meter_readings_json
    let parsedReadings: any = billing.meter_readings_json;
    if (typeof parsedReadings === "string") {
      try { parsedReadings = JSON.parse(parsedReadings); } catch { parsedReadings = {}; }
    }

    const restoredReadings = {
      electricity: {
        enabled: Boolean(parsedReadings?.electricity),
        previous: String(parsedReadings?.electricity?.previous ?? 0),
        current: String(parsedReadings?.electricity?.current ?? 0),
        rate: String(parsedReadings?.electricity?.rate_per_unit ?? billingType?.electricity_rate_per_unit ?? 12.5),
      },
      water: {
        enabled: Boolean(parsedReadings?.water),
        previous: String(parsedReadings?.water?.previous ?? 0),
        current: String(parsedReadings?.water?.current ?? 0),
        rate: String(parsedReadings?.water?.rate_per_unit ?? billingType?.water_rate_per_unit ?? 45),
      },
    };
    setMeterReadings(restoredReadings);

    setExtraCharges([]);
    setShowPresetPicker(false);
    if (restoredReadings.electricity.enabled || restoredReadings.water.enabled) setIsChargesAccordionOpen(true);

    setFormError(null);
    setIsFormModalOpen(true);
    triggerCalculation(billing.billing_type_id.toString(), baseAmt, billing.due_date, restoredReadings, currentCycle);
  };

  // Handle Tenant Selection Change — auto-fills unit rate and previous readings for electricity/water
  const handleTenantChange = (tenantIdStr: string) => {
    const selectedTU = tenantsUnits.find((tu) => tu.tenant_id.toString() === tenantIdStr);
    const unitRate = selectedTU?.monthly_rent !== undefined ? selectedTU.monthly_rent.toString() : "0";
    setFormData((prev) => ({
      ...prev,
      tenant_id: tenantIdStr,
      unit_id: selectedTU ? selectedTU.unit_id.toString() : prev.unit_id,
      base_amount: unitRate,
    }));
    triggerCalculation(formData.billing_type_id, unitRate, formData.due_date, undefined, formData.billing_cycle);
    // Auto-fill previous readings from tenant's last posted billing if meter readings are enabled
    if (tenantIdStr && (meterReadings.electricity.enabled || meterReadings.water.enabled)) {
      fetchPreviousReadingsForTenant(tenantIdStr);
    }
  };

  // Handle Type Selection Change — auto-configure electricity/water and billing cycle from billing type
  const handleTypeChange = (typeIdStr: string) => {
    const selectedTypeObj = billingTypes.find((bt) => bt.id.toString() === typeIdStr);
    const newFreq = (selectedTypeObj?.frequency || "monthly") as BillingFrequency;
    setCycleFrequency(newFreq);
    const newCycle = computeCycleValue(newFreq, cycleMonth, cycleQuarter, cycleYear);

    setFormData((prev) => ({ 
      ...prev, 
      billing_type_id: typeIdStr,
      billing_cycle: newCycle,
    }));

    const nextReadings = {
      electricity: {
        enabled: Boolean(selectedTypeObj?.has_electricity ?? (selectedTypeObj?.has_meter_reading && (selectedTypeObj?.electricity_rate_per_unit || selectedTypeObj?.name.toLowerCase().includes("electric")))),
        previous: meterReadings.electricity.previous,
        current: meterReadings.electricity.current,
        rate: (selectedTypeObj?.electricity_rate_per_unit || meterReadings.electricity.rate).toString(),
      },
      water: {
        enabled: Boolean(selectedTypeObj?.has_water ?? (selectedTypeObj?.has_meter_reading && (selectedTypeObj?.water_rate_per_unit || selectedTypeObj?.name.toLowerCase().includes("water")))),
        previous: meterReadings.water.previous,
        current: meterReadings.water.current,
        rate: (selectedTypeObj?.water_rate_per_unit || meterReadings.water.rate).toString(),
      },
    };
    setMeterReadings(nextReadings);

    const hasAny = nextReadings.electricity.enabled || nextReadings.water.enabled;
    if (hasAny) {
      setIsChargesAccordionOpen(true);
      if (formData.tenant_id) fetchPreviousReadingsForTenant(formData.tenant_id);
    }

    triggerCalculation(typeIdStr, formData.base_amount, formData.due_date, nextReadings, newCycle);
  };

  // Handle Month Change
  const handleMonthChange = (newMonth: string) => {
    setCycleMonth(newMonth);
    const newCycle = computeCycleValue("monthly", newMonth, cycleQuarter, cycleYear);
    setFormData((prev) => ({ ...prev, billing_cycle: newCycle }));
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, undefined, newCycle);
  };

  // Handle Quarter Change
  const handleQuarterChange = (newQuarter: string) => {
    setCycleQuarter(newQuarter);
    const newCycle = computeCycleValue("quarterly", cycleMonth, newQuarter, cycleYear);
    setFormData((prev) => ({ ...prev, billing_cycle: newCycle }));
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, undefined, newCycle);
  };

  // Handle Year Change
  const handleYearChange = (newYear: string) => {
    setCycleYear(newYear);
    const newCycle = computeCycleValue(cycleFrequency, cycleMonth, cycleQuarter, newYear);
    setFormData((prev) => ({ ...prev, billing_cycle: newCycle }));
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, undefined, newCycle);
  };

  // Handle Base Amount Change
  const handleBaseAmountChange = (amtStr: string) => {
    setFormData((prev) => ({ ...prev, base_amount: amtStr }));
    triggerCalculation(formData.billing_type_id, amtStr, formData.due_date, undefined, formData.billing_cycle);
  };

  // Helper to update a meter reading field and trigger recalculation
  const handleMeterReadingChange = (
    meter: "electricity" | "water",
    field: "enabled" | "previous" | "current" | "rate",
    value: string | boolean,
  ) => {
    const next = {
      ...meterReadings,
      [meter]: { ...meterReadings[meter], [field]: value },
    };
    setMeterReadings(next);
    triggerCalculation(formData.billing_type_id, formData.base_amount, formData.due_date, next, formData.billing_cycle);
  };

  // Submit Form (Server-Side calculation)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.tenant_id) { setFormError("Please select a tenant."); return; }
    if (!formData.billing_type_id) { setFormError("Please select a billing category."); return; }
    if (formData.base_amount === "" || isNaN(Number(formData.base_amount)) || Number(formData.base_amount) < 0) {
      setFormError("Base unit rate could not be determined. Please select a tenant with an assigned unit."); return;
    }

    setSubmitting(true);
    try {
      // Build meter_readings payload from structured meterReadings
      const readingsPayload: any = {};
      if (meterReadings.electricity.enabled) {
        readingsPayload.electricity = {
          previous: Number(meterReadings.electricity.previous || 0),
          current: Number(meterReadings.electricity.current || 0),
          rate: Number(meterReadings.electricity.rate || 12.5),
        };
      }
      if (meterReadings.water.enabled) {
        readingsPayload.water = {
          previous: Number(meterReadings.water.previous || 0),
          current: Number(meterReadings.water.current || 0),
          rate: Number(meterReadings.water.rate || 45),
        };
      }

      // Build extra_charges payload (flat and custom charges)
      const allExtraChargesPayload = extraCharges.map((c) => ({
        name: c.name || "Additional Charge",
        amount: computeExtraChargeAmount(c),
      }));

      const body = {
        tenant_id: Number(formData.tenant_id),
        unit_id: Number(formData.unit_id),
        billing_type_id: Number(formData.billing_type_id),
        billing_cycle: formData.billing_cycle,
        base_amount: Number(formData.base_amount || 0),
        amount: computedTotalBilled,
        due_date: formData.due_date,
        late_fee_applied: Number(formData.late_fee_applied || 0),
        meter_readings: Object.keys(readingsPayload).length > 0 ? readingsPayload : undefined,
        extra_charges: allExtraChargesPayload.length > 0 ? allExtraChargesPayload : undefined,
      };

      if (editingBilling) {
        const res = await fetch(`/api/admin/billings/${editingBilling.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to update billing record.");
      } else {
        const res = await fetch("/api/admin/billings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, status: "draft" }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to create billing record.");
        setActiveTab("draft");
      }

      setIsFormModalOpen(false);
      fetchBillings();
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Posting Confirmation Modal
  const handleOpenPostConfirmModal = (billing: BillingRecord) => {
    setPostingBilling(billing);
    setIsPostConfirmModalOpen(true);
  };

  const [isPosting, setIsPosting] = useState(false);

  // Execute Confirmed Post Bill Action
  const handleConfirmPostBill = async () => {
    if (!postingBilling) return;
    setIsPosting(true);
    try {
      const res = await fetch(`/api/admin/billings/${postingBilling.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "posted" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPostConfirmModalOpen(false);
        const recipient = postingBilling.tenant_email || "the tenant";
        showToast(`Invoice #${postingBilling.id} posted! Statement PDF automatically emailed to ${recipient}.`, "success");
        setPostingBilling(null);
        fetchBillings();
      } else {
        showToast(data.error || "Failed to post billing invoice", "error");
      }
    } catch (err) {
      showToast("Error publishing billing invoice", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingBilling) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/billings/${deletingBilling.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setDeletingBilling(null);
        fetchBillings();
      } else {
        alert(data.error || "Failed to delete billing");
      }
    } catch (err) {
      alert("Error deleting billing record");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Invoice ID",
      "Tenant",
      "Email",
      "Unit",
      "Building",
      "Category",
      "Base Amount",
      "Tax",
      "Transfer Fee",
      "Late Fee",
      "Total Amount",
      "Due Date",
      "Status",
    ];
    const rows = filteredBillings.map((b) => [
      `#${b.id}`,
      `"${b.tenant_name || ""}"`,
      `"${b.tenant_email || ""}"`,
      `"${b.unit_number || ""}"`,
      `"${b.building_name || ""}"`,
      `"${b.billing_type_name || ""}"`,
      b.base_amount || b.amount,
      b.tax_amount || 0,
      b.transfer_fee || 0,
      b.late_fee_applied || 0,
      b.amount,
      b.due_date,
      b.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `billings_${activeTab}_tab_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            Draft
          </span>
        );
      case "posted":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 mr-1 text-blue-600" />
            Posted
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 mr-1 text-red-600" />
            Overdue
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const selectedTenantInfo = tenantsUnits.find(
    (tu) => tu.tenant_id.toString() === formData.tenant_id,
  );

  const parsedViewReadings = useMemo(() => {
    if (!viewingBilling || !viewingBilling.meter_readings_json) return null;
    let readings: any = viewingBilling.meter_readings_json;
    if (typeof readings === "string") {
      try {
        readings = JSON.parse(readings);
      } catch (err) {
        return null;
      }
    }
    return readings;
  }, [viewingBilling]);

  const parsedViewExtraCharges = useMemo(() => {
    if (!viewingBilling || !viewingBilling.extra_charges_json) return null;
    let charges: any = viewingBilling.extra_charges_json;
    if (typeof charges === "string") {
      try {
        charges = JSON.parse(charges);
      } catch (err) {
        return null;
      }
    }
    return Array.isArray(charges) ? charges : null;
  }, [viewingBilling]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Billings Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Create draft bills with server-side calculations, submeter charges,
            live receipt preview, and confirmation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/billing-types"
            className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Sliders className="w-4 h-4" />
            <span>Manage Billing Types</span>
          </Link>

          <button
            onClick={fetchBillings}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Refresh Billings List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 hover:shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Bill</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Billed
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            ₱ {metrics.totalBilled.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.totalCount} total record
            {metrics.totalCount === 1 ? "" : "s"}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("draft")}
          className={`bg-white p-5 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            activeTab === "draft"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10"
              : "border-gray-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Draft Bills
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-2">
            ₱ {metrics.draftAmount.toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            {metrics.draftCount} draft bill{metrics.draftCount === 1 ? "" : "s"}{" "}
            pending post
          </p>
        </div>

        <div
          onClick={() => setActiveTab("posted")}
          className={`bg-white p-5 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            activeTab === "posted"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10"
              : "border-gray-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Posted Bills
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">
            ₱ {metrics.postedAmount.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 mt-1 font-medium">
            {metrics.postedCount} posted invoice
            {metrics.postedCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Paid / Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            ₱ {metrics.paidAmount.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {metrics.paidCount} cleared invoice
            {metrics.paidCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-200 bg-gray-50/70 px-4 pt-3 flex flex-wrap justify-between items-center">
          <nav className="flex space-x-2" aria-label="Billings Tabs">
            <button
              onClick={() => setActiveTab("draft")}
              className={`py-3 px-5 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2 border-t-2 border-x ${
                activeTab === "draft"
                  ? "bg-white border-t-amber-600 border-x-gray-200 text-amber-700 shadow-xs -mb-px"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Draft Bills</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "draft"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {metrics.draftCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("posted")}
              className={`py-3 px-5 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2 border-t-2 border-x ${
                activeTab === "posted"
                  ? "bg-white border-t-blue-600 border-x-gray-200 text-blue-700 shadow-xs -mb-px"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Posted Bills</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "posted"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {metrics.activePostedTotalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`py-3 px-5 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2 border-t-2 border-x ${
                activeTab === "all"
                  ? "bg-white border-t-gray-800 border-x-gray-200 text-gray-900 shadow-xs -mb-px"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All Billings</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === "all"
                    ? "bg-gray-200 text-gray-900"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {metrics.totalCount}
              </span>
            </button>
          </nav>

          <Link
            href="/admin/billing-types"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2 sm:mb-0"
          >
            <span>Billing Types Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Controls & Filter Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice ID, Tenant Name, Unit, or Category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab !== "draft" && (
              <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-xs">
                <Filter className="w-4 h-4 text-gray-400 ml-2 mr-1" />
                <select
                  value={selectedSubStatus}
                  onChange={(e) => setSelectedSubStatus(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 py-1 pr-3 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Posted Statuses</option>
                  <option value="posted">Posted</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}

            <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-xs">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 py-1 px-3 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {billingTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                Loading billings records...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 bg-red-50/50">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="font-semibold text-sm">{error}</p>
              <button
                onClick={fetchBillings}
                className="mt-3 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-800">
                {activeTab === "draft"
                  ? "No draft billings found"
                  : activeTab === "posted"
                    ? "No posted invoices found"
                    : "No billings found"}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Draft Bill
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Invoice ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Tenant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Property & Unit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Line Calculations
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Due Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredBillings.map((billing) => {
                  const isOverdue = billing.status === "overdue";

                  return (
                    <tr
                      key={billing.id}
                      onClick={() => {
                        setViewingBilling(billing);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer"
                      title="Click row to view billing statement invoice"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          #{billing.id}
                        </span>
                        <div className="text-xs text-gray-400">
                          {billing.created_at
                            ? new Date(billing.created_at).toLocaleDateString()
                            : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-100 flex-shrink-0">
                            {billing.tenant_name
                              ? billing.tenant_name
                                  .substring(0, 2)
                                  .toUpperCase()
                              : "TN"}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {billing.tenant_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {billing.tenant_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{billing.unit_number}</span>
                        </div>
                        <div className="text-xs text-gray-500 pl-5">
                          {billing.building_name}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 w-fit">
                            {billing.billing_type_name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit border border-blue-200 shadow-2xs">
                            <Repeat className="w-2.5 h-2.5 text-blue-600" />
                            {formatBillingCycle(billing.billing_cycle || billing.BillingType?.frequency)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₱{" "}
                          {Number(billing.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Base: ₱
                          {Number(
                            billing.base_amount || billing.amount,
                          ).toLocaleString()}
                          {billing.tax_amount > 0 && ` + VAT`}
                          {billing.transfer_fee > 0 && ` + Fee`}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : "text-gray-600"}`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(billing.due_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(billing.status)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          {billing.status === "draft" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPostConfirmModal(billing);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Post/Publish this draft bill and email statement"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Post Bill</span>
                            </button>
                          ) : (
                            <>
                              <a
                                href={`/api/admin/billings/${billing.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Download PDF Statement"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendStatementEmail(billing.id, billing.tenant_email);
                                }}
                                disabled={sendingEmailId === billing.id}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Resend Statement Email with PDF"
                              >
                                <Mail className={`w-4 h-4 ${sendingEmailId === billing.id ? 'animate-spin' : ''}`} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(billing);
                            }}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Bill Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingBilling(billing);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Bill Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT BILLING FORM MODAL WITH LIVE RECEIPT PREVIEW & CHARGES ACCORDION */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-200 my-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBilling
                    ? `Edit Billing #${editingBilling.id}`
                    : "Create New Draft Bill"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Calculations performed securely server-side with live receipt
                  preview.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 max-h-[80vh] overflow-y-auto">
              {/* Form Inputs (7 Cols) */}
              <form
                onSubmit={handleSubmitForm}
                className="lg:col-span-7 p-6 space-y-4"
              >
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Tenant Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Tenant & Unit *
                  </label>
                  <select
                    value={formData.tenant_id}
                    onChange={(e) => handleTenantChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select tenant...
                    </option>
                    {tenantsUnits.map((tu) => (
                      <option
                        key={tu.tenant_id}
                        value={tu.tenant_id.toString()}
                      >
                        {tu.tenant_name} ({tu.unit_number} - {tu.building_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Billing Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Billing Category / Type *
                  </label>
                  <select
                    value={formData.billing_type_id}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select billing category...
                    </option>
                    {billingTypes.map((bt) => (
                      <option key={bt.id} value={bt.id.toString()}>
                        {bt.name}{" "}
                        {bt.frequency ? `— ${formatBillingCycle(bt.frequency)}` : ""}{" "}
                        {bt.tax_percentage > 0
                          ? `(${bt.tax_percentage}% VAT)`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* Billing Cycle Period Selector (Frequency pulled from Billing Type) */}
                  <div className="mt-3 p-3.5 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-200/80 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-blue-600" />
                        <span>Billing Cycle *</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-gray-500">
                          Frequency:
                        </span>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-md shadow-2xs">
                          {formatBillingCycle(cycleFrequency)}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Cycle Period Selector Based on Frequency pulled from Billing Type */}
                    {cycleFrequency === "monthly" && (
                      <div className="space-y-1.5 pt-1 border-t border-blue-100">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Select Month & Year *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Month</label>
                            <div className="relative">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                              <select
                                value={cycleMonth}
                                onChange={(e) => handleMonthChange(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                {MONTH_NAMES.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Year</label>
                            <select
                              value={cycleYear}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {availableYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Cycle selected: <strong className="font-bold">{cycleMonth} {cycleYear}</strong> (Standard monthly charge)</span>
                        </p>
                      </div>
                    )}

                    {cycleFrequency === "quarterly" && (
                      <div className="space-y-1.5 pt-1 border-t border-blue-100">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Select Billing Cycle (Quarter & Year) *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Quarter</label>
                            <div className="relative">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                              <select
                                value={cycleQuarter}
                                onChange={(e) => handleQuarterChange(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                {QUARTER_OPTIONS.map((q) => (
                                  <option key={q.value} value={q.value}>{q.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Year</label>
                            <select
                              value={cycleYear}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {availableYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Cycle selected: <strong className="font-bold">{cycleQuarter} {cycleYear}</strong> (Multiplied × 3 months)</span>
                        </p>
                      </div>
                    )}

                    {cycleFrequency === "annually" && (
                      <div className="space-y-1.5 pt-1 border-t border-blue-100">
                        <label className="block text-[11px] font-semibold text-gray-700">
                          Select Billing Cycle (Year) *
                        </label>
                        <div>
                          <div className="relative">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                            <select
                              value={cycleYear}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {availableYears.map((y) => (
                                <option key={y} value={y}>Year {y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Cycle selected: <strong className="font-bold">{cycleYear}</strong> (Multiplied × 12 months)</span>
                        </p>
                      </div>
                    )}

                    {cycleFrequency === "one_time" && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2 pt-1 border-t border-blue-100">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-800">
                          <span className="font-bold">One-time Billing Exception:</span> No recurring cycle period applies to this invoice. It is billed as a single non-recurring charge.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billed Amount (Disabled field fetching base unit rate + extra charges & fees) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Billed Amount (₱) *
                    </label>
                    <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Auto-Fetched & Calculated
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">
                      ₱
                    </span>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={computedTotalBilled.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 bg-gray-100/90 cursor-not-allowed select-none shadow-2xs"
                    />
                  </div>
                  <div className="bg-gray-50 border border-gray-200/70 rounded-xl p-2.5 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>
                        Base Unit Rate ({selectedTenantInfo?.unit_number || "Selected Unit"}
                        {serverCalculation?.cycle_multiplier && serverCalculation.cycle_multiplier > 1
                          ? ` × ${serverCalculation.cycle_multiplier} mos for ${formatBillingCycle(formData.billing_cycle)}`
                          : ""}):
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₱ {(serverCalculation?.cycle_base_amount ?? (Number(formData.base_amount || 0) * getCycleMultiplier(formData.billing_cycle))).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Electricity Submeter Row */}
                    {(meterReadings.electricity.enabled || (serverCalculation?.meter_readings?.electricity?.amount || 0) > 0) && (
                      <div className="flex justify-between items-center text-amber-800">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-600 inline" />
                          <span>Electricity Submeter ({serverCalculation?.meter_readings?.electricity?.consumption ?? Math.max(0, Number(meterReadings.electricity.current) - Number(meterReadings.electricity.previous))} kWh @ ₱{serverCalculation?.meter_readings?.electricity?.rate_per_unit ?? meterReadings.electricity.rate}/kWh):</span>
                        </span>
                        <span className="font-semibold text-amber-700">
                          + ₱ {(serverCalculation?.meter_readings?.electricity?.amount ?? localMeterElectricityCharge).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* Water Submeter Row */}
                    {(meterReadings.water.enabled || (serverCalculation?.meter_readings?.water?.amount || 0) > 0) && (
                      <div className="flex justify-between items-center text-blue-800">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-600 inline" />
                          <span>Water Submeter ({serverCalculation?.meter_readings?.water?.consumption ?? Math.max(0, Number(meterReadings.water.current) - Number(meterReadings.water.previous))} cu.m @ ₱{serverCalculation?.meter_readings?.water?.rate_per_unit ?? meterReadings.water.rate}/cu.m):</span>
                        </span>
                        <span className="font-semibold text-blue-700">
                          + ₱ {(serverCalculation?.meter_readings?.water?.amount ?? localMeterWaterCharge).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* Additional Extra Charges Row */}
                    {extraChargesTotal > 0 && (
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Additional Charges & Add-ons:</span>
                        <span className="font-semibold text-emerald-700">
                          + ₱ {extraChargesTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {serverCalculation && ((serverCalculation.tax_amount > 0) || (serverCalculation.transfer_fee > 0)) && (
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Fees & Taxes ({serverCalculation.billing_type_name}):</span>
                        <span className="font-semibold text-blue-700">
                          + ₱ {(serverCalculation.tax_amount + serverCalculation.transfer_fee).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CHARGES SECTION: Meter Readings + Additional Charges */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setIsChargesAccordionOpen((prev) => !prev)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Meter Readings & Additional Charges
                      </span>
                      {(meterReadings.electricity.enabled || meterReadings.water.enabled || extraCharges.length > 0) && (
                        <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingPrevReadings && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Filling prev. readings…
                        </span>
                      )}
                      {isChargesAccordionOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isChargesAccordionOpen && (
                    <div className="border-t border-gray-200 divide-y divide-gray-100">

                      {/* ─── SECTION 1: Structured Meter Readings (Electricity & Water) ─── */}
                      <div className="p-3 space-y-2.5 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-blue-600" />
                            <span>Utility Meter Readings (Submeters)</span>
                          </p>
                          {(meterReadings.electricity.enabled || meterReadings.water.enabled) && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              +₱{localMeterChargesTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} Total Meter Cost
                            </span>
                          )}
                        </div>

                        {/* Electricity Card */}
                        <div className={`rounded-xl border p-3 space-y-2.5 transition-colors ${meterReadings.electricity.enabled ? "bg-amber-50/60 border-amber-200" : "bg-white border-gray-200"}`}>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={meterReadings.electricity.enabled}
                                onChange={(e) => handleMeterReadingChange("electricity", "enabled", e.target.checked)}
                                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                              />
                              <Zap className={`w-4 h-4 ${meterReadings.electricity.enabled ? "text-amber-500" : "text-gray-400"}`} />
                              <span className={`text-xs font-bold ${meterReadings.electricity.enabled ? "text-amber-950" : "text-gray-700"}`}>
                                Electricity Submeter
                              </span>
                            </label>
                            <span className="text-[11px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                              ₱{meterReadings.electricity.rate}/kWh
                            </span>
                          </div>

                          {meterReadings.electricity.enabled ? (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1">
                                  Prev. Reading (kWh)
                                  {loadingPrevReadings && <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />}
                                </label>
                                <input
                                  type="number"
                                  value={meterReadings.electricity.previous}
                                  onChange={(e) => handleMeterReadingChange("electricity", "previous", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-amber-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Current (kWh)</label>
                                <input
                                  type="number"
                                  value={meterReadings.electricity.current}
                                  onChange={(e) => handleMeterReadingChange("electricity", "current", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-amber-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Rate (₱/kWh)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={meterReadings.electricity.rate}
                                  onChange={(e) => handleMeterReadingChange("electricity", "rate", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-amber-400"
                                />
                              </div>
                              <div className="col-span-3 bg-amber-100/50 border border-amber-200 rounded-lg px-3 py-1.5 flex justify-between text-[11px] font-medium text-amber-900">
                                <span>Usage: {Math.max(0, Number(meterReadings.electricity.current) - Number(meterReadings.electricity.previous))} kWh</span>
                                <span className="font-bold">
                                  ₱{computeMeterAmount(meterReadings.electricity.previous, meterReadings.electricity.current, meterReadings.electricity.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 pl-6">
                              Check to include tenant electricity submeter reading in this bill.
                            </p>
                          )}
                        </div>

                        {/* Water Card */}
                        <div className={`rounded-xl border p-3 space-y-2.5 transition-colors ${meterReadings.water.enabled ? "bg-blue-50/60 border-blue-200" : "bg-white border-gray-200"}`}>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={meterReadings.water.enabled}
                                onChange={(e) => handleMeterReadingChange("water", "enabled", e.target.checked)}
                                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                              />
                              <Droplets className={`w-4 h-4 ${meterReadings.water.enabled ? "text-blue-500" : "text-gray-400"}`} />
                              <span className={`text-xs font-bold ${meterReadings.water.enabled ? "text-blue-950" : "text-gray-700"}`}>
                                Water Submeter
                              </span>
                            </label>
                            <span className="text-[11px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded-full">
                              ₱{meterReadings.water.rate}/cu.m
                            </span>
                          </div>

                          {meterReadings.water.enabled ? (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5 flex items-center gap-1">
                                  Prev. Reading (cu.m)
                                  {loadingPrevReadings && <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-500" />}
                                </label>
                                <input
                                  type="number"
                                  value={meterReadings.water.previous}
                                  onChange={(e) => handleMeterReadingChange("water", "previous", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Current (cu.m)</label>
                                <input
                                  type="number"
                                  value={meterReadings.water.current}
                                  onChange={(e) => handleMeterReadingChange("water", "current", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Rate (₱/cu.m)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={meterReadings.water.rate}
                                  onChange={(e) => handleMeterReadingChange("water", "rate", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-400"
                                />
                              </div>
                              <div className="col-span-3 bg-blue-100/50 border border-blue-200 rounded-lg px-3 py-1.5 flex justify-between text-[11px] font-medium text-blue-900">
                                <span>Usage: {Math.max(0, Number(meterReadings.water.current) - Number(meterReadings.water.previous))} cu.m</span>
                                <span className="font-bold">
                                  ₱{computeMeterAmount(meterReadings.water.previous, meterReadings.water.current, meterReadings.water.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 pl-6">
                              Check to include tenant water submeter reading in this bill.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ─── SECTION 2: Flexible Additional Charges (WiFi, Gas, Parking, etc.) ─── */}
                      <div className="bg-white">
                        <div className="px-3 pt-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <PackagePlus className="w-3 h-3" /> Additional Charges
                            {extraCharges.length > 0 && (
                              <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                +₱{extraChargesTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </p>
                        </div>

                        {extraCharges.length > 0 && (
                          <div className="px-3 space-y-2 pb-2">
                            {extraCharges.map((charge) => {
                              const chargeAmt = computeExtraChargeAmount(charge);
                              const isMeter = charge.type === "meter";
                              const consumption = isMeter ? Math.max(0, Number(charge.current) - Number(charge.previous)) : 0;
                              const bgColorMap: Record<ExtraChargeIcon, string> = {
                                wifi: "bg-indigo-50/60 border-indigo-200",
                                gas: "bg-orange-50/60 border-orange-200",
                                parking: "bg-slate-50/60 border-slate-200",
                                other: "bg-gray-50 border-gray-200",
                              };
                              return (
                                <div key={charge.id} className={`rounded-xl border p-3 space-y-2 ${bgColorMap[charge.icon]}`}>
                                  {/* Card Header */}
                                  <div className="flex items-center gap-2">
                                    <ChargeIconComponent icon={charge.icon} />
                                    <input
                                      type="text"
                                      value={charge.name}
                                      onChange={(e) => updateExtraCharge(charge.id, { name: e.target.value })}
                                      placeholder="Charge name..."
                                      className="flex-1 text-xs font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-1 py-0.5 text-gray-900"
                                    />
                                    <select
                                      value={charge.icon}
                                      onChange={(e) => updateExtraCharge(charge.id, { icon: e.target.value as ExtraChargeIcon })}
                                      className="text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 outline-none text-gray-600"
                                    >
                                      <option value="wifi">📶 WiFi</option>
                                      <option value="gas">🔥 Gas</option>
                                      <option value="parking">🅿️ Parking</option>
                                      <option value="other">💰 Other</option>
                                    </select>
                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[10px] font-semibold">
                                      <button type="button" onClick={() => updateExtraCharge(charge.id, { type: "flat" })}
                                        className={`px-2 py-0.5 transition-colors ${charge.type === "flat" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>Flat</button>
                                      <button type="button" onClick={() => updateExtraCharge(charge.id, { type: "meter" })}
                                        className={`px-2 py-0.5 transition-colors ${charge.type === "meter" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>Meter</button>
                                    </div>
                                    <button type="button" onClick={() => removeExtraCharge(charge.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {charge.type === "flat" && (
                                    <div className="flex items-center gap-2">
                                      <label className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">Amount (₱)</label>
                                      <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">₱</span>
                                        <input type="number" step="0.01" min="0" value={charge.amount}
                                          onChange={(e) => updateExtraCharge(charge.id, { amount: e.target.value })}
                                          className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 bg-white outline-none focus:border-blue-500" />
                                      </div>
                                      <span className="text-[11px] font-bold text-emerald-700">
                                        = ₱{chargeAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}

                                  {charge.type === "meter" && (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Prev. ({charge.unit_label})</label>
                                        <input type="number" value={charge.previous}
                                          onChange={(e) => updateExtraCharge(charge.id, { previous: e.target.value })}
                                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-500" />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Current ({charge.unit_label})</label>
                                        <input type="number" value={charge.current}
                                          onChange={(e) => updateExtraCharge(charge.id, { current: e.target.value })}
                                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-500" />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Rate (₱/{charge.unit_label})</label>
                                        <input type="number" step="0.01" value={charge.rate}
                                          onChange={(e) => updateExtraCharge(charge.id, { rate: e.target.value })}
                                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-semibold outline-none focus:border-blue-500" />
                                      </div>
                                      <div className="col-span-3 bg-white/70 border border-gray-200 rounded-lg px-3 py-1.5 flex justify-between text-[11px] font-medium text-gray-700">
                                        <span>Usage: {consumption} {charge.unit_label}</span>
                                        <span className="font-bold text-emerald-700">₱{chargeAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                      </div>
                                      <div className="col-span-3">
                                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Unit label</label>
                                        <input type="text" value={charge.unit_label}
                                          onChange={(e) => updateExtraCharge(charge.id, { unit_label: e.target.value })}
                                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs bg-white font-medium outline-none focus:border-blue-500" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add charge button / preset picker */}
                        <div className="px-3 pb-3 pt-1">
                          {!showPresetPicker ? (
                            <button
                              type="button"
                              onClick={() => setShowPresetPicker(true)}
                              className="w-full py-2 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add a Charge (WiFi, Gas, Parking…)
                            </button>
                          ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                              <div className="px-3 py-2 bg-gray-100 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Select Charge Type</span>
                                <button type="button" onClick={() => setShowPresetPicker(false)} className="text-gray-400 hover:text-gray-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="p-2 grid grid-cols-2 gap-1.5">
                                {CHARGE_PRESETS.map((preset) => (
                                  <button key={preset.name} type="button" onClick={() => addPresetCharge(preset)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left">
                                    <ChargeIconComponent icon={preset.icon} />
                                    <div>
                                      <div className="text-[11px] font-semibold text-gray-800">{preset.name}</div>
                                      <div className="text-[10px] text-gray-400 capitalize">{preset.type === "meter" ? `Meter (${preset.unit_label})` : "Flat fee"}</div>
                                    </div>
                                  </button>
                                ))}
                                <button type="button"
                                  onClick={() => { setExtraCharges([...extraCharges, makeCharge({ name: "", icon: "other", type: "flat" })]); setShowPresetPicker(false); }}
                                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-left col-span-2">
                                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                                  <div className="text-[11px] font-semibold text-gray-500">Custom Charge</div>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Calculated Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        due_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Due date is automatically computed based on the selected
                    Billing Type rule.
                  </p>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                    <span>
                      {editingBilling ? "Save Changes" : "Save Draft Bill"}
                    </span>
                  </button>
                </div>
              </form>

              {/* Live Receipt Preview Panel (5 Cols) */}
              <div className="lg:col-span-5 p-6 bg-gray-50/70 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <span>Live Receipt Preview</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      Draft Preview
                    </span>
                  </div>

                  <div className="mt-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-4">
                    {/* Header */}
                    <div className="text-center border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {selectedTenantInfo?.building_name ||
                          "Sunrise Apartments"}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Official Tenant Statement Invoice
                      </p>
                    </div>

                    {/* Tenant & Unit */}
                    <div className="text-xs space-y-1.5 bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tenant:</span>
                        <span className="font-bold text-gray-900">
                          {selectedTenantInfo?.tenant_name || "Select Tenant"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit:</span>
                        <span className="font-bold text-gray-900">
                          {selectedTenantInfo?.unit_number || "Select Unit"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Billing Cycle:</span>
                        <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 border border-blue-200">
                          <Repeat className="w-2.5 h-2.5 text-blue-600" />
                          {formatBillingCycle(formData.billing_cycle)}
                        </span>
                      </div>
                    </div>

                    {/* Line Items Calculations */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <div>
                          <span className="text-gray-600">Base Rental / Fee</span>
                          {serverCalculation?.cycle_multiplier && serverCalculation.cycle_multiplier > 1 && (
                            <div className="text-[10px] text-blue-600 font-medium">
                              (₱{Number(formData.base_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} × {serverCalculation.cycle_multiplier} mos for {formatBillingCycle(formData.billing_cycle)})
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          ₱{" "}
                          {(serverCalculation?.cycle_base_amount ?? (Number(formData.base_amount || 0) * getCycleMultiplier(formData.billing_cycle))).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>

                      {/* Electricity Submeter Line Item */}
                      {(meterReadings.electricity.enabled || (serverCalculation?.meter_readings?.electricity?.amount || 0) > 0) && (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-amber-700">
                          <div>
                            <span className="font-semibold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>Electricity Submeter Fee</span>
                            </span>
                            <div className="text-[10px] text-amber-600">
                              (
                              {
                                serverCalculation?.meter_readings?.electricity?.consumption ??
                                Math.max(0, Number(meterReadings.electricity.current) - Number(meterReadings.electricity.previous))
                              }{" "}
                              kWh @ ₱
                              {
                                serverCalculation?.meter_readings?.electricity?.rate_per_unit ??
                                meterReadings.electricity.rate
                              }
                              /kWh)
                            </div>
                          </div>
                          <span className="font-bold">
                            + ₱{" "}
                            {(serverCalculation?.meter_readings?.electricity?.amount ?? localMeterElectricityCharge).toLocaleString(
                              "en-US",
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      )}

                      {/* Water Submeter Line Item */}
                      {(meterReadings.water.enabled || (serverCalculation?.meter_readings?.water?.amount || 0) > 0) && (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-blue-700">
                          <div>
                            <span className="font-semibold flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-500" />
                              <span>Water Submeter Fee</span>
                            </span>
                            <div className="text-[10px] text-blue-600">
                              (
                              {
                                serverCalculation?.meter_readings?.water?.consumption ??
                                Math.max(0, Number(meterReadings.water.current) - Number(meterReadings.water.previous))
                              }{" "}
                              cu.m @ ₱
                              {
                                serverCalculation?.meter_readings?.water?.rate_per_unit ??
                                meterReadings.water.rate
                              }
                              /cu.m)
                            </div>
                          </div>
                          <span className="font-bold">
                            + ₱{" "}
                            {(serverCalculation?.meter_readings?.water?.amount ?? localMeterWaterCharge).toLocaleString(
                              "en-US",
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                        </div>
                      )}

                      {/* Extra Flat Charges Line Items */}
                      {extraCharges.filter((c) => c.type === "flat").map((charge) => {
                        const amt = computeExtraChargeAmount(charge);
                        return (
                          <div key={charge.id} className="flex justify-between py-1 border-b border-gray-100 text-indigo-700">
                            <div className="flex items-center gap-1.5">
                              <ChargeIconComponent icon={charge.icon} />
                              <span>{charge.name || "Additional Charge"}</span>
                            </div>
                            <span className="font-semibold">
                              + ₱ {amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}

                      {/* Extra Meter-based Charges not mapped to elec/water */}
                      {extraCharges.filter((c) => c.type === "meter" && !c.name.toLowerCase().includes("electric") && !c.name.toLowerCase().includes("water")).map((charge) => {
                        const consumption = Math.max(0, Number(charge.current) - Number(charge.previous));
                        const amt = computeExtraChargeAmount(charge);
                        return (
                          <div key={charge.id} className="flex justify-between py-1 border-b border-gray-100 text-orange-700">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <ChargeIconComponent icon={charge.icon} />
                                <span>{charge.name || "Meter Charge"}</span>
                              </div>
                              <div className="text-[10px] text-orange-600 ml-5">
                                ({consumption} {charge.unit_label} @ ₱{charge.rate}/{charge.unit_label})
                              </div>
                            </div>
                            <span className="font-semibold">
                              + ₱ {amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}

                      {serverCalculation &&
                        serverCalculation.tax_amount > 0 && (
                          <div className="flex justify-between py-1 border-b border-gray-100 text-blue-700">
                            <span>
                              VAT ({serverCalculation.tax_percentage}%)
                            </span>
                            <span className="font-semibold">
                              + ₱{" "}
                              {serverCalculation.tax_amount.toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                          </div>
                        )}

                      {serverCalculation &&
                        serverCalculation.transfer_fee > 0 && (
                          <div className="flex justify-between py-1 border-b border-gray-100 text-gray-700">
                            <span>Transfer / Processing Fee</span>
                            <span className="font-semibold">
                              + ₱{" "}
                              {serverCalculation.transfer_fee.toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                          </div>
                        )}

                      <div className="flex justify-between py-2 font-extrabold text-sm border-t border-gray-200 text-blue-700">
                        <span>Total Due</span>
                        <span>
                          ₱{" "}
                          {computedTotalBilled.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 flex justify-between bg-blue-50/50 p-2 rounded-lg">
                      <span>Calculated Due Date:</span>
                      <span className="font-bold text-gray-900">
                        {formData.due_date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    All meter readings and additional charges are fully customizable. Previous readings are auto-filled from the tenant's last posted billing.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POSTING CONFIRMATION MECHANISM MODAL */}
      {isPostConfirmModalOpen && postingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Confirm Invoice Publication
                </h3>
                <p className="text-xs text-gray-500">
                  Double check billing details before posting.
                </p>
              </div>
            </div>

            {/* Invoice Summary Box */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice ID:</span>
                <span className="font-bold text-gray-900">
                  #{postingBilling.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tenant:</span>
                <span className="font-bold text-gray-900">
                  {postingBilling.tenant_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unit Location:</span>
                <span className="font-bold text-gray-900">
                  {postingBilling.unit_number} ({postingBilling.building_name})
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm text-blue-700">
                <span>Total Amount:</span>
                <span>
                  ₱{" "}
                  {Number(postingBilling.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Due Date:</span>
                <span>{postingBilling.due_date}</span>
              </div>
            </div>

            {/* Automated Email & PDF Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Automated Email & PDF Statement Dispatch</span>
              </div>
              <p className="text-blue-700 leading-relaxed">
                Posting will automatically generate the official Statement of Account PDF (<code>Statement_Invoice_#{postingBilling.id}.pdf</code>) and email it directly to <strong>{postingBilling.tenant_email || "the tenant"}</strong> with payment instructions.
              </p>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Once posted, this billing statement will be officially published
                to the tenant's portal and cannot be set back to draft.
              </span>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPostConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPostBill}
                disabled={isPosting}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPosting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Post Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICE STATEMENT MODAL */}
      {isDetailModalOpen && viewingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  Statement Invoice #{viewingBilling.id}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {viewingBilling.building_name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Property Management Invoice Statement
                  </p>
                </div>
                <div className="text-right">
                  {renderStatusBadge(viewingBilling.status)}
                  <p className="text-xs text-gray-500 mt-1">
                    Due:{" "}
                    {new Date(viewingBilling.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">
                    Billed To:
                  </span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {viewingBilling.tenant_name}
                  </p>
                  <p className="text-gray-600">{viewingBilling.tenant_email}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">
                    Unit Location:
                  </span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {viewingBilling.unit_number}
                  </p>
                  <p className="text-gray-600">
                    {viewingBilling.building_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">
                    Billing Cycle:
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-200">
                      <Repeat className="w-3 h-3 text-blue-600" />
                      {formatBillingCycle(viewingBilling.billing_cycle || viewingBilling.BillingType?.frequency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600">
                        Description
                      </th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div>{viewingBilling.billing_type_name} Base Amount</div>
                        <div className="text-[11px] text-gray-500 font-normal">
                          Cycle: {formatBillingCycle(viewingBilling.billing_cycle || viewingBilling.BillingType?.frequency)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ₱{" "}
                        {Number(
                          viewingBilling.base_amount || viewingBilling.amount,
                        ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {parsedViewReadings?.electricity && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-amber-800">
                          <div>
                            <span className="font-bold flex items-center gap-1">
                              ⚡ Electricity Submeter Charge
                            </span>
                            <span className="text-[10px] text-amber-700 block">
                              Readings: {parsedViewReadings.electricity.previous} kWh (Prev) → {parsedViewReadings.electricity.current} kWh (Curr) = {parsedViewReadings.electricity.consumption} kWh @ ₱{parsedViewReadings.electricity.rate_per_unit}/kWh
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-amber-800">
                          + ₱{" "}
                          {Number(parsedViewReadings.electricity.amount).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    )}

                    {parsedViewReadings?.water && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-blue-800">
                          <div>
                            <span className="font-bold flex items-center gap-1">
                              💧 Water Submeter Charge
                            </span>
                            <span className="text-[10px] text-blue-700 block">
                              Readings: {parsedViewReadings.water.previous} cu.m (Prev) → {parsedViewReadings.water.current} cu.m (Curr) = {parsedViewReadings.water.consumption} cu.m @ ₱{parsedViewReadings.water.rate_per_unit}/cu.m
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-800">
                          + ₱{" "}
                          {Number(parsedViewReadings.water.amount).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    )}

                    {parsedViewExtraCharges && parsedViewExtraCharges.map((charge, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {charge.name || "Additional Charge"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">
                          + ₱{" "}
                          {Number(charge.amount || 0).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    ))}

                    {viewingBilling.tax_amount > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-blue-600">
                          VAT Tax ({viewingBilling.tax_percentage || 12}%)
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          + ₱{" "}
                          {Number(viewingBilling.tax_amount).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    )}
                    {viewingBilling.transfer_fee > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          Gateway Transfer Fee
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">
                          + ₱{" "}
                          {Number(viewingBilling.transfer_fee).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    )}
                    {viewingBilling.late_fee_applied > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-medium text-red-600">
                          Late Payment Penalty Fee
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          + ₱{" "}
                          {Number(
                            viewingBilling.late_fee_applied,
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        Total Balance Due
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-blue-700 text-sm">
                        ₱{" "}
                        {Number(viewingBilling.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/billings/${viewingBilling.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </a>
                  {viewingBilling.status !== "draft" && (
                    <button
                      onClick={() => handleSendStatementEmail(viewingBilling.id, viewingBilling.tenant_email)}
                      disabled={sendingEmailId === viewingBilling.id}
                      className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Mail className={`w-4 h-4 ${sendingEmailId === viewingBilling.id ? 'animate-spin' : ''}`} />
                      <span>{sendingEmailId === viewingBilling.id ? 'Sending...' : 'Email Statement'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {viewingBilling.status === "draft" && (
                    <button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleOpenPostConfirmModal(viewingBilling);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Bill Now</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Delete Billing Record
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete Invoice{" "}
                <strong className="text-gray-800">#{deletingBilling.id}</strong>{" "}
                ({deletingBilling.billing_type_name} for{" "}
                {deletingBilling.tenant_name})? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Bill</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* TOAST NOTIFICATION COMPONENT */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 duration-200 ${
          toastMessage.type === "success"
            ? "bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20"
            : "bg-red-900 text-white border-red-700 shadow-red-900/20"
        }`}>
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
