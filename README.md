# Odatlar daftari: Android ilova

Salomatlik, rivojlanish va shaxsiy o'sish bo'yicha kundalik odatlarni kuzatadigan ilova.
Kaloriya bo'limi, 42 ta tayyor odat g'oyasi, raqamli odatlar (qadam, suv, bet) va yurish rejimi ham bor.
Ma'lumotlar telefonning o'zida saqlanadi, internet kerak emas. Har kuni belgilangan vaqtda eslatma chiqadi.

## APK'ni qanday olish mumkin

1. github.com saytida **New repository** tugmasini bosing. Nomi: `odatlar-daftari`. **Private** qilsangiz ham bo'ladi.
2. Ochilgan sahifada **uploading an existing file** havolasini bosing.
3. Zip'dan chiqarilgan `odatlar-daftari` papkasining **ichidagi hamma narsani** belgilab, sahifaga sudrab tashlang. `.github` papkasi ham tushishi shart.
4. **Commit changes** tugmasini bosing.
5. **Actions** bo'limida "APK yig'ish" ishga tushadi. 5–10 daqiqa kuting, yashil belgi chiqsin.
6. Repo bosh sahifasining o'ng tomonida **Releases** bo'limi bor. Telefonda shuni oching va `odatlar-daftari.apk` ni yuklab oling.
7. Faylni oching. Telefon "noma'lum manbadan o'rnatish"ga ruxsat so'raydi, ruxsat bering.

Agar `.github` papkasi yuklanmay qolsa (Windows yashirin papkalarni ko'rsatmasligi mumkin), repoda
**Add file → Create new file** ni bosing. Nomiga `.github/workflows/apk.yml` deb yozing va shu fayl matnini joylang.

## Veb versiyadagi ma'lumotlarni ko'chirish

Veb ilovada **Zaxira nusxa → Nusxa olish** ni bosing. APK'da **Zaxira nusxa** bo'limiga matnni joylab, **Tiklash** ni bosing.

## Yangilash

Biror faylni o'zgartirib, yana yuklasangiz, GitHub yangi APK yig'adi. Uni eskisining ustidan o'rnatsangiz bo'ladi,
ma'lumotlar o'chmaydi. Imzo kaliti (`android/app/odatlar.keystore`) loyiha ichida turibdi, uni o'chirmang.

## Tuzilishi

- `src/app.js`: ilova mantig'i (odatlar, seriyalar, eslatmalar, kaloriya)
- `www/index.html`: ko'rinish va dizayn
- `android/`: Android loyihasi (Capacitor 8)
- `.github/workflows/apk.yml`: APK yig'ib, Release'ga qo'yadigan GitHub Actions
