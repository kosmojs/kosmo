import Type from "typebox";

export class TDate extends Type.Base<Date> {
  public override Check(value: unknown): value is Date {
    return value instanceof Date;
  }
  public override Errors(value: unknown): object[] {
    return this.Check(value) ? [] : [{ message: "must be Date" }];
  }
  public override Clone(): TDate {
    return new TDate();
  }
}

export class TBlob extends Type.Base<Blob> {
  public override Check(value: unknown): value is Blob {
    return value instanceof Blob;
  }
  public override Errors(value: unknown): object[] {
    return this.Check(value) ? [] : [{ message: "must be Blob" }];
  }
  public override Clone(): TBlob {
    return new TBlob();
  }
}

export class TArrayBuffer extends Type.Base<ArrayBuffer> {
  public override Check(value: unknown): value is ArrayBuffer {
    return value instanceof ArrayBuffer;
  }
  public override Errors(value: unknown): object[] {
    return this.Check(value) ? [] : [{ message: "must be ArrayBuffer" }];
  }
  public override Clone(): TArrayBuffer {
    return new TArrayBuffer();
  }
}

export default {
  Date: new TDate(),
  Blob: new TBlob(),
  ArrayBuffer: new TArrayBuffer(),
};
