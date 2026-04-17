export interface Registro {
  id: string;
  anio: number;
  mes: string;
  dia_setmana: string;
  dia: number;
  caixa: number;
  impagats: number;
  pagats: number;
  proveidors: number;
  total: number;
  empresa: string;
  fecha: string;
  semana: number;
  campanya: string;
}

export interface Impagat {
  id: string;
  client: string;
  import: number;
  fecha: string;
  observacions: string;
  empresa: string;
  tipus_pagament: string;
  fecha_pagament: string | null;
  pagat: boolean;
  tipus: string;
}

export interface Gasto {
  id: string;
  nom: string;
  import: number;
  fecha: string;
  proveidor: string;
  tipus: string;
  empresa: string;
}

export interface GastoPlantilla {
  id: string;
  nom: string;
  import: number;
  proveidor: string;
  tipus: string;
  empresa: string;
  fecha_cobro?: string;
}

export interface PagoProveedor {
  id: string;
  proveedor: string;
  import: number;
  fecha: string;
  num_factura: string;
  empresa: string;
  observaciones: string;
  tipo_pago: string;
  pagado: boolean;
  fecha_pago: string | null;
  tipo: string;
}

export interface Nomina {
  id: string;
  empleat: string;
  import: number;
  fecha: string;
  estat: 'pendent' | 'pagat';
  empresa: string;
}

export interface Proveidor {
  id: string;
  nom: string;
  nif: string;
  email: string;
  telefon: string;
  ciutat: string;
  direccio: string;
  web: string;
  empresa: string;
  tipus: string;
}

export interface Cliente {
  id: string;
  nom: string;
  tipo: string;
  empresa_cliente: string;
  telefon: string;
  es_empresa: boolean;
  email: string;
  nif: string;
  direccion: string;
  poblacion: string;
  movil: string;
  iban: string;
  provincia: string;
  pais: string;
  codi_postal: string;
  empresa: string;
}

export interface Empresa {
  id: string;
  nom: string;
  nif: string;
  direccio: string;
  telefon: string;
  email: string;
  web: string;
  sector: string;
}

export interface Treballador {
  id: string;
  nom: string;
  direccio: string;
  fecha_naixement: string;
  dni: string;
  num_ss: string;
  tipus_contracte: string;
  hores_contractades?: number;
  empresa: string;
}

export interface Horari {
  id: string;
  treballador_id: string;
  fecha: string;
  entrada_mati: string | null;
  sortida_mati: string | null;
  entrada_tarda: string | null;
  sortida_tarda: string | null;
  empresa: string;
}
