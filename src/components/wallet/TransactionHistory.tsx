import React from 'react';
import { Transaction } from '../../types';

interface TransactionHistoryProps {
  txs: Transaction[];
  scansCount: number;
  language: 'da' | 'en';
}

export default function TransactionHistory({ txs, scansCount, language }: TransactionHistoryProps) {
  return (
    <div className="text-left">
      <span className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
        {language === 'da' ? `Seneste aktiviteter (${scansCount} i alt)` : `Recent Activity (${scansCount} total)`}
      </span>
      <div className="flex flex-col border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-3xs divide-y divide-gray-100">
        {txs.map((tx) => (
          <div key={tx.id} className="flex justify-between items-center p-4">
            <div className="text-left">
              <h5 className="text-xs font-extrabold text-primary tracking-tight leading-tight">{tx.title}</h5>
              <p className="text-[9px] text-muted-text font-bold mt-1 leading-none">{tx.date}</p>
            </div>
            <div className="shrink-0 select-none text-right">
              <span className={`text-xs font-black font-mono ${
                tx.amount.startsWith('-') 
                  ? 'text-red-500' 
                  : tx.isPoints || tx.amount.endsWith('CP')
                    ? 'text-amber-500'
                    : 'text-success-alt'
              }`}>
                {tx.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
