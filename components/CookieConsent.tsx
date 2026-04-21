'use client';

import { useEffect } from 'react';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

export default function CookieConsent() {
  useEffect(() => {
    import('vanilla-cookieconsent').then((cc) => {
      cc.run({
        guiOptions: {
          consentModal: {
            layout: 'box inline',
            position: 'bottom right',
            equalWeightButtons: false,
            flipButtons: false,
          },
          preferencesModal: {
            layout: 'box',
            position: 'right',
            equalWeightButtons: true,
            flipButtons: false,
          },
        },
        categories: {
          necessary: {
            readOnly: true,
          },
        },
        language: {
          default: 'en',
          autoDetect: 'browser',
          translations: {
            en: {
              consentModal: {
                title: 'We use cookies',
                description:
                  'FlashcardAI uses essential cookies to keep you logged in and make the app work. No tracking, no advertising cookies. <a href="/cookies" class="cc__link">Learn more</a>',
                acceptAllBtn: 'Accept',
                showPreferencesBtn: 'Manage preferences',
                footer: '<a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/impressum">Impressum</a>',
              },
              preferencesModal: {
                title: 'Cookie preferences',
                acceptAllBtn: 'Accept all',
                savePreferencesBtn: 'Save preferences',
                closeIconLabel: 'Close',
                serviceCounterLabel: 'Service|Services',
                sections: [
                  {
                    title: 'Essential cookies <span class="pm__badge">Always active</span>',
                    description:
                      'These cookies are required for the app to function. They keep you logged in and maintain your session. They cannot be disabled.',
                    linkedCategory: 'necessary',
                  },
                  {
                    title: 'More information',
                    description:
                      'For questions about our cookie policy or your personal data, contact us at <a class="cc__link" href="mailto:privacy@flashcardai.app">privacy@flashcardai.app</a>.',
                  },
                ],
              },
            },
            de: {
              consentModal: {
                title: 'Wir verwenden Cookies',
                description:
                  'FlashcardAI verwendet ausschließlich technisch notwendige Cookies, um Sie angemeldet zu halten. Keine Tracking- oder Werbe-Cookies. <a href="/cookies" class="cc__link">Mehr erfahren</a>',
                acceptAllBtn: 'Akzeptieren',
                showPreferencesBtn: 'Einstellungen verwalten',
                footer: '<a href="/privacy">Datenschutzerklärung</a> · <a href="/terms">Nutzungsbedingungen</a> · <a href="/impressum">Impressum</a>',
              },
              preferencesModal: {
                title: 'Cookie-Einstellungen',
                acceptAllBtn: 'Alle akzeptieren',
                savePreferencesBtn: 'Einstellungen speichern',
                closeIconLabel: 'Schließen',
                serviceCounterLabel: 'Dienst|Dienste',
                sections: [
                  {
                    title: 'Notwendige Cookies <span class="pm__badge">Immer aktiv</span>',
                    description:
                      'Diese Cookies sind für den Betrieb der App erforderlich. Sie ermöglichen das Einloggen und halten Ihre Sitzung aufrecht.',
                    linkedCategory: 'necessary',
                  },
                  {
                    title: 'Weitere Informationen',
                    description:
                      'Bei Fragen zu Cookies oder Ihren personenbezogenen Daten wenden Sie sich an <a class="cc__link" href="mailto:privacy@flashcardai.app">privacy@flashcardai.app</a>.',
                  },
                ],
              },
            },
          },
        },
      });
    });
  }, []);

  return null;
}
