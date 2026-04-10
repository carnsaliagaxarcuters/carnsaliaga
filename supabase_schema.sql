-- SQL to create the tables in Supabase

-- Registres
CREATE TABLE IF NOT EXISTS registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anio INTEGER,
  mes TEXT,
  dia_setmana TEXT,
  dia INTEGER,
  caixa DECIMAL(12,2) DEFAULT 0,
  impagats DECIMAL(12,2) DEFAULT 0,
  pagats DECIMAL(12,2) DEFAULT 0,
  proveidors DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  empresa TEXT,
  fecha DATE DEFAULT CURRENT_DATE,
  semana INTEGER,
  campanya TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impagats
CREATE TABLE IF NOT EXISTS impagats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client TEXT,
  import DECIMAL(12,2) DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  observacions TEXT,
  empresa TEXT,
  tipus_pagament TEXT,
  fecha_pagament DATE,
  pagat BOOLEAN DEFAULT FALSE,
  tipus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  import DECIMAL(12,2) DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  proveidor TEXT,
  tipus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gastos Plantilla
CREATE TABLE IF NOT EXISTS gastos_plantilla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  import DECIMAL(12,2) DEFAULT 0,
  proveidor TEXT,
  tipus TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nominas
CREATE TABLE IF NOT EXISTS nominas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empleat TEXT,
  import DECIMAL(12,2) DEFAULT 0,
  fecha DATE DEFAULT CURRENT_DATE,
  estat TEXT DEFAULT 'pendent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proveidors
CREATE TABLE IF NOT EXISTS proveidors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  contacte TEXT,
  categoria TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  telefon TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empresa
CREATE TABLE IF NOT EXISTS empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  nif TEXT,
  direccio TEXT,
  telefon TEXT,
  email TEXT,
  web TEXT,
  sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treballadors
CREATE TABLE IF NOT EXISTS treballadors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  direccio TEXT,
  fecha_naixement DATE,
  dni TEXT,
  num_ss TEXT,
  tipus_contracte TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Horaris (Schedules)
CREATE TABLE IF NOT EXISTS horaris (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treballador_id UUID REFERENCES treballadors(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  torn TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treballador_id, fecha)
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE registros;
ALTER PUBLICATION supabase_realtime ADD TABLE impagats;
ALTER PUBLICATION supabase_realtime ADD TABLE gastos;
ALTER PUBLICATION supabase_realtime ADD TABLE gastos_plantilla;
ALTER PUBLICATION supabase_realtime ADD TABLE nominas;
ALTER PUBLICATION supabase_realtime ADD TABLE proveidors;
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE empresa;
ALTER PUBLICATION supabase_realtime ADD TABLE treballadors;
ALTER PUBLICATION supabase_realtime ADD TABLE horaris;
