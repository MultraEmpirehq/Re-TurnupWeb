"use client";

import InputField from "@/components/ui/input-field";
import SelectField from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import {
  useVendorVerificationSnapshot,
  VendorVerificationNotice,
} from "@/components/pages/app/vendor-verification";
import {
  useCreateVendorTransfer,
  useDeleteVendorWalletCard,
  useRequestVendorWithdrawal,
  useSaveVendorWalletCard,
  useVendorWallet,
} from "@/hooks/use-vendor-wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Download,
  Globe2,
  Landmark,
  Plus,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { PriceDetailsType } from "@/lib/types";

export const dynamic = "force-dynamic";

type TTransferDestination = {
  code: string;
  label: string;
  currency: string;
  payout: string;
};

const transferDestinations: TTransferDestination[] = [
  { code: "NG", label: "Nigeria", currency: "NGN", payout: "Bank transfer" },
  { code: "US", label: "United States", currency: "USD", payout: "ACH / wire" },
  { code: "GB", label: "United Kingdom", currency: "GBP", payout: "Bank transfer" },
  { code: "CA", label: "Canada", currency: "CAD", payout: "Interac / wire" },
  { code: "AE", label: "United Arab Emirates", currency: "AED", payout: "Bank transfer" },
  { code: "ZA", label: "South Africa", currency: "ZAR", payout: "Bank transfer" },
];

const getMoneyAmount = (money?: PriceDetailsType | number) =>
  typeof money === "number" ? money : Number(money?.amount ?? 0);

const moneyFormatter = (
  money: PriceDetailsType | number,
  currency = "USD",
) => {
  if (typeof money !== "number" && money.formatted?.withCurrency) {
    return money.formatted.withCurrency;
  }
  const amount = getMoneyAmount(money);
  const locale = typeof money !== "number" ? money.currency?.locale : "en-US";
  const code = typeof money !== "number" ? money.currency?.code : currency;
  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency: code || currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const WalletPage = () => {
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawChannel, setWithdrawChannel] = useState("bank");
  const [transferCountry, setTransferCountry] = useState("NG");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("Visa");
  const verification = useVendorVerificationSnapshot();
  const walletQuery = useVendorWallet();
  const withdrawalMutation = useRequestVendorWithdrawal();
  const transferMutation = useCreateVendorTransfer();
  const saveCardMutation = useSaveVendorWalletCard();
  const deleteCardMutation = useDeleteVendorWalletCard();
  const isPayoutLocked = verification.status !== "approved";

  const selectedDestination =
    transferDestinations.find((destination) => destination.code === transferCountry) ??
    transferDestinations[0];

  const availableBalance = walletQuery.data?.balances.availableBalance;
  const pendingBalance = walletQuery.data?.balances.pendingBalance;
  const reservedBalance = walletQuery.data?.balances.reservedBalance;
  const walletCurrency = walletQuery.data?.balances.currency ?? "USD";
  const savedCards = walletQuery.data?.savedCards ?? [];
  const withdrawalFee = 0;
  const transferFee = 0;

  const withdrawNet = useMemo(() => {
    const amount = Number(withdrawAmount || 0);
    return Math.max(amount - withdrawalFee, 0);
  }, [withdrawAmount]);

  const transferTotal = useMemo(() => {
    const amount = Number(transferAmount || 0);
    return Math.max(amount + transferFee, 0);
  }, [transferAmount]);

  const handleWithdraw = () => {
    if (isPayoutLocked) {
      toast.error("Complete vendor verification before requesting payouts.");
      return;
    }

    const amount = Number(withdrawAmount || 0);
    if (amount <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }
    withdrawalMutation.mutate(
      { amount, method: withdrawChannel },
      {
        onSuccess: () => {
          setIsWithdrawDialogOpen(false);
          toast.success("Withdrawal request created for review");
        },
        onError: () => toast.error("Unable to create withdrawal request."),
      },
    );
  };

  const handleTransfer = () => {
    const amount = Number(transferAmount || 0);
    if (amount <= 0 || !recipientName.trim() || !recipientAccount.trim()) {
      toast.error("Complete the transfer details first");
      return;
    }
    transferMutation.mutate(
      {
        amount,
        country: selectedDestination.code,
        recipientName: recipientName.trim(),
        recipientAccount: recipientAccount.trim(),
      },
      {
        onSuccess: () =>
          toast.success(`Transfer request created for ${selectedDestination.label}`),
        onError: () => toast.error("Unable to create transfer request."),
      },
    );
  };

  const handleAddCard = () => {
    if (!cardHolder.trim() || !cardLast4.trim()) {
      toast.error("Add the card holder and last 4 digits");
      return;
    }

    saveCardMutation.mutate(
      {
        brand: cardBrand,
        last4: cardLast4.trim(),
        holder: cardHolder.trim(),
      },
      {
        onSuccess: () => {
          setCardHolder("");
          setCardLast4("");
          toast.success("Card saved to vendor wallet");
        },
        onError: () => toast.error("Unable to save card."),
      },
    );
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId, {
      onSuccess: () => toast.success("Saved card removed"),
      onError: () => toast.error("Unable to remove saved card."),
    });
  };

  const handleExportWalletReport = () => {
    const walletSnapshot = {
      exportedAt: new Date().toISOString(),
      balances: {
        availableBalance,
        pendingBalance,
        reservedBalance,
      },
      withdrawPreview: {
        requested: Number(withdrawAmount || 0),
        fee: withdrawalFee,
        net: withdrawNet,
      },
      transferPreview: {
        country: selectedDestination.label,
        currency: selectedDestination.currency,
        amount: Number(transferAmount || 0),
        fee: transferFee,
        total: transferTotal,
      },
      savedCards,
    };

    const blob = new Blob([JSON.stringify(walletSnapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `turnupz-wallet-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Wallet report downloaded");
  };

  return (
    <>
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="max-w-xl rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Review your payout amount, fee, and destination before sending this
              withdrawal request for vendor review.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Withdrawal Amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
              />
              <SelectField
                label="Payout Method"
                value={withdrawChannel}
                setValue={setWithdrawChannel}
                options={[
                  { label: "Bank Transfer", value: "bank" },
                  { label: "Vendor Wallet", value: "wallet" },
                  { label: "Instant Cashout", value: "instant" },
                ]}
              />
            </div>

            <div className="rounded-[1.2rem] bg-secondary-50 p-4">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-secondary-500">Requested</span>
                <span className="font-semibold text-secondary-950">
                {moneyFormatter(Number(withdrawAmount || 0), walletCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-secondary-500">Fee</span>
                <span className="font-semibold text-secondary-950">
                {moneyFormatter(withdrawalFee, walletCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-secondary-100 py-3 text-sm">
                <span className="text-secondary-500">Net payout</span>
                <span className="text-lg font-semibold text-secondary-950">
                  {moneyFormatter(withdrawNet, walletCurrency)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              className="rounded-full border-secondary-100"
              onClick={() => setIsWithdrawDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-primary text-white hover:bg-primary/90"
              onClick={handleWithdraw}
            >
              Confirm Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-5">
      <VendorVerificationNotice context="wallet" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
            Vendor Wallet
          </span>
          <h1 className="mt-3 max-w-5xl text-3xl font-bold tracking-tight text-secondary-950 md:text-[2.15rem] xl:text-[2.35rem]">
            Control payouts, cards, and global transfers
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-secondary-500">
            Move your event earnings, store payment methods, send funds across
            countries, and keep vendor cash flow organized in one wallet screen.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-secondary-500">Available Balance</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-secondary-950 xl:text-3xl">
                {moneyFormatter(availableBalance ?? 0, walletCurrency)}
              </p>
            </div>
            <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
              <WalletCards className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-secondary-400">
            Ready for withdrawal, transfers, or vendor card funding.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-secondary-500">Pending Payouts</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-secondary-950 xl:text-3xl">
                {moneyFormatter(pendingBalance ?? 0, walletCurrency)}
              </p>
            </div>
            <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
              <ArrowDownLeft className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-secondary-400">
            Waiting on settlement from ticket revenue and vendor releases.
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-secondary-500">Reserved Funds</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-secondary-950 xl:text-3xl">
                {moneyFormatter(reservedBalance ?? 0, walletCurrency)}
              </p>
            </div>
            <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-secondary-400">
            Held for chargeback protection, refunds, and payout safeguards.
          </p>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 xl:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-4">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
                  Withdrawals
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-secondary-950 xl:text-2xl">
                  Withdraw vendor earnings
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-secondary-500">
                  Send cleared funds to your bank, wallet balance, or preferred
                  payout rail without leaving the dashboard.
                </p>
              </div>
                <span className="inline-flex h-fit rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-500">
                  Same day review
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Withdrawal Amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <SelectField
                    label="Payout Method"
                    value={withdrawChannel}
                    setValue={setWithdrawChannel}
                    options={[
                      { label: "Bank Transfer", value: "bank" },
                      { label: "Vendor Wallet", value: "wallet" },
                      { label: "Instant Cashout", value: "instant" },
                    ]}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex min-h-[116px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Requested
                    </p>
                    <p className="mt-auto pt-5 text-[1.9rem] leading-[1.05] font-semibold tracking-tight text-secondary-950">
                      {moneyFormatter(Number(withdrawAmount || 0), walletCurrency)}
                    </p>
                  </div>
                  <div className="flex min-h-[116px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Fee
                    </p>
                    <p className="mt-auto pt-5 text-[1.9rem] leading-[1.05] font-semibold tracking-tight text-secondary-950">
                      {moneyFormatter(withdrawalFee, walletCurrency)}
                    </p>
                  </div>
                  <div className="flex min-h-[116px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Net Payout
                    </p>
                    <p className="mt-auto pt-5 text-[1.9rem] leading-[1.05] font-semibold tracking-tight text-secondary-950">
                      {moneyFormatter(withdrawNet, walletCurrency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full bg-secondary-500 px-5 text-white hover:bg-secondary-600"
                    onClick={() => {
                      if (isPayoutLocked) {
                        toast.error(
                          "Complete vendor verification before requesting payouts.",
                        );
                        return;
                      }
                      setIsWithdrawDialogOpen(true);
                    }}
                  >
                    <Banknote className="mr-2 size-4" />
                    Request Withdrawal
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-secondary-100">
                    <Link href="/app/wallet/payout-history">
                      View Payout History
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 xl:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-4">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
                  Global Transfer
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-secondary-950 xl:text-2xl">
                  Send money across countries
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-secondary-500">
                  Move funds to vendors, suppliers, venues, and collaborators in
                  multiple supported countries from the same wallet balance.
                </p>
              </div>
                <span className="inline-flex h-fit rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-500">
                  Multi-currency
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Destination Country"
                    value={transferCountry}
                    setValue={setTransferCountry}
                    options={transferDestinations.map((destination) => ({
                      label: `${destination.label} (${destination.currency})`,
                      value: destination.code,
                    }))}
                  />
                  <InputField
                    label="Transfer Amount"
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <InputField
                    label="Recipient Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient name"
                  />
                  <InputField
                    label="Account / Routing Reference"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    placeholder="Account or routing reference"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="flex min-h-[112px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Country
                    </p>
                    <p className="mt-auto pt-5 text-base leading-6 font-semibold text-secondary-950">
                      {selectedDestination.label}
                    </p>
                  </div>
                  <div className="flex min-h-[112px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Currency
                    </p>
                    <p className="mt-auto pt-5 text-base leading-6 font-semibold text-secondary-950">
                      {selectedDestination.currency}
                    </p>
                  </div>
                  <div className="flex min-h-[112px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Payout Rail
                    </p>
                    <p className="mt-auto pt-5 text-base leading-6 font-semibold text-secondary-950 break-words">
                      {selectedDestination.payout}
                    </p>
                  </div>
                  <div className="flex min-h-[112px] min-w-0 flex-col rounded-[1.1rem] bg-secondary-50 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-secondary-400">
                      Total Debit
                    </p>
                    <p className="mt-auto pt-5 text-[1.35rem] leading-tight font-semibold tracking-tight text-secondary-950">
                      {moneyFormatter(transferTotal, selectedDestination.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full bg-secondary-500 px-5 text-white hover:bg-secondary-600"
                    onClick={handleTransfer}
                  >
                    <Globe2 className="mr-2 size-4" />
                    Create Transfer
                  </Button>
                  <Button variant="outline" className="rounded-full border-secondary-100">
                    Save Beneficiary
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
                  Saved Cards
                </p>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-secondary-950 xl:text-2xl">
                  Payment methods
                </h2>
              </div>
              <span className="rounded-2xl bg-secondary-50 p-3 text-secondary-700">
                <CreditCard className="size-5" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {savedCards.length === 0 && (
                <div className="rounded-[1.2rem] border border-dashed border-secondary-200 bg-secondary-50 p-5 text-sm text-secondary-500">
                  No saved payment methods yet.
                </div>
              )}
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-[1.2rem] border border-secondary-100 bg-secondary-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-secondary-950">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="mt-1 text-xs text-secondary-500">
                        {card.holder} · Expires {card.expiry}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-500">
                      {card.type}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={deleteCardMutation.isPending}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              <InputField
                label="Card Holder"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                placeholder="Card holder name"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Card Brand"
                  value={cardBrand}
                  setValue={setCardBrand}
                  options={[
                    { label: "Visa", value: "Visa" },
                    { label: "Mastercard", value: "Mastercard" },
                    { label: "Verve", value: "Verve" },
                  ]}
                />
                <InputField
                  label="Last 4 Digits"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  placeholder="Last 4"
                  maxLength={4}
                />
              </div>
              <Button variant="outline" className="rounded-full border-secondary-100" onClick={handleAddCard}>
                <Plus className="mr-2 size-4" />
                Save Card
              </Button>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-secondary-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-secondary-400">
              Wallet Tools
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: Landmark,
                  title: "Bank Accounts",
                  text: "Store multiple payout accounts for events across regions.",
                },
                {
                  icon: ArrowUpRight,
                  title: "Scheduled Payouts",
                  text: "Automate weekly or post-event settlements from cleared funds.",
                },
                {
                  icon: ShieldCheck,
                  title: "Fraud Protection",
                  text: "Review held funds, payout checks, and card-verification status.",
                },
                {
                  icon: Globe2,
                  title: "International Beneficiaries",
                  text: "Save repeat transfer destinations for venues, agencies, and artists.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-[1.1rem] bg-secondary-50 p-4"
                >
                  <span className="rounded-2xl bg-white p-2 text-secondary-700">
                    <item.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-secondary-950">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-secondary-500">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] bg-secondary-900 p-5 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-white/60">
              Vendor Treasury
            </p>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-tight xl:text-2xl">
              Keep every payout path ready
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Use your wallet to collect event earnings, settle production teams,
              and move money internationally without leaving the vendor dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-white px-5 text-secondary-950 hover:bg-white/90">
                <Link href="/app/wallet/review-treasury">
                Review Treasury
                </Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                onClick={handleExportWalletReport}
              >
                <Download className="mr-2 size-4" />
                Export Wallet Report
              </Button>
            </div>
          </section>
        </div>
      </div>
      </div>
    </>
  );
};

export default memo(WalletPage);
