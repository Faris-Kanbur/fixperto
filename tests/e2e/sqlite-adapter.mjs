// better-sqlite3 yerine Node'un yerleşik node:sqlite'ı — YALNIZCA TESTLER İÇİN.
// Bu ortamda better-sqlite3'ün derlenmiş ikili dosyası çalışmıyor (invalid ELF header).
// Uygulama kodu HİÇ değişmiyor: bu dosya, testin ESM yükleyicisiyle "better-sqlite3"
// isteğinin yerine geçiyor (bkz. loader.mjs). Amaç, gerçek Express uygulamasını gerçek
// SQL ile çalıştırmak — sahte (mock) veritabanıyla test, gerçek akışı test etmiş sayılmaz.
import { DatabaseSync } from "node:sqlite";

class Stmt {
  constructor(db, sql) { this.db = db; this.sql = sql; this._s = db.prepare(sql); }
  #args(args) {
    if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
      const out = {};
      for (const [k, v] of Object.entries(args[0])) out[k] = v === undefined ? null : v;
      return [out];
    }
    return args.map((a) => (a === undefined ? null : a));
  }
  run(...args) { const r = this._s.run(...this.#args(args)); return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) }; }
  get(...args) { return this._s.get(...this.#args(args)); }
  all(...args) { return this._s.all(...this.#args(args)); }
  iterate(...args) { return this.all(...args)[Symbol.iterator](); }
}

export default class Database {
  constructor(file) { this._db = new DatabaseSync(file); }
  pragma(str) { try { return this._db.exec(`PRAGMA ${str};`); } catch { return null; } }
  exec(sql) { return this._db.exec(sql); }
  prepare(sql) { return new Stmt(this._db, sql); }
  transaction(fn) {
    return (...args) => {
      this._db.exec("BEGIN");
      try { const out = fn(...args); this._db.exec("COMMIT"); return out; }
      catch (e) { try { this._db.exec("ROLLBACK"); } catch { /* zaten kapalı */ } throw e; }
    };
  }
  close() { try { this._db.close(); } catch { /* zaten kapalı */ } }
}
