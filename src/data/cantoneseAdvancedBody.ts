/** Imagegen baru untuk isi Kanton B1/B2; pasangan cover/tujuan per sesi dipertahankan. */
export function cantoneseAdvancedBody(key:string):string|null{
 return /^cantonese-(?:b1-[1-5]|b2-[1-7])$/.test(key)?'/slide-cover/cantonese-advanced-thematic-body-v1.jpg':null;
}
export function isCantoneseAdvancedBody(cover?:string):boolean{
 return cover==='/slide-cover/cantonese-advanced-thematic-body-v1.jpg';
}
