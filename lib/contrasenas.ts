import * as crypto from "node:crypto";
import { verifyPassword as verificarScrypt } from "better-auth/crypto";

type ParametrosArgon2 = {
  message: string;
  nonce: Buffer;
  parallelism: number;
  tagLength: number;
  memory: number;
  passes: number;
};

type Argon2 = (
  algoritmo: "argon2id",
  parametros: ParametrosArgon2,
  listo: (error: Error | null, clave: Buffer) => void,
) => void;

// Parámetros mínimos recomendados por OWASP para argon2id.
const MEMORIA_KIB = 19456;
const PASADAS = 2;
const PARALELISMO = 1;
const LARGO_CLAVE = 32;
const LARGO_SAL = 16;
const PREFIJO = "$argon2id$v=19$";

// node:crypto trae argon2 desde Node 24.7; los tipos de @types/node 20 todavía no lo declaran.
const argon2 = (crypto as unknown as { argon2: Argon2 }).argon2;

function derivar({ contrasena, sal }: { contrasena: string; sal: Buffer }) {
  return new Promise<Buffer>((resolver, rechazar) => {
    argon2(
      "argon2id",
      {
        message: contrasena,
        nonce: sal,
        parallelism: PARALELISMO,
        tagLength: LARGO_CLAVE,
        memory: MEMORIA_KIB,
        passes: PASADAS,
      },
      (error, clave) => (error ? rechazar(error) : resolver(clave)),
    );
  });
}

// Sección 8 (seguridad): contraseñas con hash argon2id, en el formato PHC estándar.
export async function hashearContrasena(contrasena: string) {
  const sal = crypto.randomBytes(LARGO_SAL);
  const clave = await derivar({ contrasena, sal });

  return `${PREFIJO}m=${MEMORIA_KIB},t=${PASADAS},p=${PARALELISMO}$${sal.toString("base64url")}$${clave.toString("base64url")}`;
}

// Sección 8: verifica argon2id; los hashes viejos de Better Auth (scrypt) se siguen aceptando
// hasta que el usuario cambie la contraseña, para no dejar afuera a nadie de la base publicada.
export async function verificarContrasena({
  hash,
  password,
}: {
  hash: string;
  password: string;
}) {
  if (!hash.startsWith(PREFIJO)) {
    return verificarScrypt({ hash, password });
  }

  const [, , , , salTexto, claveTexto] = hash.split("$");
  const esperada = Buffer.from(claveTexto ?? "", "base64url");
  const obtenida = await derivar({
    contrasena: password,
    sal: Buffer.from(salTexto ?? "", "base64url"),
  });

  return (
    esperada.length === obtenida.length &&
    crypto.timingSafeEqual(esperada, obtenida)
  );
}
