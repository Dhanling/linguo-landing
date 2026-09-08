/* [boot-splash-v1] Skrip inline untuk src/app/akun/layout.tsx — modul polos (tanpa
   "use client") supaya bisa diimpor server component. Jalan SEBELUM paint pertama:
   1. pasang kelas `lms-dark` di <html> dari localStorage "lms-dark-mode" (kunci
      yang sama dengan StudentShell — dulu skrip ini cuma ikut ter-render kalau
      shell-nya ikut, padahal saat refresh HTML awal /akun cuma spinner tanpa shell,
      jadi pengguna mode gelap selalu kena kilat terang dulu);
   2. warnai tirai #boot-splash + latar <html> sesuai tema;
   3. sediakan window.__bootSplashDismiss (dipanggil src/lib/bootSplash.ts) dan
      jaring pengaman 8 detik supaya tirai tak pernah mengunci layar. */
export const AKUN_BOOT_SCRIPT = `(function(){try{
var dark=localStorage.getItem("lms-dark-mode")==="1";
var d=document.documentElement;d.classList.toggle("lms-dark",dark);
var bg=dark?"#000000":"#EEF1F4";d.style.backgroundColor=bg;
var el=document.getElementById("boot-splash");
if(el){el.style.background=bg;var im=el.querySelector("img");if(im&&dark)im.src="/images/logo-linguo-white-full.png";}
var done=false;
window.__bootSplashDismiss=function(){if(done)return;done=true;var e=document.getElementById("boot-splash");if(!e)return;e.style.opacity="0";setTimeout(function(){e.remove();d.style.backgroundColor="";},260);};
setTimeout(window.__bootSplashDismiss,8000);
}catch(e){}})();`;
