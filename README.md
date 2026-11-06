# ¡Hola! — Spanisch-Vokabeltrainer

Eine responsive, installierbare Web-App zum Sammeln und Üben spanischer Vokabeln. Funktioniert auf Handy, Tablet und PC.

## Funktionen
- Vokabeln mit deutscher Übersetzung und optionalem Beispielsatz speichern
- Spanische Wörter über die Browser-Sprachausgabe anhören
- Üben in beide Übersetzungsrichtungen oder die spanische Schreibweise trainieren
- Vokabeln suchen, löschen und Lernfortschritt ansehen
- Wörter aus einem Foto per OCR erkennen lassen (Tesseract.js; benötigt beim ersten Laden eine Internetverbindung)
- Daten lokal im Browser speichern; die App kann als PWA installiert werden

## Starten
Die Dateien können über einen statischen Webserver bereitgestellt werden. Für Service Worker und Installation als PWA ist HTTPS (oder localhost) erforderlich. Beim ersten Start werden Beispielvokabeln angezeigt. OCR und Google Fonts benötigen eine Internetverbindung.

> Hinweis: Vokabeln werden aktuell nur im lokalen Browser gespeichert und nicht zwischen Geräten synchronisiert. Für dieselbe Sammlung auf mehreren Geräten wäre später ein Backend/Konto nötig.
