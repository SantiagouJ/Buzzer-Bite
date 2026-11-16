export default function RestaurantProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[64px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Perfil
      </h1>

      <section
        aria-label="Información del restaurante"
        className="relative flex w-full flex-col items-center overflow-hidden rounded-[28px] bg-[#1c211e] shadow-[0px_16px_32px_0px_rgba(0,0,0,0.35)]"
      >
        <div
          className="relative mb-[-5px] h-[118px] w-full shrink-0 overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(145.14171661133503deg, rgb(15, 61, 40) 0%, rgb(22, 122, 69) 36%, rgb(11, 42, 28) 80%)",
          }}
        >
          <div className="absolute top-[-60px] left-[210px] size-[180px]">
            <div className="absolute inset-[-20%]">
              <img
                src="/icons/banner-ellipse.svg"
                alt=""
                width={252}
                height={252}
                className="block max-w-none"
              />
            </div>
          </div>

          <div className="absolute top-1/2 left-0 size-[360px] -translate-y-1/2">
            <img
              src="/images/profile-banner-gradient.png"
              alt=""
              className="pointer-events-none size-full object-cover"
            />
          </div>
        </div>

        <div className="flex w-full flex-col items-start px-[22px] pt-[40px] pb-[22px]">
          <div className="flex w-full items-center justify-between pt-2">
            <div className="flex flex-col items-start gap-[2px]">
              <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.1px] text-[#f3f6f4]">
                Frisby
              </h2>

              <div className="flex items-center gap-1">
                <img
                  src="/icons/location-pin-sm.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <p className="text-[13px] font-normal leading-[18px] text-[#8a948d]">
                  Av. 6 Norte #25-60, Cali
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-[79px] left-[23px] size-[72px]">
          <img
            src="/images/store-avatar.png"
            alt="Frisby"
            width={72}
            height={72}
            className="block size-full rounded-full object-cover"
          />
        </div>
      </section>

      <section
        aria-label="Métricas del restaurante"
        className="flex h-[68px] w-full items-start gap-[25px] px-[9px] whitespace-nowrap"
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

      <form className="flex w-full items-center justify-between rounded-[18px] bg-[#1c211e] py-3 pr-3 pl-4">
        <label
          htmlFor="store_open"
          className="cursor-pointer text-[15px] font-semibold leading-5 text-[#f3f6f4]"
        >
          Store open
        </label>

        <label
          htmlFor="store_open"
          className="relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center"
        >
          <input
            id="store_open"
            name="store_open"
            type="checkbox"
            defaultChecked
            className="peer sr-only"
          />
          <img
            src="/icons/toggle-on.svg"
            alt="Store open"
            width={44}
            height={26}
            className="block peer-not-checked:opacity-40"
          />
        </label>
      </form>

      <form className="w-full">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full border border-[#29332e] bg-[#1c211e] py-[15px] text-[15px] font-semibold leading-[22px] text-[#ff8f8f]"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
