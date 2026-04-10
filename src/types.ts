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
}

export interface GastoPlantilla {
  id: string;
  nom: string;
  import: number;
  proveidor: string;
  tipus: string;
}

export interface Nomina {
  id: string;
  empleat: string;
  import: number;
  fecha: string;
  estat: 'pendent' | 'pagat';
}

export interface Proveidor {
  id: string;
  nom: string;
  contacte: string;
  categoria: string;
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
}

export interface Horari {
  id: string;
  treballador_id: string;
  fecha: string;
  torn: string;
}
