# ReproBloom

Kısa hata bildirimlerini Discord içinde hazırlayın, özel önizlemeyi kontrol edin ve açıkça onayladıktan sonra paylaşın.

Prepare concise bug reports inside Discord, review a private preview, then explicitly share them.

[Türkçe](#türkçe) · [English](#english) · [MIT license](LICENSE) · [Security](SECURITY.md)

## Türkçe

### Amaç ve özellikler

Oyun, mod ve yazılım topluluklarında “çalışmıyor” mesajını tekrar edilebilir bir bildirime dönüştürmeye yardımcı olan gerçek bir Discord Gateway botudur. `/reprobloom` dört alanlı bir pencere açar:

- **Sorun ve sürüm:** en fazla 80 karakter; örneğin “1.2 sürümünde ayarlar menüsü donuyor”.
- **Tekrarlama adımları:** en fazla 220 karakter; sırayla yaptığınız kısa işlemler.
- **Beklenen sonuç:** en fazla 160 karakter.
- **Gerçekleşen sonuç:** en fazla 160 karakter.

Her alan zorunludur. Sınırlar UTF-16 birimidir; bazı emojiler iki veya daha fazla birim sayılır. Türkçe ve İngilizce form, önizleme, düğmeler ve raporlar vardır. `/reprobloom language:Türkçe` ile dili seçebilirsiniz; seçenek boşsa Discord dili Türkçe olanlarda Türkçe, diğerlerinde İngilizce kullanılır. Otomatik çeviri yapılmaz.

Önizleme yalnızca size görünür. **Bu kanalda paylaş** düğmesi aynı kanala tek bir düz metin rapor gönderir. **Vazgeç** taslağı bırakır. Yayın için otomatik onay, zamanlayıcı veya arka plan gönderimi yoktur. Etiketler ve bağlantı önizlemeleri kapalıdır; kullanıcı biçimlendirmesi kaçırılır. Bot herkese açık rapora kullanıcı kimliği veya isim eklemez; buna rağmen kanal bağlamı, zamanlama veya yazdıklarınız sizi tanıtabilir.

Bot sorunu doğrulamaz, çözüm üretmez, ticket açmaz, moderasyon yapmaz, dosya/log kabul etmez ve GitHub veya başka servise kayıt göndermez. Mesaj geçmişi, DM, ses, ekran görüntüsü veya ek okumaz. URL çekmez; AI veya analiz servisi kullanmaz. Uzun raporlar ve gizli güvenlik açıkları için uygun değildir. Güvenlik açığını topluluğun özel güvenlik kanalından bildirin.

### Gereksinimler

Windows, macOS veya Linux; [Node.js 24 LTS](https://nodejs.org/en/download) ve birlikte gelen npm; internet; kendi Discord uygulamanız ve bot tokenınız; bot ekleyebildiğiniz bir Discord sunucusu gerekir. Bu sürüm tek sunucuyu ve tek çalışan süreci destekler. Ayrı sunucular için ayrı uygulama/yapılandırma kullanın. Kaynak kodu düzenlemeniz gerekmez. Git yalnızca geliştirme/kontroller için gerekir; ZIP ile bot çalıştırmak için gerekmez.

### Developer Portal ve en az izinli davet

1. [Discord Developer Portal](https://discord.com/developers/applications) üzerinden **New Application** seçin. Bu bot için ayrı uygulama oluşturun.
2. **General Information** bölümündeki **Application ID** değerini alın. Bu kimlik token değildir.
3. **Bot** sayfasında bot kullanıcısını hazırlayın; gerekiyorsa **Reset Token** ile token oluşturun. Token parola kadar özeldir. Ekran paylaşımında göstermeyin, sohbet/issue içine yazmayın, GitHub'a göndermeyin. Sızarsa Portal'dan hemen yenileyin.
4. **Privileged Gateway Intents** altındaki Presence, Server Members ve Message Content seçeneklerini kapalı tutun. Kod yalnızca ayrıcalıksız `Guilds` intentini kullanır.
5. **Installation** bölümünde yalnızca **Guild Install** kullanın. OAuth2/URL Generator üzerinden `bot` ve `applications.commands` kapsamlarını; **View Channels** ve **Send Messages** izinlerini seçin. Administrator seçmeyin. Kurulum yardımcısı aynı izinlerle tıklanabilir davet bağlantısı gösterir; izin sayısı `3072` olur.
6. Botu hedef sunucuya davet edin. Bot ve kullanacak üyeler seçilen normal metin veya duyuru kanalında View Channel ve Send Messages izinlerine sahip olmalı; üyeler ayrıca Discord'da uygulama komutlarını kullanabilmeli. Kanal izinleri sunucu rol izinlerini geçersiz kılabilir. Thread, forum gönderisi, DM ve ses kanalı desteklenmez. Duyuru kanalına mesaj gönderir, crosspost yapmaz.
7. Discord **User Settings → Advanced → Developer Mode** seçeneğini açın. Hedef sunucunun adına sağ tıklayıp **Copy Server ID** alın. Kanal kimliği veya davet kodu kullanmayın.

Bot Manage Messages, Read Message History, Attach Files, Embed Links, Manage Channels/Roles veya Administrator istemez. Paylaşırken kanal, roller, gönderen üye ve bot üyesi REST üzerinden yeniden alınarak iki tarafın izinleri kontrol edilir. İzin kontrolü ile gönderim arasındaki değişiklikler Discord tarafından da uygulanır. Sunucu yöneticileri **Server Settings → Integrations** üzerinden komutun erişimini daraltabilir.

### Kurulum ve yapılandırma

GitHub'dan **Code → Download ZIP** ile indirin, arşivi çıkarın ve klasöre girin. Klasörü herkese açık/paylaşılan veya otomatik bulut eşitlemeli bir konumda tutmayın; yerel `.env` token içerir. Windows'ta `setup.cmd` dosyasına çift tıklayın. macOS/Linux'ta klasörde terminal açıp `bash setup.sh` çalıştırın. Yardımcı dosyalar kendi klasörüne geçer, kilitli bağımlılıkları kurar ve yapılandırma sihirbazını açar. Alternatif terminal adımları:

```sh
npm ci --ignore-scripts
npm run setup
```

Sihirbaz Application ID, Server ID ve gizli token ister. Token yazılırken yıldız dahil hiçbir karakter gösterilmez; bu normaldir. Yapıştırıp Enter'a basın. Ctrl+C iptal eder. `.env` yalnızca yeni dosya olarak yazılır; mevcut dosyanın üzerine yazılmaz. Unix'te dosya modu `0600` istenir; Windows'ta klasör erişimini kendi hesabınızla sınırlandırın. Token biçim kontrolü yapılır, gerçekliği kurulumda ağ üzerinden doğrulanmaz.

`.env.example` yalnızca alan isimlerini gösterir. Sihirbaz varken bu dosyayı düzenlemeniz gerekmez. Harici barındırmada `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID` adlarını sağlayıcının secret/environment arayüzüne girin. Mevcut süreç ortamındaki değerler yerel `.env` değerlerine önceliklidir. Tokenı komut satırı argümanına veya komut geçmişine yazmayın. Token değiştiğinde çalışan botu durdurun, eski `.env` dosyasını özel bir konuma taşıyın, sihirbazı tekrar çalıştırın ve eski dosyayı güvenli biçimde kaldırın.

Komutu kaydedin ve botu başlatın:

```sh
npm run register
npm start
```

Windows'ta `register.cmd`, ardından `start.cmd`; macOS/Linux'ta `bash register.sh`, ardından `bash start.sh` aynı işi yapar. Kayıt işlemi yalnızca bu uygulamanın seçili sunucudaki `/reprobloom` komutunu ekler/günceller, diğer komutları topluca silmez. Uygulamayı bu bota ayırmanız yine önerilir. Başlatma/kayıt TypeScript'i derlediği için geliştirme bağımlılıklarını atlamayın. Başarılı girişte “ReproBloom ready / hazır” görünür. Uygulama kimliği tokenın botuyla eşleşmiyorsa bot durur.

### Kullanım ve örnek

1. Botun yazabildiği bir metin kanalında `/reprobloom` yazın; isterseniz dili seçin.
2. “Sorun ve sürüm” için `1.2: ayarlar menüsü donuyor`, adımlar için `1. Oyunu aç\n2. Ayarlar düğmesine bas`, beklenen için `Ayarlar açılır`, gerçekleşen için `Menü yanıt vermiyor` yazın. Örnekteki `\n` yerine formda yeni satır kullanın.
3. Formu gönderin. Özel önizlemede raporun tamamını ve paylaşılacağı kanal bağlamını kontrol edin. İsim, e-posta, kullanıcıya özel yol, log, parola, token veya kişisel bilgi eklemeyin.
4. Paylaş veya vazgeç düğmesine basın. Sonuç özel önizlemenin yerine yazılır. Bot yayımlanan raporu düzenleme/silme düğmesi sunmaz; yanlış paylaşımı kanal moderatöründen sildirin.

Önizlemede düzenleme düğmesi yoktur; değişiklik için vazgeçip komutu yeniden açın. Bir üyenin sunucu başına tek aktif form/taslağı olabilir; yeni form eskisini geçersiz kılar. Form ve ardından önizleme ayrı ayrı beş dakikada biter. Süresi dolan veya bot yeniden başladığında geçersiz kalan düğmeler tekrar yayın yapamaz.

### Güvenlik, gizlilik ve sınırlar

Taslak metni, Discord kullanıcı/sunucu/kanal kimlikleri, rastgele nonce, dil, son kullanma zamanı ve önizleme mesaj kimliği yalnızca botun RAM'inde tutulur. Form aşaması rapor metni içermez. En fazla 100 aktif form/önizleme; en fazla 500 cooldown anahtarı vardır. Süresi dolmuş kayıtlar işlemlerde ve 30 saniyelik aralıklarla temizlenir. Taslak paylaş/vazgeç tıklamasında ağ işlemlerinden önce tüketilir; yeniden deneme aynı taslağı tekrar göndermez. Süreç kapanınca RAM verileri gider; özel/public Discord mesajları Discord'da kalabilir. RAM temizliği güvenli bellek silme garantisi değildir; operatör RAM'e erişebilir.

SDK'nın mesaj, kullanıcı ve üye önbellekleri kapalıdır. Veritabanı, rapor dosyası, rapor logu, telemetri veya yedek yoktur. Yalnızca başlangıç ve genel bağlantı/hata mesajları yazdırılır; ham Discord hatası veya token loglanmaz. Discord kendi hizmetinde etkileşimleri/mesajları işler; “özel önizleme” uçtan uca şifreli veya Discord'dan gizli demek değildir.

Kişi başına form açılışı 5 saniyede bir, kanal başına paylaşım 60 saniyede bir yapılır. Limit/izin/gönderim hatasında taslak tüketilmiş olabilir; yeni komut gerekir. Bellek doluysa yeni işlem reddedilir. Botun kendi otomatik REST tekrar denemesi kapalıdır; Discord oran sınırında bekleme olabilir. Ağ hatasında mesaj teslimi belirsiz olabilir: yeniden rapor hazırlamadan önce kanalı kontrol edin.

Basit filtre yaygın bağlantı/etiket biçimlerini, bazı kimlik bilgisi kalıplarını, kontrol ve görünmez Unicode karakterlerini reddeder. Bu bir veri kaybı önleme veya sır tespit garantisi değildir; e-posta, ad, özel yol ve farklı biçimli tokenlar kaçabilir. Kullanıcı her alanı kendi incelemelidir. Filtre sıradan `password: örnek` gibi metinleri de reddedebilir; görünmez karakter içeren bazı birleşik emojiler desteklenmez. Bildirimlerin doğruluğunu veya zararsızlığını onaylamaz. Mevcut topluluk kuralları ve insan moderasyonu gerekir.

### Botu çalışır tutma

Terminal ve bilgisayar açık kalmalı; uyku, kapanma ve internet kesintisi botu durdurur. Sürekli kullanım için Node.js 24 destekleyen bir host veya size ait sunucuda **tek** uzun ömürlü süreç çalıştırın; komut `npm start`, secret adları yukarıdadır. Web sunucusu/HTTP portu yoktur; yalnızca dışarıya Discord bağlantısı gerekir. Sağlayıcı süreci yeniden başlatabilir ancak eski taslaklar geri gelmez. Aynı uygulama/yapılandırmayı birden çok süreçte çalıştırmayın; bellek tabanlı sınırlar süreçler arasında paylaşılmaz. Bu depo sizin yerinize barındırma veya Discord tokenı sağlamaz. Durdurmak için terminalde Ctrl+C kullanın. Güncellemede önce durdurun, yeni kaynakları alın, `npm ci --ignore-scripts` çalıştırın; komut şeması değiştiyse tekrar kaydedin, sonra başlatın. `.env` dosyanızı özel tutun.

### Sorun giderme

- **node/npm bulunamadı veya sürüm uyarısı:** Node.js 24 LTS kurun, terminali yeniden açın; `node --version` 24.x göstermeli.
- **Yapılandırma hatası:** `npm run setup` kullanın; Application ID ve Server ID 17–20 rakamdır. Bot tokenı Client Secret veya Public Key değildir. Mevcut `.env` üzerine yazılmaz.
- **Komut görünmüyor:** doğru uygulamayı Guild Install ile davet edin, `npm run register` çalıştırın, Server ID'yi ve Integrations komut erişimini kontrol edin; Discord istemcisini yenileyin. Bot çevrimiçi olmalı.
- **Form reddedildi:** alan sınırları, boşluk-only alanlar, URL/etiket, gizli karakter veya kimlik bilgisi kalıbını kontrol edin; özel bilgi eklemeyin. Raporu kısaltıp yeniden başlayın.
- **Düğme çalışmıyor:** beş dakika geçmiş, yeni form eskisini değiştirmiş, bot yeniden başlamış veya düğme başka kullanıcı/kanal/mesaja ait olabilir. Komutu tekrar açın.
- **Paylaşım başarısız:** bot ve üyenin View Channel + Send Messages izinlerini ve kanal türünü kontrol edin. Kanal başına 60 saniye bekleyin. Ağ hatasında kanalı kontrol ettikten sonra yeniden başlayın.
- **Derleme/bağımlılık hatası:** proje klasöründe `npm ci --ignore-scripts` çalıştırın; `--omit=dev` kullanmayın. Kilit dosyasını rastgele değiştirmeyin.
- **Bot çevrimdışı:** terminal/host logundaki genel mesajları ve interneti kontrol edin. Tokenı paylaşmadan Portal'da yenileyip yapılandırmayı güncelleyin.

### Testler, katkı ve lisans

Geliştirme için Git ve Node.js 24 kullanın:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check`: Biome önerilen kuralları ve biçim kontrolü, katı TypeScript derlemesi (bağımlılık türleri dahil), Node testleri, kilit dosyasında izinli lisans/kayıt kaynağı/SHA-512/kurulum betiği kontrolü ve Git kaynaklarında sınırlı kimlik bilgisi kalıp taramasını çalıştırır. Kaynak taraması özel `.env` dosyalarını okumaz ve takip edilen özel ortam dosyasını reddeder. Örüntü taraması tam güvenlik denetimi değildir. Lisans metadatası denetlenir; tüm hukuki uyumun garantisi verilmez.

CI Ubuntu, Windows ve macOS 15 Intel üzerinde aynı komutları, üç Node yardımcısının sözdizimini, `bash -n setup.sh start.sh register.sh` ve temiz Git diff kontrolünü çalıştırır. İş akışı yalnızca `contents: read` iznine ve SHA ile sabitlenmiş resmi action'lara sahiptir; gerçek token kullanmaz. Testlerde Discord etkileşimleri taklit edilir: gerçek sunucu kurulumu, gizli token girişi, mobil/ekran okuyucu davranışı ve kesintisiz barındırma operatör tarafından ayrıca denenmelidir. VDS veya canlı Discord testi yapılmış varsaymayın.

[CONTRIBUTING.md](CONTRIBUTING.md) katkı adımlarını, [SECURITY.md](SECURITY.md) hassas raporlama yolunu açıklar. Kısa, somut PR'lar ve hata tekrarlama adımları beklenir; token, özel kullanıcı bilgisi veya özel log eklemeyin. Proje [MIT](LICENSE) lisanslıdır; Discord ve bağımlılık lisansları ayrıca geçerlidir.

## English

### Purpose and features

ReproBloom is a real Discord Gateway bot for game, mod and software communities. It turns a vague “it broke” into a concise report using `/reprobloom` and four required fields: **Problem and version** (80 units), **Steps to reproduce** (220), **Expected result** (160), and **Actual result** (160). Limits use UTF-16 units; some emoji take multiple units.

Forms, previews, buttons and report headings support Turkish and English. Choose `/reprobloom language:English` or Turkish explicitly; otherwise Turkish Discord locales use Turkish and all others use English. User text is never translated. The full preview is private to its author. **Share in this channel** explicitly publishes one plain-text message in the same channel; **Discard** abandons it. There is no scheduled or automatic publication. User formatting is escaped, mentions disabled, and link embeds suppressed. No author name or ID is added to the public report, but timing, context and your own text may identify you.

It does not diagnose or verify bugs, generate fixes, create tickets, moderate, accept files/logs, or submit GitHub/external issues. It cannot read message history, DMs, voice, images or attachments. It fetches no URLs and uses no AI/analytics service. It is unsuitable for long reports or confidential vulnerabilities; use your community's private security reporting route for those.

### Requirements

Windows, macOS or Linux; [Node.js 24 LTS](https://nodejs.org/en/download) with npm; internet; your own Discord application/token and a server where you can install bots. One configured server and one running process are supported. Use separate applications/configurations for separate servers. No source edits are needed. Git is required for development checks, not for running a downloaded ZIP.

### Developer Portal and permissions

1. Open the [Developer Portal](https://discord.com/developers/applications) and create a dedicated application. Copy **General Information → Application ID**.
2. On **Bot**, prepare its bot user and use **Reset Token** if needed. Treat the token as a password. Never show it on a stream, post it in chat/issues, or commit it. Rotate it immediately if exposed.
3. Leave all **Privileged Gateway Intents** off: Presence, Server Members, Message Content. Only the nonprivileged `Guilds` intent is used.
4. Under **Installation**, select **Guild Install** only. Use OAuth2/URL Generator with `bot` and `applications.commands` scopes. Select only **View Channels** and **Send Messages**, permissions integer `3072`. Never grant Administrator. The setup wizard prints a clickable invitation with those settings.
5. Invite the bot to your server. Both the member and bot need View Channel and Send Messages in the target ordinary text or announcement channel. Members also need permission to use application commands. Channel overwrites matter. Threads, forum posts, DMs and voice channels are unsupported; announcement messages are not crossposted.
6. Enable **User Settings → Advanced → Developer Mode**, right-click the target server and **Copy Server ID**. This is neither a channel ID nor an invite code.

No Manage Messages, Read Message History, Attach Files, Embed Links, Manage Channels/Roles or Administrator permission is needed. Before sharing, the bot freshly fetches the roles, channel and both member records via REST and checks both parties' permissions. Discord also enforces changes between this check and sending. Administrators may restrict command access under **Server Settings → Integrations**.

### Installation and configuration

Download **Code → Download ZIP** from GitHub, extract it and open its folder. Keep it private and outside shared/cloud-synced directories because local `.env` holds your token. On Windows double-click `setup.cmd`; on macOS/Linux open a terminal there and run `bash setup.sh`. Helpers change to their own directory, install locked dependencies and launch setup. Terminal alternative:

```sh
npm ci --ignore-scripts
npm run setup
```

Enter Application ID, Server ID, then the bot token. Token input is hidden with no stars; paste and press Enter. Ctrl+C cancels. The wizard creates `.env` exclusively and refuses overwriting an existing file. It requests mode `0600` on Unix; on Windows restrict folder access to your own account. Setup checks token shape, not validity against Discord.

`.env.example` documents names; you need not edit it. For hosting, enter `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID` in the provider's secret/environment interface. Existing process environment values override `.env`. Never put a token in command arguments or shell history. To rotate, stop the bot, move the existing `.env` somewhere private, rerun setup, then safely remove the old file.

Register the command and start:

```sh
npm run register
npm start
```

Windows helpers: `register.cmd`, then `start.cmd`. macOS/Linux: `bash register.sh`, then `bash start.sh`. Registration only upserts this application's `/reprobloom` in the configured guild; it does not bulk-replace unrelated commands. A dedicated application is still recommended. Launch/registration compile TypeScript, so keep development dependencies installed. Successful login prints “ReproBloom ready / hazır”. A token/application ID mismatch stops the bot.

### Usage

1. Run `/reprobloom` in an allowed channel, optionally choosing a language.
2. For example: problem `Settings freeze in v1.2`; steps `1. Open game` then a newline and `2. Click Settings`; expected `Settings open`; actual `Menu stops responding`.
3. Submit and review every section of the private preview and the channel context. Remove names, email addresses, private paths, logs, passwords, tokens and personal information.
4. Click Share or Discard. A private result replaces the preview. There is no public edit/delete control; ask a moderator to remove a mistaken public post.

To change text, discard and restart the command. One active form/draft per member/server is kept; a new form invalidates the old one even in another channel. The form and subsequent preview each expire after five minutes. Restarting the bot invalidates all old controls.

### Security, privacy and limits

Only RAM holds draft text, user/guild/channel IDs, random nonce, language, expiry and preview-message ID. Form records contain no report text. Limits: 100 active forms/previews and 500 cooldown keys. Expired records are pruned during operations and every 30 seconds. Share/Discard consumes a draft before any network await, preventing a second publication from the same draft. Shutdown clears RAM; Discord's private/public messages may remain. RAM cleanup does not guarantee secure memory erasure; the operator can inspect process memory.

SDK message/user/member caches are disabled. There is no database, report file, report logging, telemetry or backup. Console output contains startup and generic connection/error notices, never raw Discord errors or tokens. Discord processes and retains interactions/messages under its own service policies; “private preview” does not mean end-to-end encrypted or hidden from Discord.

Form opening is limited to once per member per five seconds; sharing is limited to once per channel per 60 seconds across members. Capacity, cooldown, permission or send errors can consume the draft; start a new command. Application REST retries are disabled, although Discord rate limits may queue requests. Network failures can leave delivery uncertain: inspect the channel before composing another report.

A small filter rejects common links/mentions, recognizable credential patterns, control characters and hidden Unicode. It is not a complete secret detector or data-loss prevention system. Names, emails, paths and differently formatted secrets can pass. Review all text yourself. Innocent `password: example` text may be rejected; some joined emoji containing invisible characters are unsupported. Reports remain unverified user content and need ordinary human moderation.

### Continuous operation

Keep the terminal/computer awake and connected. For continuous use, choose a host you control that supports Node.js 24 and one long-running `npm start` process, using the secret names above. No HTTP port/web server is needed, only outbound Discord access. Automatic host restarts lose old drafts. Never run multiple instances with the same application/configuration; in-memory cooldowns are not shared. This project does not provide credentials or hosting. Stop with Ctrl+C. To update, stop, obtain the new source, run `npm ci --ignore-scripts`, register again if the command schema changed, then restart. Preserve `.env` privately.

### Troubleshooting

- **node/npm missing or version mismatch:** install Node.js 24 LTS, reopen your terminal, check `node --version` reports 24.x.
- **Invalid configuration:** use `npm run setup`. IDs need 17–20 digits. The Bot token is not Client Secret/Public Key. Existing `.env` is intentionally not overwritten.
- **Missing command:** check Guild Install, application identity and Server ID; run `npm run register`, inspect Integrations command access, refresh Discord and ensure the bot is online.
- **Rejected form:** shorten fields and remove blank-only values, links/mentions, hidden characters or credential patterns. Do not add private details.
- **Expired controls:** five minutes elapsed, a newer form replaced the old draft, the bot restarted, or the control belongs to another user/channel/message. Restart `/reprobloom`.
- **Share failed:** verify both parties' channel permissions/type and wait 60 seconds after a channel share attempt. Check the channel after network errors before retrying.
- **Build/dependency failure:** run `npm ci --ignore-scripts` in the project folder. Do not omit dev dependencies or randomly change the lockfile.
- **Offline bot:** check the host/terminal's generic notices and network. Rotate a bad token privately in the Portal and update setup.

### Tests, contributing and license

With Git and Node.js 24:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
```

`check` runs Biome's recommended lint/format rules, strict TypeScript including dependency types, Node tests, lockfile license/registry/SHA-512/no-install-script checks and a limited source credential-pattern scan. The scan never reads private `.env` files and rejects tracked private configuration. Pattern scans are not comprehensive security audits; license metadata checks do not guarantee all legal compliance.

CI runs these on Ubuntu, Windows and macOS 15 Intel, plus Node syntax for three helpers, `bash -n setup.sh start.sh register.sh`, and `git diff --exit-code`. It uses only `contents: read`, SHA-pinned official actions and no live token. Tests mock Discord interactions; real installation, hidden-token entry, mobile/screen-reader usability and continuous hosting require operator validation. Do not infer live Discord or VDS testing from automated checks.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Keep changes small and reproducible; include no credentials, private member information or private logs. Licensed under [MIT](LICENSE); Discord terms and dependency licenses also apply.

## Official references / Resmi kaynaklar

- [Discord interactions and responses](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Current components, including modal Labels](https://docs.discord.com/developers/components/reference)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Permissions](https://docs.discord.com/developers/topics/permissions)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)
- [discord.js documentation](https://discord.js.org/docs/packages/discord.js/14.27.0)
