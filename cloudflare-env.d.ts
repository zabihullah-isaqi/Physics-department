declare namespace Cloudflare {
  interface Env {
    TRANSLATION_OPENAI_API_KEY?:string;
    TRANSLATION_MODEL?:string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
