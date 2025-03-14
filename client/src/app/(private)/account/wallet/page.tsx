"use client";

import { useContext, useEffect, useState } from "react";
import { useGetAppSettings, useGetUserWallet } from "@/hooks";
import { Wallet } from "@/types";

import { BalanceBonus } from "./_components";
import { BalanceShares } from "./_components/balance-shares";
import { BalanceDiscount } from "./_components/balance-discount";
import { MaximizeInfo } from "./_components/maximize-info";
import { AuthContext } from "@/context";
import { BalanceSweat } from "./_components/balance-sweat";
import { BalanceSales } from "./_components/balance-sales";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sharePrice, setSharePrice] = useState(0);
  const [isEarlyBird, setIsEarlyBird] = useState(false);
  const { data: userWallet } = useGetUserWallet();
  const { data: appSettings } = useGetAppSettings();

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (userWallet) setWallet(userWallet);
  }, [userWallet]);

  useEffect(() => {
    if (appSettings) {
      if (appSettings.sharePrice) setSharePrice(appSettings.sharePrice);

      if (
        appSettings.earlyBirdPeriod &&
        Number(appSettings.limitOfSharesPurchased) >
          Number(appSettings.currentSharesPurchased)
      )
        setIsEarlyBird(true);
    }
  }, [appSettings]);

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[32px] leading-[44px] font-semibold">
          Wallet
        </h2>
        <p className="text-[16px] md:text-[20px] leading-[27px] font-semibold mt-0 md:mt-3">
          Your Earnings & Investments in One Place
        </p>
        <div className="flex justify-center gap-4 mt-4 md:mt-10 max-w-full md:flex-nowrap flex-wrap">
          <BalanceBonus
            balance={wallet?.bonusAmount || 0}
            sharePrice={sharePrice}
            isEarlyBird={isEarlyBird}
          />
          <BalanceShares
            balance={wallet?.sharesAmount || 0}
            sharePrice={sharePrice}
            bonusAmount={wallet?.bonusAmount || 0}
            isEarlyBird={isEarlyBird}
          />
        </div>
        <div className="mt-4 flex gap-4 max-w-full md:flex-nowrap flex-wrap">
          <BalanceDiscount balance={wallet?.discountAmount || 0} />
          <MaximizeInfo />
        </div>
        <div className="flex gap-4 mt-4 max-w-full md:flex-nowrap flex-wrap">
          {user?.isStaff && !user?.isSale ? (
            <div className="basis-auto md:basis-1/2">
              <BalanceSweat balance={wallet?.sweatAmount || 0} />
            </div>
          ) : null}
          {user?.isSale && !user?.isStaff ? (
            <div className="basis-full md:basis-1/2">
              <BalanceSales balance={wallet?.salesAmount || 0} />
            </div>
          ) : null}
          {user?.isStaff && user?.isSale ? (
            <>
              <BalanceSweat balance={wallet?.sweatAmount || 0} />
              <BalanceSales balance={wallet?.salesAmount || 0} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
