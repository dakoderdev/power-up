"use client";

import Link from "next/link";
import { ChevronDown } from "pixelarticons/react/ChevronDown.js";
import { Logout } from "pixelarticons/react/Logout.js";
import { User } from "pixelarticons/react/User.js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cerrarSesion } from "./actions";

const PALABRAS_INICIALES = 2;

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, PALABRAS_INICIALES)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

// Sección 4 y US-32: el usuario conectado, su rol, el acceso a Perfil y Salir, en un menú.
export function MenuUsuario({ nombre, rol }: { nombre: string; rol: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Menú de ${nombre}`}
          className="min-w-0 gap-1.5 md:gap-3"
        >
          <Avatar>
            <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 items-baseline gap-2 sm:flex">
            <span className="truncate text-sm font-medium text-foreground">
              {nombre}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {rol}
            </span>
          </span>
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="truncate text-sm font-medium text-foreground">
            {nombre}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {rol}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/perfil">
              <User aria-hidden="true" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <form action={cerrarSesion}>
            <DropdownMenuItem asChild>
              <button type="submit">
                <Logout aria-hidden="true" />
                Salir
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
