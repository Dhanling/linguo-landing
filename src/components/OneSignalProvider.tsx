'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const ONESIGNAL_APP_ID = 'c8782cfd-fec1-450b-b72b-d1869e5faa5f';

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
          safari_web_id: 'web.onesignal.auto.c8782cfd-fec1-450b-b72b-d1869e5faa5f',
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
