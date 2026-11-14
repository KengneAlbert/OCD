/**
 * Faux client Supabase EN MÉMOIRE pour les tests du module de paiement.
 * Reproduit le sous-ensemble utilisé : select / insert / update, filtres eq, neq, in, not(in|is),
 * lt, gt, lte, gte, count head, single / maybeSingle, retour des lignes après update.
 * Les mises à jour conditionnelles se comportent comme en base (verrou contre le double traitement).
 */
import { randomUUID } from "node:crypto";

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

const parseList = (v: string) =>
  v
    .replace(/^\(|\)$/g, "")
    .split(",")
    .map((s) => s.trim());

class Query implements PromiseLike<{ data: unknown; error: null | { message: string }; count?: number | null }> {
  private op: "select" | "update" | "insert" | "delete" = "select";
  private values: Row | Row[] = {};
  private filters: Filter[] = [];
  private returning = false;
  private head = false;
  private mode: "many" | "single" | "maybe" = "many";

  constructor(
    private db: FakeDb,
    private table: string,
  ) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.head = Boolean(opts?.head);
    else this.returning = true;
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = "insert";
    this.values = values;
    return this;
  }
  update(values: Row) {
    this.op = "update";
    this.values = values;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  neq(col: string, v: unknown) {
    this.filters.push((r) => r[col] !== v);
    return this;
  }
  in(col: string, list: unknown[]) {
    this.filters.push((r) => list.includes(r[col]));
    return this;
  }
  not(col: string, op: string, v: unknown) {
    if (op === "in") {
      const list = parseList(String(v));
      this.filters.push((r) => !list.includes(String(r[col])));
    } else if (op === "is") {
      this.filters.push((r) => (v === null ? r[col] !== null && r[col] !== undefined : r[col] !== v));
    }
    return this;
  }
  lt(col: string, v: unknown) {
    this.filters.push((r) => (r[col] as never) < (v as never));
    return this;
  }
  gt(col: string, v: unknown) {
    this.filters.push((r) => (r[col] as never) > (v as never));
    return this;
  }
  lte(col: string, v: unknown) {
    this.filters.push((r) => (r[col] as never) <= (v as never));
    return this;
  }
  gte(col: string, v: unknown) {
    this.filters.push((r) => (r[col] as never) >= (v as never));
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  single<T = unknown>() {
    this.mode = "single";
    return this as unknown as PromiseLike<{ data: T; error: null | { message: string } }>;
  }
  maybeSingle<T = unknown>() {
    this.mode = "maybe";
    return this as unknown as PromiseLike<{ data: T | null; error: null }>;
  }

  private run() {
    const rows = this.db.rows(this.table);
    const match = () => rows.filter((r) => this.filters.every((f) => f(r)));
    let data: Row[] = [];
    if (this.op === "select") {
      data = match();
      if (this.head) return { data: null, error: null, count: data.length };
    } else if (this.op === "insert") {
      const list = Array.isArray(this.values) ? this.values : [this.values];
      data = list.map((v) => ({ id: randomUUID(), created_at: new Date().toISOString(), ...v }));
      rows.push(...data);
      if (!this.returning) return { data: null, error: null };
    } else if (this.op === "update") {
      data = match();
      for (const r of data) Object.assign(r, this.values);
      if (!this.returning) return { data: null, error: null };
    } else {
      data = match();
      this.db.tables.set(
        this.table,
        rows.filter((r) => !data.includes(r)),
      );
      return { data: null, error: null };
    }
    const copies = data.map((r) => ({ ...r }));
    if (this.mode === "single") return copies[0] ? { data: copies[0], error: null } : { data: null, error: { message: "no rows" } };
    if (this.mode === "maybe") return { data: copies[0] ?? null, error: null };
    return { data: copies, error: null };
  }

  then<A, B>(onfulfilled?: ((v: { data: unknown; error: null | { message: string }; count?: number | null }) => A | PromiseLike<A>) | null, onrejected?: ((e: unknown) => B | PromiseLike<B>) | null) {
    try {
      return Promise.resolve(this.run()).then(onfulfilled, onrejected);
    } catch (e) {
      return Promise.reject(e).then(onfulfilled, onrejected);
    }
  }
}

export class FakeDb {
  tables = new Map<string, Row[]>();
  rows(table: string): Row[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }
  from(table: string) {
    return new Query(this, table);
  }
  /** Stockage (photos) : jamais utilisé par le paiement, présent pour la forme. */
  storage = { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }) }) };
  reset() {
    this.tables.clear();
  }
}

export const fakeDb = new FakeDb();
