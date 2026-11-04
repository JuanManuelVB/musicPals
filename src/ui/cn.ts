import { clsx, type ClassValue } from "clsx";

/** Une clases condicionales. Úsalo en todos los componentes de `ui/`. */
export const cn = (...inputs: ClassValue[]) => clsx(inputs);
