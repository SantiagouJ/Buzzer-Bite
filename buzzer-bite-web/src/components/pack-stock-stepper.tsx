"use client";

import { useState } from "react";

type PackStockStepperProps = {
  initialStock?: number;
};

export default function PackStockStepper({
  initialStock = 3,
}: PackStockStepperProps) {
  const [stock, setStock] = useState(initialStock);

  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <label
        htmlFor="stock"
        className="text-[15px] font-medium leading-[22px] tracking-[-0.1px] text-[#8a948d]"
      >
        Inventario
      </label>

      <div className="flex w-full items-center justify-between gap-[39px]">
        <button
          type="button"
          aria-label="Disminuir inventario"
          onClick={() => setStock((prev) => Math.max(0, prev - 1))}
          className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
        >
          <img src="/icons/minus.svg" alt="" width={24} height={24} />
        </button>

        <input
          id="stock"
          name="stock"
          type="number"
          min={0}
          value={stock}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value, 10);
            setStock(Number.isNaN(parsed) ? 0 : Math.max(0, parsed));
          }}
          className="h-[50px] w-[142px] shrink-0 [appearance:textfield] rounded-[18px] bg-[#101311] px-4 py-[14px] text-center text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label="Aumentar inventario"
          onClick={() => setStock((prev) => prev + 1)}
          className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
        >
          <img src="/icons/plus.svg" alt="" width={24} height={24} />
        </button>
      </div>
    </div>
  );
}
