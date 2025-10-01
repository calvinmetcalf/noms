import { Readable } from 'readable-stream';

class Noms extends Readable {
  constructor(options) {
    super(options);
    this.inProgress = false;
    this.lastPush = void 0;
    this.started = false;
    this.errored = false;
  }
  push(chunk, encoding) {
    this.lastPush = super.push(chunk, encoding);
    return this.lastPush;
  }
  nom(callback) {
    callback(null, null);
  }
  _read(size) {
    if (this.inProgress || this.errored) {
      return;
    }
    if (this.started === false) {
      this.inProgress = true;
      this.callStart(size);
      return;
    }
    this.inProgress = true;
    this.callRead(size);
  }
  _before(next) {
    next();
  }
  callRead(size) {
    var useSize = this.nom.length > 1;
    // so if nothing is pushed, we'll go agian
    this.lastPush = true;
    const cb = (err, chunk) => {
      if (err) {
        this.errored = true;
        this.inProgress = false;
        this.emit('error', err);
        return;
      }
      if (chunk !== undefined) {
        this.push(chunk);
      }
      if (this.lastPush) {
        return this.callRead(size);
      } else {
        this.inProgress = false;
      }
    }
    if (useSize) {
      this.nom(size, cb);
    } else {
      this.nom(cb);
    }
  }
  callStart(size) {
    const cb = (err, chunk) => {
      this.started = true;
      if (err) {
        this.errored = true;
        this.inProgress = false;
        this.emit('error', err);
        return;
      }
      if (chunk !== undefined) {
        this.push(chunk);
      }
      this.callRead(size);
    }
    this._before(cb);
  };
}

export function ctor(read, before) {

  class YourStream extends Noms {
    #read = read;
    #before = before;
    get nom() {
      return this.#read;
    }
    set nom(value) {
      this.#read = value;
    }
    get _before() {
      if (typeof before === 'function') {
        return before
      }
      return super._before;
    }
    set _before(value) {
      this.#before = value
    }
  }
  return YourStream;
}
export default (options, read, before) => {
  if (typeof options === 'function') {
    before = read;
    read = options;
    options = {};
  }
  return new (ctor(read, before))(options);
};
export const obj = (options = {}, read, before) => {
  if (typeof options === 'function') {
    before = read;
    read = options;
    options = undefined;
  }
  var out = { ...options }
  out.objectMode = true;
  return new (ctor(read, before))(out);
};