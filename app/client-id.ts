// UI identifiers carry no authorization; support HTTP development previews too.
export function clientId(){const bytes=crypto.getRandomValues(new Uint8Array(16));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
