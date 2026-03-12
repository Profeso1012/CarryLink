import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { paymentsApi } from "@/api/payments.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bank,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BANK_CODES: Record<string, { name: string; code: string; country: string }> = {
  NG: {
    "058": { name: "GT Bank", code: "058", country: "NG" },
    "044": { name: "Access Bank", code: "044", country: "NG" },
    "050": { name: "Fidelity Bank", code: "050", country: "NG" },
    "035": { name: "First Bank Nigeria", code: "035", country: "NG" },
    "011": { name: "First City Monument Bank", code: "011", country: "NG" },
    "999": { name: "UBA", code: "999", country: "NG" },
  },
};

interface AddAccountFormState {
  provider: "paystack" | "stripe" | "flutterwave" | "";
  country: string;
  bankCode: string;
  accountNumber: string;
  accountName: "";
  currency: string;
}

export default function PayoutAccountsPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<"form" | "verify">("form");
  const [formData, setFormData] = useState<AddAccountFormState>({
    provider: "",
    country: "NG",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    currency: "NGN",
  });
  const [verifiedData, setVerifiedData] = useState<{
    account_name: string;
    bank_name: string;
  } | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["payout-accounts"],
    queryFn: () => paymentsApi.getPayoutAccounts(),
  });

  const verifyAccountMutation = useMutation({
    mutationFn: () =>
      paymentsApi.verifyPayoutAccount(
        (formData.provider as any) || "paystack",
        formData.bankCode,
        formData.accountNumber,
        formData.currency,
        formData.country
      ),
    onSuccess: (data) => {
      setVerifiedData(data);
      setVerificationStep("verify");
      toast.success("Account verified successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify account");
    },
  });

  const saveAccountMutation = useMutation({
    mutationFn: () =>
      paymentsApi.savePayoutAccount(
        (formData.provider as any) || "paystack",
        formData.bankCode,
        formData.accountNumber,
        verifiedData?.account_name || "",
        verifiedData?.bank_name || "",
        formData.currency,
        formData.country
      ),
    onSuccess: () => {
      toast.success("Payout account saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save account");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) => paymentsApi.deletePayoutAccount(accountId),
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
      setIsDeleteAlertOpen(false);
      setSelectedAccountId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (accountId: string) => paymentsApi.setDefaultPayoutAccount(accountId),
    onSuccess: () => {
      toast.success("Default account updated");
      queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update default account");
    },
  });

  const resetForm = () => {
    setFormData({
      provider: "",
      country: "NG",
      bankCode: "",
      accountNumber: "",
      accountName: "",
      currency: "NGN",
    });
    setVerifiedData(null);
    setVerificationStep("form");
  };

  const handleVerify = () => {
    if (!formData.bankCode || !formData.accountNumber) {
      toast.error("Please fill in all fields");
      return;
    }
    verifyAccountMutation.mutate();
  };

  const handleSave = () => {
    if (!verifiedData) {
      toast.error("Account not verified");
      return;
    }
    saveAccountMutation.mutate();
  };

  const getBankName = () => {
    if (formData.country === "NG" && BANK_CODES.NG[formData.bankCode as keyof typeof BANK_CODES.NG]) {
      return BANK_CODES.NG[formData.bankCode as keyof typeof BANK_CODES.NG].name;
    }
    return "";
  };

  return (
    <AccountLayout>
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Payout Accounts</h2>
            <p className="text-gray-500 text-sm">Add and manage your bank accounts for withdrawals</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12 px-8 uppercase tracking-widest text-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={cn("p-6 space-y-6 border-l-[6px]", account.is_default ? "border-carry-light" : "border-gray-100")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                        <Bank className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-carry-darker text-sm truncate">{account.bank_name}</h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                          {account.account_number_masked}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2">
                          {account.account_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_default && (
                        <Badge className="bg-amber-50 text-amber-600 border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Currency</span>
                      <span className="text-sm font-bold text-carry-darker">{account.currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Country</span>
                      <span className="text-sm font-bold text-carry-darker">{account.country}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</span>
                      <Badge className="bg-green-50 text-green-600 border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(account.id)}
                        disabled={setDefaultMutation.isPending}
                        className="flex-1 font-bold text-xs uppercase tracking-widest h-9"
                      >
                        {setDefaultMutation.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Make Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccountId(account.id);
                        setIsDeleteAlertOpen(true);
                      }}
                      className="font-bold text-xs uppercase tracking-widest h-9 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-sm p-20 flex flex-col items-center text-center">
            <Bank className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-carry-darker mb-2">No payout accounts</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              Add a bank account to start withdrawing funds from your wallet.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12 px-8 uppercase tracking-widest text-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Account
            </Button>
          </Card>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-carry-darker text-white">
            <DialogTitle className="text-2xl font-black">Add Payout Account</DialogTitle>
            <DialogDescription className="text-gray-300">
              {verificationStep === "form"
                ? "Enter your bank account details"
                : "Verify your account information"}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            {verificationStep === "form" ? (
              <>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                    Provider
                  </label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select payment provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paystack">Paystack</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                    Country
                  </label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.country === "NG" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                        Bank
                      </label>
                      <Select
                        value={formData.bankCode}
                        onValueChange={(value) => setFormData({ ...formData, bankCode: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BANK_CODES.NG).map(([code, bank]) => (
                            <SelectItem key={code} value={code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                        Account Number
                      </label>
                      <Input
                        type="text"
                        placeholder="0123456789"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, "") })}
                        className="h-12 font-mono"
                        maxLength={10}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                        Currency
                      </label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                          <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-sm p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-green-900">Account Verified</h4>
                      <p className="text-[11px] text-green-800 mt-1">Your account details have been verified</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-gray-50 rounded-sm">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Account Holder</span>
                    <span className="text-sm font-bold text-carry-darker">{verifiedData?.account_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bank</span>
                    <span className="text-sm font-bold text-carry-darker">{verifiedData?.bank_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Account Number</span>
                    <span className="text-sm font-bold font-mono text-carry-darker">{formData.accountNumber}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Verify that the account holder name matches your KYC-verified identity. If it doesn't match exactly, the withdrawal may fail.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                if (verificationStep === "verify") {
                  setVerificationStep("form");
                  setVerifiedData(null);
                } else {
                  setIsAddDialogOpen(false);
                  resetForm();
                }
              }}
              disabled={verifyAccountMutation.isPending || saveAccountMutation.isPending}
              className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
            >
              {verificationStep === "verify" ? "Back" : "Cancel"}
            </Button>
            <Button
              onClick={verificationStep === "form" ? handleVerify : handleSave}
              disabled={verifyAccountMutation.isPending || saveAccountMutation.isPending}
              className="flex-1 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12"
            >
              {verifyAccountMutation.isPending || saveAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {verifyAccountMutation.isPending ? "Verifying..." : "Saving..."}
                </>
              ) : verificationStep === "form" ? (
                "Verify Account"
              ) : (
                "Save Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payout Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will no longer be able to withdraw to this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (selectedAccountId) {
                deleteAccountMutation.mutate(selectedAccountId);
              }
            }}
            disabled={deleteAccountMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </AccountLayout>
  );
}
