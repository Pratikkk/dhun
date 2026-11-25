declare module "des.js" {
  interface DesOptions {
    type: "encrypt" | "decrypt";
    key: Buffer;
  }
  interface DesCipher {
    update(data: Buffer): Buffer | number[];
    final(): Buffer | number[];
  }
  export const DES: new (options: DesOptions) => DesCipher;
  export const EDE: new (options: DesOptions) => DesCipher;
}
