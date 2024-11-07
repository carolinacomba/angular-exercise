import { Producto } from "./producto";

export interface Orden {
  id?: number;
  customerName: string;
  email: string;
  products: Producto[];
  total: number;
  orderCode?: string;
  timestamp?: string;
}
