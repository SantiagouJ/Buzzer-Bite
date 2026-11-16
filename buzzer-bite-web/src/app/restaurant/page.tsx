const PICKUP_HOURS = [
  { value: "12:00", label: "12 PM" },
  { value: "13:00", label: "1 PM" },
  { value: "14:00", label: "2 PM" },
  { value: "15:00", label: "3 PM" },
  { value: "16:00", label: "4 PM" },
  { value: "17:00", label: "5 PM" },
  { value: "18:00", label: "6 PM" },
  { value: "19:00", label: "7 PM" },
  { value: "20:00", label: "8 PM" },
  { value: "21:00", label: "9 PM" },
  { value: "22:00", label: "10 PM" },
  { value: "23:00", label: "11 PM" },
] as const;

export default function RestaurantDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-4 px-5 pt-[84px] pb-28">
      <div className="flex h-12 w-full items-start justify-center">
        <img src="/brand/logo.svg" alt="" width={48} height={45.7019} />
      </div>

      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Tablero
      </h1>

      <section
        aria-label="Métricas del restaurante"
        className="flex h-[68px] w-full items-start gap-[25px] whitespace-nowrap"
      >
        <div className="flex flex-col items-start gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-semibold leading-6 text-[#f3f6f4]">2</p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Packs Activos
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-bold leading-6 text-[#f3f6f4]">12</p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Vendidos Hoy
          </p>
        </div>

        <div className="flex flex-col items-start justify-center gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-bold leading-6 text-[#2ee07a]">$144k</p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Ganancias
          </p>
        </div>
      </section>

      <form className="flex w-full flex-col items-start gap-[25px]">
        <div className="flex w-full flex-col items-start gap-[22px]">
          <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.1px] text-[#f3f6f4]">
            Nuevo pack
          </h2>

          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="image"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              IMAGEN
            </label>
            <label
              htmlFor="image"
              className="flex h-[196px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#1c211e] px-4 py-[14px]"
            >
              <img src="/icons/upload.svg" alt="" width={34} height={34} />
              <span className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
                SUBIR ARCHIVO
              </span>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
              />
            </label>
          </div>

          <fieldset className="flex w-full flex-col items-start gap-2">
            <legend className="mb-2 text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
              TIPO DE PAQUETE
            </legend>
            <div className="flex w-full items-start gap-2">
              <label className="flex w-1/2 cursor-pointer items-center justify-center rounded-full bg-[#1c211e] py-4 text-[16px] font-semibold leading-[22px] text-white has-[:checked]:bg-[#2ee07a] has-[:checked]:text-[#0b0d0c]">
                <input
                  type="radio"
                  name="pack_type"
                  value="Sorpresa"
                  defaultChecked
                  className="sr-only"
                />
                <span>Sorpresa</span>
              </label>

              <label className="flex w-1/2 cursor-pointer items-center justify-center rounded-full bg-[#1c211e] py-4 text-[16px] font-semibold leading-[22px] text-white has-[:checked]:bg-[#2ee07a] has-[:checked]:text-[#0b0d0c]">
                <input
                  type="radio"
                  name="pack_type"
                  value="Fijo"
                  className="sr-only"
                />
                <span>Fijo</span>
              </label>
            </div>
          </fieldset>

          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="discount_price"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              PRECIO (COP)
            </label>
            <input
              id="discount_price"
              name="discount_price"
              type="text"
              inputMode="numeric"
              defaultValue="$12.000"
              placeholder="$12.000"
              className="w-full rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#8e9892]"
            />
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="stock"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              CANTIDAD
            </label>
            <div className="flex w-full items-center justify-between gap-[39px]">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
              >
                <img src="/icons/minus.svg" alt="" width={24} height={24} />
              </button>

              <input
                id="stock"
                name="stock"
                type="number"
                min={1}
                defaultValue={3}
                className="h-[50px] w-[173px] shrink-0 [appearance:textfield] rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-center text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                type="button"
                aria-label="Aumentar cantidad"
                className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
              >
                <img src="/icons/plus.svg" alt="" width={24} height={24} />
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
              HORA DE RECOGIDA
            </span>
            <div className="flex h-[50px] w-full items-start justify-between gap-5">
              <div className="flex w-[170px] items-center gap-[10px] rounded-[18px] bg-[#1c211e] px-4 py-[14px]">
                <img
                  src="/icons/clock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <select
                  id="pickup_start"
                  name="pickup_start"
                  aria-label="Hora de inicio de recogida"
                  defaultValue="17:00"
                  className="w-full cursor-pointer appearance-none bg-transparent text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none"
                >
                  {PICKUP_HOURS.map((hour) => (
                    <option
                      key={hour.value}
                      value={hour.value}
                      className="bg-[#1c211e] text-[#f3f6f4]"
                    >
                      {hour.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-[170px] items-center gap-[10px] rounded-[18px] bg-[#1c211e] px-4 py-[14px]">
                <img
                  src="/icons/clock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <select
                  id="pickup_end"
                  name="pickup_end"
                  aria-label="Hora de fin de recogida"
                  defaultValue="22:00"
                  className="w-full cursor-pointer appearance-none bg-transparent text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none"
                >
                  {PICKUP_HOURS.map((hour) => (
                    <option
                      key={hour.value}
                      value={hour.value}
                      className="bg-[#1c211e] text-[#f3f6f4]"
                    >
                      {hour.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
        >
          Crear Pack
        </button>
      </form>
    </main>
  );
}
