/** Cover dan tujuan asli IELTS/TOEFL ITP dipertahankan. */
export function testPrepB1BodyBackground(key:string):string|null {
 const m=/^(ielts|toefl-itp)-b1-[12]$/.exec(key);
 return m?`/slide-cover/${m[1]}-b1-thematic-body-v1.jpg`:null;
}
export function isTestPrepB1BodyCover(cover?:string):boolean {
 return /^\/slide-cover\/(ielts|toefl-itp)-b1-thematic-body-v1\.jpg$/.test(cover||'');
}
