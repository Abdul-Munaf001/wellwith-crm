'use client';

import React, { useState, useEffect } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead, PackType, ChannelType } from '@/types/crm';
import {
  X,
  ShoppingCart,
  CheckCircle2,
  Tag,
  Sparkles,
  Phone,
  User,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatINR, calculateReorderDueDate, cleanPhone } from '@/lib/utils';

interface OrderEntryModalProps {
  initialLead?: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderEntryModal: React.FC<OrderEntryModalProps> = ({ initialLead, isOpen, onClose }) => {
  const { leads, products, createOrder, addLead, currentUser } = useCrm();

  const [phoneInput, setPhoneInput] = useState('');
  const [matchedLead, setMatchedLead] = useState<Lead | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerArea, setCustomerArea] = useState('Banjara Hills, Hyderabad');

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPack, setSelectedPack] = useState<PackType>('single');
  const [couponCode, setCouponCode] = useState<string>('HYD10');
  const [channel, setChannel] = useState<ChannelType>('Store');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  const [isSuccess, setIsSuccess] = useState(false);

  // Set initial product
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // If initialLead is passed, prefill
  useEffect(() => {
    if (initialLead) {
      setMatchedLead(initialLead);
      setPhoneInput(initialLead.phone_raw || initialLead.phone_clean);
      setCustomerName(initialLead.name);
      setCustomerArea(initialLead.area || 'Hyderabad');
      if (initialLead.coupon_code) setCouponCode(initialLead.coupon_code);
    } else {
      setMatchedLead(null);
      setPhoneInput('');
      setCustomerName('');
      setCustomerArea('Hyderabad');
    }
  }, [initialLead, isOpen]);

  // Phone lookup on input change
  const handlePhoneChange = (val: string) => {
    setPhoneInput(val);
    const { phoneClean } = cleanPhone(val);
    if (!phoneClean) {
      setMatchedLead(null);
      return;
    }

    const found = leads.find(
      (l) => l.phone_clean === phoneClean || l.phone_raw.replace(/\D/g, '') === val.replace(/\D/g, '')
    );

    if (found) {
      setMatchedLead(found);
      setCustomerName(found.name);
      if (found.area) setCustomerArea(found.area);
      if (found.coupon_code) setCouponCode(found.coupon_code);
    } else {
      setMatchedLead(null);
    }
  };

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Price Calculation Logic
  const getMultiplier = (pack: PackType) => {
    switch (pack) {
      case 'single':
        return { count: 1, discountPercent: 0 };
      case '2-pack':
        return { count: 2, discountPercent: 10 }; // 10% bundle discount
      case '4-pack':
        return { count: 4, discountPercent: 20 }; // 20% bundle discount
    }
  };

  const { count, discountPercent: packDiscount } = getMultiplier(selectedPack);
  const baseSubtotal = (currentProduct ? currentProduct.price : 999) * count;
  const packSavings = (baseSubtotal * packDiscount) / 100;
  const afterPackPrice = baseSubtotal - packSavings;

  // Coupon discount
  let couponDiscount = 0;
  if (couponCode.toUpperCase().includes('10')) {
    couponDiscount = (afterPackPrice * 10) / 100;
  } else if (couponCode.toUpperCase().includes('15')) {
    couponDiscount = (afterPackPrice * 15) / 100;
  } else if (couponCode.toUpperCase().includes('20')) {
    couponDiscount = (afterPackPrice * 20) / 100;
  } else if (couponCode.toUpperCase().includes('5')) {
    couponDiscount = (afterPackPrice * 5) / 100;
  }

  const finalAmount = Math.max(0, Math.round(afterPackPrice - couponDiscount));
  const projectedReorderDate = calculateReorderDueDate(orderDate, 25);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    let targetLead = matchedLead;

    // If no lead found, auto-create a walk-in lead
    if (!targetLead) {
      targetLead = addLead({
        name: customerName || 'Store Walk-in Customer',
        phone_raw: phoneInput || '9999999999',
        area: customerArea,
        source: channel === 'Store' ? 'Store Walk-in' : 'Direct Order',
        coupon_code: couponCode,
        concern: `Purchased ${currentProduct.name} at counter`,
        stage: 'New',
        lead_score: 'Hot',
        owner_id: currentUser.id,
        owner_name: currentUser.name,
      });
    }

    createOrder({
      lead_id: targetLead.id,
      lead_name: targetLead.name,
      lead_phone: targetLead.phone_clean,
      order_date: orderDate,
      product: currentProduct.name,
      pack: selectedPack,
      amount: finalAmount,
      coupon_code: couponCode,
      channel: channel,
      payment_status: paymentStatus,
      delivery_status: channel === 'Store' ? 'delivered' : 'pending',
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-emerald-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-200">
              Counter POS Attribution
            </span>
            <span className="text-xs text-emerald-200">• Offline to Online Match</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Create Order & Link Lead</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Enter phone number to match an existing inquiry or register a physical store walk-in.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Order Recorded Successfully!</h3>
            <p className="text-xs text-slate-500">
              Lead stage updated to <strong>Ordered</strong>. Replenishment scheduled for{' '}
              <strong className="text-emerald-700">{projectedReorderDate} (Day 25)</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="p-6 space-y-5 text-xs">
            {/* Step 1: Customer Phone Match */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Phone Number</span>
                </label>
                {matchedLead ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Matched Existing Lead
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">New customer walk-in</span>
                )}
              </div>

              <input
                type="text"
                placeholder="e.g. 98401 23456 or +91 99890 87654"
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Clinic / Area</label>
                  <input
                    type="text"
                    value={customerArea}
                    onChange={(e) => setCustomerArea(e.target.value)}
                    placeholder="Banjara Hills, Hyderabad"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Product & Pack Selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Ayurvedic Formulation
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.price} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pack Size Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pack Size & Bundles
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPack('single')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedPack === 'single'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">Single Unit</div>
                    <div className="text-[10px] text-slate-400">Standard pack</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPack('2-pack')}
                    className={`p-2.5 rounded-xl border text-center transition-all relative ${
                      selectedPack === '2-pack'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[9px]">
                      SAVE 10%
                    </span>
                    <div className="text-xs">2-Pack Duo</div>
                    <div className="text-[10px] text-slate-400">60-Day Therapy</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPack('4-pack')}
                    className={`p-2.5 rounded-xl border text-center transition-all relative ${
                      selectedPack === '4-pack'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[9px]">
                      SAVE 20%
                    </span>
                    <div className="text-xs">4-Pack Family</div>
                    <div className="text-[10px] text-slate-400">Complete Cycle</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Attribution Coupon & Channel */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Coupon Attribution
                </label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {['HYD10', 'WA10', 'STORE20', 'ONLINE5'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCouponCode(code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        couponCode === code
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs uppercase font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Sales Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as ChannelType)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Store">Store Walk-in (Counter POS)</option>
                  <option value="WhatsApp">WhatsApp Chat Order</option>
                  <option value="Call">Telecaller Phone Order</option>
                </select>

                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending')}
                    className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="paid">Paid (Cash / UPI / Card)</option>
                    <option value="pending">Pending Payment Link</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bill Summary & Day-25 Calculation */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal ({count} item{count > 1 ? 's' : ''}):</span>
                <span>{formatINR(baseSubtotal)}</span>
              </div>
              {packSavings > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Pack Bundle Discount ({packDiscount}%):</span>
                  <span>- {formatINR(packSavings)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Coupon {couponCode} Discount:</span>
                  <span>- {formatINR(couponDiscount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Final Bill Payable:</span>
                <span className="font-black text-emerald-800 text-xl">{formatINR(finalAmount)}</span>
              </div>

              <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-teal-800">
                <span>Auto Retention Trigger:</span>
                <span className="font-bold">Day-25 Reorder Due on {projectedReorderDate}</span>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Confirm Order ({formatINR(finalAmount)})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
