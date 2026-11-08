import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = {
  title: "Ingresar · Power Up",
};

async function RedirigirSiHaySesion() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  if (sesion) {
    redirect("/");
  }

  return null;
}

export default function Login() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[auto_1fr]">
      <Suspense fallback={null}>
        <RedirigirSiHaySesion />
      </Suspense>
      <main className="flex flex-col bg-black px-6 py-8 sm:px-12 lg:w-[30rem] lg:pl-16 lg:pr-18 lg:py-12">
        <Logo className="h-8 w-auto self-center text-white lg:hidden" />

        <div className="flex flex-1 items-center py-16">
          <div className="flex w-full flex-col gap-10">
            <header className="flex flex-col gap-3">
              <h1 className="font-pixel text-7xl leading-none tracking-[-0.01em]">
                Ingresar
              </h1>
              <p className="text-[0.9375rem] text-neutral-400">
                Entrá con tu cuenta de Power Up.
              </p>
            </header>

            <FormularioLogin />
          </div>
        </div>

        <p className="text-sm text-neutral-500">
          ¿No tenés cuenta? Pedísela al administrador.
        </p>
      </main>

      <aside
        aria-hidden="true"
        className="hidden bg-green-950 lg:block relative overflow-hidden"
      >
        <Image
          src="/Jason_and_Lucia_Beach_landscape.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 1px"
          className="object-cover object-[70%_center]"
        />
        <Logo className="h-22 absolute left-1/2 top-1/2 -translate-1/2 w-auto self-start text-white bg-black p-2" />
      </aside>
    </div>
  );
}
