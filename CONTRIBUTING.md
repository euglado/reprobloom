# Contributing / Katkı

Use Node.js 24 and Git. Fork and create a small branch; run `npm ci --ignore-scripts`, `npm run check` and `npm audit --audit-level=low`. Run `bash -n setup.sh start.sh register.sh` when Bash is available. Explain the user-visible problem, resulting behavior and actual validation. Keep Discord permissions/intents minimal, drafts bounded, publication explicit, and errors free of raw secrets. Tests must mock Discord; never put credentials in CI. Keep Turkish and English docs synchronized. Do not add authorship claims. Local generated `dist` and private `.env` stay ignored.

Node.js 24 ve Git kullanın. Fork üzerinde küçük bir dal açın; `npm ci --ignore-scripts`, `npm run check`, `npm audit --audit-level=low` çalıştırın. Bash varsa `bash -n setup.sh start.sh register.sh` uygulayın. Kullanıcının sorununu, değişen davranışı ve gerçek test sonuçlarını yazın. İzin/intents minimum, taslaklar sınırlı, paylaşım açık onaylı, hatalar gizli bilgiden arındırılmış kalsın. Discord'u testlerde taklit edin; CI'ye token koymayın. İki dilde belgeleri güncelleyin; yazarlık iddiası eklemeyin. `dist` ve özel `.env` takip edilmez.

Ordinary bug reports may use GitHub issues with safe reproduction steps. Security reports must follow SECURITY.md. Genel hataları temizlenmiş tekrarlama adımlarıyla issue olarak açabilirsiniz; güvenlik sorunları için SECURITY.md kullanın.
