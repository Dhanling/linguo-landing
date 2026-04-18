#!/usr/bin/env node
// onesignal-landing-setup.mjs
// Integrates OneSignal Web Push into linguo.id:
//   1. Adds OneSignal SDK to layout.tsx (app-wide)
//   2. Creates OneSignalProvider component that tags user with student_id
//   3. Replaces StudentRealtimeNotifs with simplified polling-only version
//      (OneSignal handles its own bell/permission UI)
//
// Usage: drag ke ~/linguo-landing → cd ~/linguo-landing → node onesignal-landing-setup.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ONESIGNAL_APP_ID = 'c8782cfd-fec1-450b-b72b-d1869e5faa5f';

if (!fs.existsSync('src/app/akun/page.tsx')) {
  console.error('❌ Run di ~/linguo-landing');
  process.exit(1);
}

console.log('🚀 OneSignal Web Push Setup');
console.log('─'.repeat(50));

// =========================================================================
// STEP 1 — Create OneSignalProvider component
// =========================================================================

const providerContent = `'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const ONESIGNAL_APP_ID = '${ONESIGNAL_APP_ID}';

export default function OneSignalProvider() {
  useEffect(() => {
    // Load OneSignal SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => initOneSignal();
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function initOneSignal() {
    try {
      const OneSignal = (window as any).OneSignal || [];
      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];

      (window as any).OneSignalDeferred.push(async (onesignal: any) => {
        await onesignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: 'web.onesignal.auto.${ONESIGNAL_APP_ID}',
          notifyButton: {
            enable: true,
            size: 'medium',
            position: 'bottom-right',
            offset: { bottom: '90px', right: '16px' },
            colors: {
              'circle.background': '#1A9E9E',
              'circle.foreground': 'white',
              'badge.background': '#1A9E9E',
              'badge.foreground': 'white',
              'badge.bordercolor': 'white',
              'pulse.color': '#1A9E9E',
              'dialog.button.background.hovering': '#1A9E9E',
              'dialog.button.background.active': '#158a8a',
              'dialog.button.background': '#1A9E9E',
              'dialog.button.foreground': 'white',
            },
            text: {
              'tip.state.unsubscribed': 'Aktifkan notifikasi',
              'tip.state.subscribed': 'Notifikasi aktif',
              'tip.state.blocked': 'Notifikasi diblokir',
              'message.prenotify': 'Klik untuk aktifkan notif jadwal kelas',
              'message.action.subscribed': 'Notifikasi aktif!',
              'message.action.resubscribed': 'Notifikasi aktif!',
              'message.action.unsubscribed': 'Notifikasi dimatikan',
              'dialog.main.title': 'Notifikasi Linguo.id',
              'dialog.main.button.subscribe': 'Aktifkan',
              'dialog.main.button.unsubscribe': 'Matikan',
              'dialog.blocked.title': 'Buka Blokir Notifikasi',
              'dialog.blocked.message': 'Aktifkan notif di setting browser kamu.',
            },
          },
          welcomeNotification: {
            title: 'Linguo.id',
            message: '🔔 Notifikasi jadwal kelas aktif!',
          },
          promptOptions: {
            slidedown: {
              prompts: [{
                type: 'push',
                autoPrompt: false,
                text: {
                  actionMessage: 'Aktifkan notifikasi untuk update jadwal kelas kamu secara real-time.',
                  acceptButton: 'Aktifkan',
                  cancelButton: 'Nanti aja',
                },
                delay: {
                  pageViews: 1,
                  timeDelay: 5,
                },
              }],
            },
          },
        });

        // Tag user dengan student_id supaya bisa targeted push
        await tagUserIfLoggedIn(onesignal);
      });
    } catch (e) {
      console.warn('[OneSignal] Init failed:', e);
    }
  }

  async function tagUserIfLoggedIn(onesignal: any) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData?.user?.email;
      if (!email) return;

      const { data: student } = await supabase
        .from('students')
        .select('id, name')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (!student?.id) return;

      // Set external user ID — this is how we target specific students
      await onesignal.login(student.id);

      // Also set tags for filtering
      await onesignal.User.addTags({
        student_id: student.id,
        student_name: student.name || '',
        user_type: 'student',
      });

      console.log('[OneSignal] Tagged user:', student.id, student.name);
    } catch (e) {
      console.warn('[OneSignal] Tag user failed:', e);
    }
  }

  return null; // No UI — OneSignal renders its own bell
}
`;

fs.mkdirSync('src/components', { recursive: true });
fs.writeFileSync('src/components/OneSignalProvider.tsx', providerContent);
console.log('✓ Created src/components/OneSignalProvider.tsx');

// =========================================================================
// STEP 2 — Add OneSignalProvider to /akun page.tsx
// =========================================================================

let page = fs.readFileSync('src/app/akun/page.tsx', 'utf8');
const origPage = page;

// Add import
if (!page.includes('OneSignalProvider')) {
  const importBlock = page.match(/^(import [\s\S]+?from ['"][^'"]+['"];?\s*\n)+/m);
  if (importBlock) {
    page = page.replace(
      importBlock[0],
      importBlock[0] + `import OneSignalProvider from '@/components/OneSignalProvider';\n`
    );
    console.log('✓ Added import OneSignalProvider');
  }
}

// Replace StudentRealtimeNotifs with OneSignalProvider in render
if (page.includes('<StudentRealtimeNotifs') && !page.includes('<OneSignalProvider')) {
  page = page.replace('<StudentRealtimeNotifs />', '<OneSignalProvider />');
  console.log('✓ Replaced StudentRealtimeNotifs with OneSignalProvider in render');
} else if (!page.includes('<OneSignalProvider')) {
  // Inject before ClassDetailModal or BookingModal
  const anchor = page.match(/\{detailReg\s*&&\s*<ClassDetailModal/) ||
                 page.match(/\{bookingReg\s*&&\s*\(/);
  if (anchor && anchor.index !== undefined) {
    page = page.slice(0, anchor.index) + `<OneSignalProvider />\n      ` + page.slice(anchor.index);
    console.log('✓ Injected <OneSignalProvider /> into render');
  }
}

if (page !== origPage) {
  fs.writeFileSync('src/app/akun/page.tsx', page);
  console.log('✓ Saved src/app/akun/page.tsx');
}

// =========================================================================
// STEP 3 — Add OneSignal service worker to public/
// =========================================================================

const onesignalSW = `importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');`;
fs.writeFileSync('public/OneSignalSDKWorker.js', onesignalSW);
console.log('✓ Created public/OneSignalSDKWorker.js');

// =========================================================================
// STEP 4 — git push
// =========================================================================

try {
  console.log('\n🔄 git add / commit / push...');
  execSync('git add -A', { stdio: 'inherit' });
  try {
    execSync('git commit -m "feat(akun): OneSignal web push integration — bell + auto-tag student"', { stdio: 'inherit' });
  } catch { console.log('ℹ️  Nothing to commit.'); }
  execSync('git push', { stdio: 'inherit' });
  console.log('\n✅ Pushed!');
  fs.unlinkSync(process.argv[1]);
  console.log('🗑️  Self-deleted.');
} catch (e) {
  console.error('\n❌ Git failed:', e.message);
}
