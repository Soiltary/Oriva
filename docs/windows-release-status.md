# Windows 1.0.0 release gate — 2026-10-24

**No Stable Windows release or official Windows ZIP is published.** The existing unsigned x64 candidate has product/file version 1.0.0 and the intended production HTTPS host, but it is incompatible with the API currently deployed. Publishing its bytes independently on GitHub would not resolve that incompatibility.

The existing Site's current version/source provenance was rechecked. Its API source was executed only in an isolated in-memory SQLite/R2 fixture with generated synthetic credentials and no networking. No production login, record read/write, migration or deployment occurred. The same fixture exercised the candidate API:

| Contract | Current deployed source, local fixture | Candidate API, local fixture |
|---|---|---|
| Registration / login | 201 / 200 | 201 / 200 |
| Native `/api/library?limit=100` | 404 | 200 |
| Item revision required by native mutations | Missing | Present |
| Article creation | 400 | 201 |
| Stale edit | Accepted with 200; newer note lost | Rejected with 409; newer note preserved |

The native client has a fixed production origin and uses the library/revision contracts above. A client-only fallback to the old full-snapshot write contract would preserve the known lost-update defect. It would not provide atomic concurrency protection or the missing article/history schema. Replacing the candidate with an older development binary or silently disabling features is not a verified solution.

## Safe release order

1. Obtain a complete paired Sites-managed D1/R2 capture and verified isolated restoration, using project-scoped provider assistance. See [recovery plan](backup-recovery.md) and [provider request](provider-recovery-request.md).
2. Rehearse candidate migrations and coordinated old/new-client behavior on isolated resources; resolve remaining data-integrity and native acceptance gates.
3. Publish and verify the matching API through the existing Site workflow only after those gates pass.
4. Exercise the native client against the matching isolated API and complete the remaining Windows acceptance. Preserve the 1.0.0 public / 2.0.0 updater compatibility transition described in [update transition](update-transition.md).
5. Only then publish `v1.0.0` / `Oriva v1.0.0 — Initial Stable Release`, the verified Windows ZIP and matching SHA256SUMS. Verify public downloads before adding direct asset links. Activate same-origin updater aliases/feeds separately after verification; legacy clients do not follow GitHub redirects.

GitHub source write permission is confirmed. The current connector advertises Git-data/content writes but no Release creation or asset-upload operation. After technical gates pass, publication can use an authenticated GitHub Releases browser session or a suitable authenticated publisher. Fine-grained API publication needs **Contents: write** restricted to `Soiltary/Oriva`; no administrator token or credentials in chat are needed. This capability limitation is separate from the API compatibility blocker.

## Dependency security follow-up

The new audit found seven advisories not present in the earlier audit result: one high, four moderate and two low. The resolved graph was patched to `undici 7.30.1` and `fast-uri 3.1.9`; the subsequent audit reported zero known advisories. These are JavaScript dependency/tooling findings, not proof of an exploit in the WinHTTP executable. No package lifecycle scripts ran.

The global seven-day package-age rule remains. The already-published security fix `fast-uri@3.1.9` has a documented **exact-version-only** age exception, with its registry integrity recorded in the lockfile; no other version/package receives an exemption. It reaches seven days on 2026-10-26 at 23:05 UTC. `undici 7.30.1` already met the normal age rule. References: [undici high-severity fix](https://github.com/advisories/GHSA-xjj6-f33q-929c), [undici EventSource fix](https://github.com/advisories/GHSA-4qv8-2p9j-2685), [fast-uri fix](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [pnpm exact-version age exceptions](https://pnpm.io/settings/dependency-resolution#minimumreleaseageexclude).

## ملخص عربي

لم يُنشر إصدار Windows مستقر. أكد اختبار اصطناعي معزول أن API المنشور حاليًا يعيد 404 للمكتبة و400 لإنشاء المقالات، ولا يعيد أرقام الإصدارات اللازمة لتعديلات التطبيق. وقَبِل تعديلًا قديمًا طمس الملاحظة الأحدث؛ رفض API المرشح الحالة نفسها برمز409 وحافظ عليها. لم يُستخدم أي حساب إنتاج أو تُعدّل بياناته.

رفع ملف Windows إلى GitHub وحده لا يصلح هذا التعارض. يلزم أولًا إثبات استعادة D1 وR2 المقترنة، ثم تجربة الترحيلات وتوافق العملاء، ونشر API المطابق بأمان وإكمال قبول Windows. يبقى انتقال التحديث من1.5.3 عبر ترتيب التوافق2.0.0 محفوظًا، مع بقاء رقم المنتج1.0.0. لم تتغير بيانات التحديث الحية ولم يُنشأ الوسم الرسمي.

صُححت تنبيهات الاعتماديات بإصدارَي undici7.30.1 وfast-uri3.1.9، وأصبح الفحص بلا تنبيهات معروفة. بقيت قاعدة الانتظار سبعة أيام، مع استثناء موثق لإصدار fast-uri3.1.9 الأمني المحدد فقط؛ لم تُشغّل سكربتات تثبيت الحزم. صلاحية كتابة المصدر على GitHub متاحة، لكن الموصل لا يوفر عملية إنشاء Release أو رفع أصوله؛ يلزم بعد اجتياز البوابات متصفح GitHub مسجل الدخول أو ناشر معتمد بصلاحية Contents:write لهذا المستودع فقط، دون إرسال مفاتيح في المحادثة.
